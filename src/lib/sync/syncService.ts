import * as Crypto from 'expo-crypto';
import {settingsStorage} from '../storage';
import {
  WatchListKeys,
  watchListStorage,
  type WatchListItem,
} from '../storage/WatchListStorage';
import {mainStorage} from '../storage/StorageService';
import useDownloadsStore, {type DownloadItem} from '../zustand/downloadsStore';
import useWatchListStore from '../zustand/watchListStore';
import {getSafEntryName, isSafDownloadLocation} from '../downloadLocation';
import {
  getTombstoneKey,
  getDownloadMediaKey,
  mergeSyncManifests,
  VEGA_SYNC_SCHEMA_VERSION,
  type SyncTombstone,
  type SyncedDownload,
  type SyncedWatchListItem,
  type VegaSyncManifest,
} from './manifest';
import {
  readMobileSyncManifests,
  resolveMobileSyncFileWithLegacyFallback,
  writeMobileSyncManifest,
} from './mobileManifestStorage';

const DEVICE_ID_KEY = 'vega-sync-device-id';
const REVISION_KEY = 'vega-sync-revision';
const TOMBSTONES_KEY = 'vega-sync-tombstones';
const PUBLISH_DELAY_MS = 3000;

let initialized = false;
let applyingRemoteState = false;
let publishTimer: ReturnType<typeof setTimeout> | undefined;
let syncRequest: Promise<void> | undefined;
let previousDownloads: Record<string, DownloadItem> = {};
let previousWatchList: WatchListItem[] = [];

const getDeviceId = () => {
  const existing = mainStorage.getString(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = Crypto.randomUUID();
  mainStorage.setString(DEVICE_ID_KEY, created);
  return created;
};

const getTombstones = (): Record<string, SyncTombstone> =>
  mainStorage.getObject<Record<string, SyncTombstone>>(TOMBSTONES_KEY) || {};

const saveTombstones = (tombstones: Record<string, SyncTombstone>) =>
  mainStorage.setObject(TOMBSTONES_KEY, tombstones);

const addTombstone = (
  kind: SyncTombstone['kind'],
  id: string,
  mediaKey?: string,
) => {
  const tombstones = getTombstones();
  const key = getTombstoneKey(kind, id);
  tombstones[key] = {kind, id, mediaKey, deletedAt: Date.now()};
  saveTombstones(tombstones);
};

const getRelativePath = (item: DownloadItem) =>
  [
    (item.showName || item.title).replace(/[^a-z0-9]/gi, '_').toLowerCase(),
    ...(item.type === 'series' && item.seasonTitle
      ? [item.seasonTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()]
      : []),
    getSafEntryName(item.finalDocumentUri || item.filePath) ||
      item.displayFileName ||
      item.id,
  ].join('/');

const toSyncedDownload = (item: DownloadItem): SyncedDownload => {
  const download: SyncedDownload = {
    id: item.id,
    title: item.title,
    showName: item.showName,
    episodeName: item.episodeName,
    seasonTitle: item.seasonTitle,
    type: item.type,
    imdbId: item.imdbId,
    poster: item.poster,
    background: item.background,
    synopsis: item.synopsis,
    provider: item.provider,
    infoUrl: item.infoUrl,
    sourceLink: item.sourceLink,
    relativePath: getRelativePath(item),
    totalBytes: item.totalBytes,
    completedAt: item.completedAt || item.updatedAt,
    updatedAt: item.updatedAt,
  };
  download.mediaKey = getDownloadMediaKey(download);
  return download;
};

const toSyncedWatchListItem = (item: WatchListItem): SyncedWatchListItem => ({
  ...item,
  updatedAt: item.updatedAt || 0,
});

const buildManifest = (): VegaSyncManifest => {
  const revision = (mainStorage.getNumber(REVISION_KEY) || 0) + 1;
  mainStorage.setNumber(REVISION_KEY, revision);
  const downloads = Object.fromEntries(
    Object.values(useDownloadsStore.getState().downloads)
      .filter(item => item.status === 'completed')
      .map(item => [item.id, toSyncedDownload(item)]),
  );
  const watchlist = Object.fromEntries(
    watchListStorage
      .getWatchList()
      .map(item => [item.link, toSyncedWatchListItem(item)]),
  );
  return {
    schemaVersion: VEGA_SYNC_SCHEMA_VERSION,
    deviceId: getDeviceId(),
    revision,
    generatedAt: Date.now(),
    downloads,
    history: {},
    watchlist,
    tombstones: getTombstones(),
  };
};

export const publishSyncManifest = async (): Promise<void> => {
  const location = settingsStorage.getDownloadLocationConfig();
  if (!location || !isSafDownloadLocation(location)) {
    return;
  }
  await writeMobileSyncManifest(location, buildManifest());
};

const schedulePublish = () => {
  if (applyingRemoteState || publishTimer) {
    return;
  }
  publishTimer = setTimeout(() => {
    publishTimer = undefined;
    publishSyncManifest().catch(error =>
      console.warn('[VegaSync] Failed to publish manifest:', error),
    );
  }, PUBLISH_DELAY_MS);
};

const applyRemoteDownloads = async (
  downloads: Record<string, SyncedDownload>,
) => {
  const location = settingsStorage.getDownloadLocationConfig();
  if (!location || !isSafDownloadLocation(location)) {
    return;
  }
  for (const item of Object.values(downloads)) {
    const store = useDownloadsStore.getState();
    const equivalentEntries = Object.entries(store.downloads).filter(
      ([, candidate]) =>
        candidate.status === 'completed' &&
        getDownloadMediaKey(toSyncedDownload(candidate)) === item.mediaKey,
    );
    const existing = equivalentEntries
      .map(([, candidate]) => candidate)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (
      existing?.status === 'completed' &&
      existing.updatedAt >= item.updatedAt
    ) {
      equivalentEntries
        .filter(([id]) => id !== existing.id)
        .forEach(([id]) => store.removeDownload(id));
      continue;
    }
    const filePath = await resolveMobileSyncFileWithLegacyFallback(
      location,
      item.relativePath,
    );
    if (!filePath) {
      continue;
    }
    store.enqueueDownload({
      ...item,
      url: '',
      filePath,
      finalDocumentUri: filePath,
      displayFileName: item.relativePath.split('/').pop(),
      status: 'completed',
      sourceType: 'http',
      isTorrent: false,
      downloadedBytes: item.totalBytes,
      canPause: false,
      canResume: false,
      createdAt: item.completedAt,
      updatedAt: item.updatedAt,
      completedAt: item.completedAt,
      downloadLocation: location,
    });
    equivalentEntries
      .filter(([id]) => id !== item.id)
      .forEach(([id]) => store.removeDownload(id));
  }
};

const applyRemoteWatchList = (
  watchlist: Record<string, SyncedWatchListItem>,
) => {
  const items = Object.values(watchlist).sort(
    (a, b) => a.updatedAt - b.updatedAt,
  );
  mainStorage.setArray(WatchListKeys.WATCH_LIST, items);
  useWatchListStore.setState({watchList: items});
};

const applyTombstones = (tombstones: Record<string, SyncTombstone>) => {
  const store = useDownloadsStore.getState();
  for (const tombstone of Object.values(tombstones)) {
    if (tombstone.kind === 'download') {
      for (const item of Object.values(store.downloads)) {
        const matches =
          item.id === tombstone.id ||
          (tombstone.mediaKey &&
            item.status === 'completed' &&
            getDownloadMediaKey(toSyncedDownload(item)) === tombstone.mediaKey);
        if (matches && tombstone.deletedAt >= item.updatedAt) {
          store.removeDownload(item.id);
        }
      }
    }
  }
};

const runSharedFolderSync = async (): Promise<void> => {
  const location = settingsStorage.getDownloadLocationConfig();
  if (!location || !isSafDownloadLocation(location)) {
    return;
  }
  const manifests = await readMobileSyncManifests(location);
  const localManifest = buildManifest();
  const merged = mergeSyncManifests([...manifests, localManifest]);
  applyingRemoteState = true;
  try {
    saveTombstones(merged.tombstones);
    applyTombstones(merged.tombstones);
    await applyRemoteDownloads(merged.downloads);
    applyRemoteWatchList(merged.watchlist);
  } finally {
    applyingRemoteState = false;
  }
  previousDownloads = useDownloadsStore.getState().downloads;
  previousWatchList = watchListStorage.getWatchList();
  await publishSyncManifest();
};

export const syncFromSharedFolder = (): Promise<void> => {
  if (!syncRequest) {
    syncRequest = runSharedFolderSync().finally(() => {
      syncRequest = undefined;
    });
  }
  return syncRequest;
};

export const initializeSyncService = async (): Promise<void> => {
  if (!initialized) {
    initialized = true;
    previousDownloads = useDownloadsStore.getState().downloads;
    previousWatchList = watchListStorage.getWatchList();
    useDownloadsStore.subscribe(state => {
      if (applyingRemoteState) {
        previousDownloads = state.downloads;
        return;
      }
      for (const [id, item] of Object.entries(previousDownloads)) {
        if (item.status === 'completed' && !state.downloads[id]) {
          addTombstone(
            'download',
            id,
            getDownloadMediaKey(toSyncedDownload(item)),
          );
        }
      }
      previousDownloads = state.downloads;
      schedulePublish();
    });
    useWatchListStore.subscribe(state => {
      if (applyingRemoteState) {
        previousWatchList = watchListStorage.getWatchList();
        return;
      }
      const currentLinks = new Set(state.watchList.map(item => item.link));
      for (const item of previousWatchList) {
        if (!currentLinks.has(item.link)) {
          addTombstone('watchlist', item.link);
        }
      }
      previousWatchList = watchListStorage.getWatchList();
      schedulePublish();
    });
  }
  await syncFromSharedFolder();
};

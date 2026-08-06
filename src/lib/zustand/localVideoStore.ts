import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import {createZustandStorage} from '../storage/StorageService';

export interface LocalVideoAssociation {
  // Same value as getEpisodeIdentity(episode) — the episode/movie this
  // local file belongs to.
  episodeKey: string;
  // The continue-watching entry this was picked from, kept only for
  // context/debugging; not relied on for lookups.
  continueWatchingId?: string;
  uri: string;
  name?: string;
  updatedAt: number;
}

interface LocalVideoState {
  associations: Record<string, LocalVideoAssociation>;
  setLocalVideo: (
    episodeKey: string,
    uri: string,
    name?: string,
    continueWatchingId?: string,
  ) => void;
  clearLocalVideo: (episodeKey: string) => void;
}

// Intentionally a separate, device-local-only store — NOT part of
// continueWatchingStore and NOT touched by src/lib/sync/syncService.ts.
// A local video file only exists on this device, so it should never be
// carried over (or wiped out) by the cross-device shared-folder sync.
const useLocalVideoStore = create<LocalVideoState>()(
  persist(
    set => ({
      associations: {},
      setLocalVideo: (episodeKey, uri, name, continueWatchingId) => {
        if (!episodeKey) {
          return;
        }
        set(state => ({
          associations: {
            ...state.associations,
            [episodeKey]: {
              episodeKey,
              continueWatchingId,
              uri,
              name,
              updatedAt: Date.now(),
            },
          },
        }));
      },
      clearLocalVideo: episodeKey => {
        if (!episodeKey) {
          return;
        }
        set(state => {
          if (!(episodeKey in state.associations)) {
            return state;
          }
          const next = {...state.associations};
          delete next[episodeKey];
          return {associations: next};
        });
      },
    }),
    {
      name: 'local-video-storage',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);

export default useLocalVideoStore;

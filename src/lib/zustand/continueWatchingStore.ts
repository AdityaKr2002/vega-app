import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import type {EpisodeLink} from '../providers/types';
import {createZustandStorage} from '../storage/StorageService';

export interface ContinueWatchingItem {
  id: string;
  title: string;
  episodeTitle?: string;
  episode: EpisodeLink;
  type: string;
  poster?: string;
  background?: string;
  providerValue: string;
  infoUrl: string;
  position: number;
  duration: number;
  updatedAt: number;
  // When the user picked a local video file for this item, we remember its
  // uri (and display name) so re-opening it from Continue Watching can
  // resume playback without prompting the file picker again.
  localVideoUri?: string;
  localVideoName?: string;
}

interface ContinueWatchingState {
  items: ContinueWatchingItem[];
  upsertItem: (item: ContinueWatchingItem) => void;
  updateProgress: (id: string, position: number, duration: number) => void;
  setLocalVideo: (
    id: string,
    localVideoUri?: string,
    localVideoName?: string,
  ) => void;
  removeItem: (id: string) => void;
}

const useContinueWatchingStore = create<ContinueWatchingState>()(
  persist(
    set => ({
      items: [],
      upsertItem: item =>
        set(state => ({
          items: [
            item,
            ...state.items.filter(existing => existing.id !== item.id),
          ]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 30),
        })),
      updateProgress: (id, position, duration) =>
        set(state => ({
          items: state.items
            .map(item =>
              item.id === id
                ? {...item, position, duration, updatedAt: Date.now()}
                : item,
            )
            .sort((a, b) => b.updatedAt - a.updatedAt),
        })),
      setLocalVideo: (id, localVideoUri, localVideoName) =>
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? {...item, localVideoUri, localVideoName} : item,
          ),
        })),
      removeItem: id =>
        set(state => ({items: state.items.filter(item => item.id !== id)})),
    }),
    {
      name: 'continue-watching-storage',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);

export default useContinueWatchingStore;

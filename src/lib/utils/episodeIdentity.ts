// A stable identity for an episode/movie link, used anywhere we need to
// know whether "this is the same thing being watched" across renders,
// hooks, or persisted storage (e.g. continue-watching sync, local-video
// associations). Kept in one place so every consumer agrees on the same
// field-priority order.
export interface EpisodeIdentityLike {
  sourceLink?: string;
  id?: string;
  link?: string;
}

export const getEpisodeIdentity = (episode?: EpisodeIdentityLike): string =>
  episode?.sourceLink || episode?.id || episode?.link || '';

/**
 * Pure logic for turning Plex watch history into watch-history entries.
 *
 * `npm run sync:plex` uses the first half to decide which Plex watches are new
 * and what to call each film; the local /review page uses the second half to
 * record your better/worse answer for each one, in watch order. Nothing here
 * touches the network or the filesystem, so all of it is unit-tested.
 */

export type WatchEntry = {
  order: number;
  title: string;
  tmdbId?: number;
  dateWatched: string;
  betterThanPrevious: boolean | null;
};

export type PosterEntry = {
  tmdbId: number | null;
  posterPath: string | null;
  matchedTitle: string | null;
  year: string | null;
  match: "exact" | "fuzzy" | "none";
};

export type PosterMap = Record<string, PosterEntry>;

/** One row of Plex's watch history, reduced to the fields the sync uses. */
export type PlexHistoryItem = {
  historyKey: string;
  ratingKey?: string;
  title: string;
  type: string;
  viewedAt: number;
  accountID?: number;
};

/** A Plex watch waiting for its better/worse answer. */
export type QueuedWatch = {
  /** Plex's history key: identifies this one viewing. */
  plexKey: string;
  /** The title the entry will be recorded under (see canonicalTitle). */
  title: string;
  plexTitle: string;
  tmdbId: number | null;
  /** Epoch seconds. */
  viewedAt: number;
  dateWatched: string;
  poster: { posterPath: string; matchedTitle: string; year: string | null } | null;
};

export type WatchQueue = {
  pending: QueuedWatch[];
  /** Plex history keys marked "not a real watch", so syncs skip them. */
  dismissed: string[];
  /** Enough to undo the most recent answer. */
  lastAnswered: {
    watch: QueuedWatch;
    /** Order of the history entry it created; null for a dismissal. */
    addedOrder: number | null;
    addedPoster: boolean;
  } | null;
};

export type ReviewState = {
  history: WatchEntry[];
  queue: WatchQueue;
  posters: PosterMap;
};

export type Answer = "better" | "worse" | "skip" | "dismiss";

export const emptyQueue = (): WatchQueue => ({
  pending: [],
  dismissed: [],
  lastAnswered: null,
});

/** The calendar date (YYYY-MM-DD) of an epoch-seconds time in a time zone. */
export function localDate(epochSeconds: number, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(epochSeconds * 1000));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/**
 * The Plex watches that are not yet in the history or the queue, oldest first.
 *
 * "New" means watched after the last date in the history. Watches on that
 * date itself are kept unless a film of the same name is already recorded on
 * it, so a sync never duplicates the last films you logged by hand.
 */
export function selectNewWatches(
  items: PlexHistoryItem[],
  history: WatchEntry[],
  queue: WatchQueue,
  options: { accountID?: number; timeZone?: string } = {}
): PlexHistoryItem[] {
  const lastDate = history.reduce(
    (latest, e) => (e.dateWatched > latest ? e.dateWatched : latest),
    ""
  );
  const recordedOnLastDate = new Set(
    history
      .filter((e) => e.dateWatched === lastDate)
      .map((e) => e.title.toLowerCase())
  );
  const seen = new Set([
    ...queue.pending.map((w) => w.plexKey),
    ...queue.dismissed,
  ]);

  const fresh: PlexHistoryItem[] = [];
  for (const item of items) {
    if (item.type !== "movie") continue;
    if (options.accountID !== undefined && item.accountID !== options.accountID) continue;
    if (seen.has(item.historyKey)) continue;

    const date = localDate(item.viewedAt, options.timeZone);
    if (date < lastDate) continue;
    if (date === lastDate && recordedOnLastDate.has(item.title.toLowerCase())) continue;

    seen.add(item.historyKey);
    fresh.push(item);
  }
  return fresh.sort((a, b) => a.viewedAt - b.viewedAt);
}

/**
 * The TMDB id a title is reliably tied to: a `tmdbId` pinned on a history
 * entry, or else a poster found by an exact match. Fuzzy poster matches are
 * guesses, so they don't count.
 */
function trustedTmdbId(
  title: string,
  history: WatchEntry[],
  posters: PosterMap
): number | null {
  const pinned = history.find(
    (e) => e.title === title && typeof e.tmdbId === "number"
  )?.tmdbId;
  if (pinned !== undefined) return pinned;
  const poster = posters[title];
  return poster?.match === "exact" ? poster.tmdbId : null;
}

/**
 * The title to record a Plex watch under.
 *
 * Rewatches must reuse the exact title already in the history, or the
 * rankings would treat them as a different film. So: match by TMDB id first,
 * then by name (ignoring case). A same-named film with a different, trusted
 * TMDB id is a different film (a remake), so it gets its year appended.
 */
export function canonicalTitle(
  plexTitle: string,
  tmdbId: number | null,
  year: string | null,
  history: WatchEntry[],
  posters: PosterMap
): string {
  const titles = [...new Set(history.map((e) => e.title))];

  if (tmdbId !== null) {
    const byId = titles.find(
      (t) => trustedTmdbId(t, history, posters) === tmdbId
    );
    if (byId) return byId;
  }

  const name = plexTitle.trim();
  const sameName = titles.find((t) => t.toLowerCase() === name.toLowerCase());
  if (!sameName) return name;

  const existingId = trustedTmdbId(sameName, history, posters);
  if (tmdbId !== null && existingId !== null && existingId !== tmdbId) {
    return `${name} (${year ?? `TMDB ${tmdbId}`})`;
  }
  return sameName;
}

/** Add newly synced watches to the queue: one entry per viewing, oldest first. */
export function mergeIntoQueue(
  queue: WatchQueue,
  watches: QueuedWatch[]
): WatchQueue {
  const byKey = new Map(queue.pending.map((w) => [w.plexKey, w]));
  for (const watch of watches) {
    if (!byKey.has(watch.plexKey)) byKey.set(watch.plexKey, watch);
  }
  const pending = [...byKey.values()].sort((a, b) => a.viewedAt - b.viewedAt);
  return { ...queue, pending };
}

const sortKeys = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key]])
  );

/**
 * Record your answer for the watch at the front of the queue.
 *
 * Only the front watch can be answered, because each answer compares a film
 * with the one recorded just before it. A key that is not at the front (a
 * stale page or a double submit) leaves everything unchanged.
 *
 * `title` overrides the suggested title, e.g. to match how you named the film
 * before. Its TMDB id is kept unless that title is already tied to a
 * different film.
 */
export function applyAnswer(
  state: ReviewState,
  plexKey: string,
  answer: Answer,
  title?: string
): ReviewState {
  const [head, ...rest] = state.queue.pending;
  if (!head || head.plexKey !== plexKey) return state;

  if (answer === "dismiss") {
    return {
      ...state,
      queue: {
        pending: rest,
        dismissed: [...state.queue.dismissed, head.plexKey],
        lastAnswered: { watch: head, addedOrder: null, addedPoster: false },
      },
    };
  }

  const finalTitle = title?.trim() || head.title;
  const existingId = trustedTmdbId(finalTitle, state.history, state.posters);
  const tmdbId =
    head.tmdbId !== null && (existingId === null || existingId === head.tmdbId)
      ? head.tmdbId
      : null;

  const order =
    state.history.length === 0
      ? 1
      : Math.max(...state.history.map((e) => e.order)) + 1;
  const betterThanPrevious =
    state.history.length === 0 || answer === "skip"
      ? null
      : answer === "better";

  const entry: WatchEntry = {
    order,
    title: finalTitle,
    ...(tmdbId !== null ? { tmdbId } : {}),
    dateWatched: head.dateWatched,
    betterThanPrevious,
  };

  const addPoster =
    !state.posters[finalTitle] && head.poster !== null && tmdbId !== null;
  const posters = addPoster
    ? sortKeys({
        ...state.posters,
        [finalTitle]: {
          tmdbId,
          posterPath: head.poster!.posterPath,
          matchedTitle: head.poster!.matchedTitle,
          year: head.poster!.year,
          match: "exact" as const,
        },
      })
    : state.posters;

  return {
    history: [...state.history, entry],
    queue: {
      ...state.queue,
      pending: rest,
      lastAnswered: { watch: head, addedOrder: order, addedPoster: addPoster },
    },
    posters,
  };
}

/**
 * Undo the most recent answer: remove the entry it added (and any poster it
 * recorded) and put the watch back at the front of the queue. Does nothing if
 * the history no longer ends with that entry.
 */
export function undoLastAnswer(state: ReviewState): ReviewState {
  const last = state.queue.lastAnswered;
  if (!last) return state;

  const pending = [last.watch, ...state.queue.pending];

  if (last.addedOrder === null) {
    return {
      ...state,
      queue: {
        pending,
        dismissed: state.queue.dismissed.filter((k) => k !== last.watch.plexKey),
        lastAnswered: null,
      },
    };
  }

  const tail = state.history.at(-1);
  if (!tail || tail.order !== last.addedOrder) return state;

  const posters = { ...state.posters };
  if (last.addedPoster) delete posters[tail.title];

  return {
    history: state.history.slice(0, -1),
    queue: { ...state.queue, pending, lastAnswered: null },
    posters,
  };
}

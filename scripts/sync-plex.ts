/**
 * Pull new movie watches from Plex into a local review queue.
 *
 * Reads your Plex server's watch history, keeps the movie watches that came
 * after the last entry in src/movie-watch-history.json, and adds them to
 * .plex-queue.json (gitignored). Nothing is added to the history itself: you
 * answer "better than the previous film?" for each one on the local /review
 * page (`npm run dev`, then http://localhost:3000/review), which records it.
 *
 * Environment (from the shell or .env):
 *   PLEX_URL        Your server's address, e.g. http://192.168.1.20:32400
 *   PLEX_TOKEN      Your Plex token (X-Plex-Token)
 *   PLEX_ACCOUNT_ID Optional. Whose watches to take, if others use your
 *                   server. The server owner is usually 1.
 *   TMDB_READ_ACCESS_TOKEN  Optional. Fetches posters for films new to the site.
 *
 * Usage: npm run sync:plex [-- --dry-run]
 */
import path from "path";
import { loadEnv } from "./loadEnv";
import {
  canonicalTitle,
  localDate,
  mergeIntoQueue,
  selectNewWatches,
  type PlexHistoryItem,
  type QueuedWatch,
} from "../src/utils/watchQueue";
import { QUEUE_FILE, readReviewState, writeQueue } from "../src/utils/watchStore";

const ROOT = path.join(__dirname, "..");
const PAGE_SIZE = 200;
const MAX_PAGES = 100;
const DRY_RUN = process.argv.includes("--dry-run");

class SyncError extends Error {}

/** The parts of Plex's JSON responses this script reads. */
type PlexRow = {
  historyKey?: string | number;
  ratingKey?: string | number;
  title?: string;
  type?: string;
  viewedAt?: number | string;
  accountID?: number | string;
  year?: number | string;
  Guid?: { id?: string }[];
};
type PlexContainer = {
  MediaContainer?: { totalSize?: number | string; Metadata?: PlexRow[] };
};
type TmdbMovie = { poster_path?: string | null; title?: string; release_date?: string };

async function plexGet(
  baseUrl: string,
  token: string,
  urlPath: string,
  headers: Record<string, string> = {}
): Promise<PlexContainer> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${urlPath}`, {
      headers: { Accept: "application/json", "X-Plex-Token": token, ...headers },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new SyncError(
      `Could not reach Plex at ${baseUrl} (${(err as Error).message}). ` +
        "Check PLEX_URL and that the server is running."
    );
  }
  if (res.status === 401) {
    throw new SyncError("Plex rejected PLEX_TOKEN (401 Unauthorized).");
  }
  if (!res.ok) throw new SyncError(`Plex returned ${res.status} for ${urlPath}`);
  return (await res.json()) as PlexContainer;
}

function toHistoryItem(row: PlexRow): PlexHistoryItem | null {
  if (row?.historyKey == null || row?.viewedAt == null) return null;
  return {
    historyKey: String(row.historyKey),
    ratingKey: row.ratingKey != null ? String(row.ratingKey) : undefined,
    title: String(row.title ?? ""),
    type: String(row.type ?? ""),
    viewedAt: Number(row.viewedAt),
    accountID: row.accountID != null ? Number(row.accountID) : undefined,
  };
}

/** Every history row viewed at or after `since` (epoch seconds), all pages. */
async function fetchHistory(
  baseUrl: string,
  token: string,
  since: number | null,
  accountID: number | undefined
): Promise<PlexHistoryItem[]> {
  const params = ["sort=viewedAt%3Adesc"];
  if (since !== null) params.push(`viewedAt%3E=${since}`);
  if (accountID !== undefined) params.push(`accountID=${accountID}`);
  const urlPath = `/status/sessions/history/all?${params.join("&")}`;

  const items: PlexHistoryItem[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await plexGet(baseUrl, token, urlPath, {
      "X-Plex-Container-Start": String(page * PAGE_SIZE),
      "X-Plex-Container-Size": String(PAGE_SIZE),
    });
    const rows = data.MediaContainer?.Metadata ?? [];
    for (const row of rows) {
      const item = toHistoryItem(row);
      if (item) items.push(item);
    }
    const total = Number(data.MediaContainer?.totalSize ?? NaN);
    const fetched = (page + 1) * PAGE_SIZE;
    if (rows.length < PAGE_SIZE || (Number.isFinite(total) && fetched >= total)) break;
  }
  return items;
}

/** The film's TMDB id and year from its Plex library entry, if it still exists. */
async function plexDetails(
  baseUrl: string,
  token: string,
  ratingKey: string | undefined
): Promise<{ tmdbId: number | null; year: string | null }> {
  if (!ratingKey) return { tmdbId: null, year: null };
  try {
    const data = await plexGet(
      baseUrl,
      token,
      `/library/metadata/${encodeURIComponent(ratingKey)}?includeGuids=1`
    );
    const movie = data.MediaContainer?.Metadata?.[0];
    const tmdb = (movie?.Guid ?? [])
      .map((g) => String(g.id ?? ""))
      .find((id) => id.startsWith("tmdb://"));
    const tmdbId = tmdb ? Number(tmdb.slice("tmdb://".length)) : NaN;
    return {
      tmdbId: Number.isFinite(tmdbId) ? tmdbId : null,
      year: movie?.year != null ? String(movie.year) : null,
    };
  } catch {
    // Removed from the library since it was watched: no metadata to read.
    return { tmdbId: null, year: null };
  }
}

async function tmdbPoster(
  token: string | undefined,
  tmdbId: number | null
): Promise<QueuedWatch["poster"]> {
  if (!token || tmdbId === null) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const movie = (await res.json()) as TmdbMovie;
    if (!movie?.poster_path) return null;
    return {
      posterPath: String(movie.poster_path),
      matchedTitle: String(movie.title ?? ""),
      year: movie.release_date ? String(movie.release_date).slice(0, 4) : null,
    };
  } catch {
    return null;
  }
}

/** Decide whose watches to take when others share the server. */
function chooseAccount(items: PlexHistoryItem[], configured: number | undefined) {
  if (configured !== undefined) return configured;
  const counts = new Map<number, number>();
  for (const item of items) {
    if (item.type === "movie" && item.accountID !== undefined) {
      counts.set(item.accountID, (counts.get(item.accountID) ?? 0) + 1);
    }
  }
  if (counts.size <= 1) return undefined;

  const summary = [...counts].map(([id, n]) => `account ${id}: ${n}`).join(", ");
  if (!counts.has(1)) {
    throw new SyncError(
      `Several accounts watched movies (${summary}). Set PLEX_ACCOUNT_ID to yours.`
    );
  }
  console.log(
    `Several accounts watched movies (${summary}). Using account 1, the server ` +
      "owner; set PLEX_ACCOUNT_ID to choose another."
  );
  return 1;
}

async function main() {
  loadEnv(ROOT);
  const baseUrl = process.env.PLEX_URL?.replace(/\/+$/, "");
  const token = process.env.PLEX_TOKEN;
  if (!baseUrl || !token) {
    throw new SyncError(
      "Set PLEX_URL and PLEX_TOKEN in .env first (see the README's Plex section)."
    );
  }
  const configuredAccount = process.env.PLEX_ACCOUNT_ID
    ? Number(process.env.PLEX_ACCOUNT_ID)
    : undefined;
  if (configuredAccount !== undefined && !Number.isInteger(configuredAccount)) {
    throw new SyncError("PLEX_ACCOUNT_ID must be a whole number.");
  }

  const state = readReviewState(ROOT);
  const lastDate = state.history.reduce(
    (latest, e) => (e.dateWatched > latest ? e.dateWatched : latest),
    ""
  );
  // Ask Plex for a day before the last recorded date, so time zones can't
  // cut anything off; selectNewWatches makes the exact cut.
  const since = lastDate ? Date.parse(`${lastDate}T00:00:00Z`) / 1000 - 86_400 : null;

  console.log(
    `Reading Plex history${lastDate ? ` since ${lastDate}, the last recorded date` : ""}...`
  );
  const items = await fetchHistory(baseUrl, token, since, configuredAccount);
  const accountID = chooseAccount(items, configuredAccount);
  const fresh = selectNewWatches(items, state.history, state.queue, { accountID });

  if (fresh.length === 0) {
    console.log(
      `No new movie watches. ${state.queue.pending.length} still waiting for review.`
    );
    return;
  }

  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!tmdbToken) {
    console.log("TMDB_READ_ACCESS_TOKEN not set: skipping posters for new films.");
  }

  const watches: QueuedWatch[] = [];
  for (const item of fresh) {
    const { tmdbId, year } = await plexDetails(baseUrl, token, item.ratingKey);
    const title = canonicalTitle(item.title, tmdbId, year, state.history, state.posters);
    const known = state.posters[title]?.posterPath;
    watches.push({
      plexKey: item.historyKey,
      title,
      plexTitle: item.title,
      tmdbId,
      viewedAt: item.viewedAt,
      dateWatched: localDate(item.viewedAt),
      poster: known ? null : await tmdbPoster(tmdbToken, tmdbId),
    });
  }

  console.log(`\n${watches.length} new movie watch${watches.length === 1 ? "" : "es"}:`);
  const recorded = new Set(state.history.map((e) => e.title));
  for (const w of watches) {
    const notes = [
      recorded.has(w.title) ? "rewatch" : null,
      w.title !== w.plexTitle ? `Plex calls it "${w.plexTitle}"` : null,
      w.tmdbId === null ? "no TMDB id" : null,
    ].filter(Boolean);
    console.log(`  ${w.dateWatched}  ${w.title}${notes.length ? `  (${notes.join("; ")})` : ""}`);
  }

  const queue = mergeIntoQueue(state.queue, watches);
  if (DRY_RUN) {
    console.log(`\nDry run: ${QUEUE_FILE} not written.`);
    return;
  }
  writeQueue(ROOT, queue);
  console.log(
    `\n${queue.pending.length} waiting in ${QUEUE_FILE}. Review them with ` +
      "`npm run dev`, then http://localhost:3000/review"
  );
}

main().catch((err) => {
  console.error(err instanceof SyncError ? err.message : err);
  process.exit(1);
});

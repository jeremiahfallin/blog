import fs from "fs";
import path from "path";
import {
  emptyQueue,
  type PosterMap,
  type ReviewState,
  type WatchEntry,
  type WatchQueue,
} from "./watchQueue";

/**
 * Reads and writes the files behind the Plex sync and the /review page. Used
 * only by `npm run sync:plex` and the review page in development; the
 * deployed site never writes files.
 */

/** Local-only queue of Plex watches awaiting an answer (gitignored). */
export const QUEUE_FILE = ".plex-queue.json";

const filesIn = (root: string) => ({
  history: path.join(root, "src", "movie-watch-history.json"),
  posters: path.join(root, "src", "data", "movie-posters.json"),
  queue: path.join(root, QUEUE_FILE),
});

function readJson<T>(file: string, fallback: T): T {
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as T)
    : fallback;
}

/** Write 2-space JSON, keeping the file's existing line endings. */
function writeJson(file: string, data: unknown) {
  const crlf =
    fs.existsSync(file) && fs.readFileSync(file, "utf8").includes("\r\n");
  const eol = crlf ? "\r\n" : "\n";
  fs.writeFileSync(file, JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol);
}

export function readReviewState(root: string): ReviewState {
  const files = filesIn(root);
  return {
    history: readJson<WatchEntry[]>(files.history, []),
    queue: { ...emptyQueue(), ...readJson<Partial<WatchQueue>>(files.queue, {}) },
    posters: readJson<PosterMap>(files.posters, {}),
  };
}

export function writeQueue(root: string, queue: WatchQueue) {
  writeJson(filesIn(root).queue, queue);
}

/** Write whichever parts of the state changed between `before` and `after`. */
export function writeReviewState(
  root: string,
  before: ReviewState,
  after: ReviewState
) {
  const files = filesIn(root);
  if (after.history !== before.history) writeJson(files.history, after.history);
  if (after.posters !== before.posters) writeJson(files.posters, after.posters);
  if (after.queue !== before.queue) writeJson(files.queue, after.queue);
}

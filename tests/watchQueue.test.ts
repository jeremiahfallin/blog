import assert from "node:assert/strict";
import {
  applyAnswer,
  canonicalTitle,
  emptyQueue,
  localDate,
  mergeIntoQueue,
  selectNewWatches,
  undoLastAnswer,
  type PlexHistoryItem,
  type PosterMap,
  type QueuedWatch,
  type ReviewState,
  type WatchEntry,
} from "../src/utils/watchQueue";

type TestFn = () => void | Promise<void>;
type Test = { name: string; fn: TestFn };
const tests: Test[] = [];
const test = (name: string, fn: TestFn) => tests.push({ name, fn });

const TZ = "America/Los_Angeles";

/** Epoch seconds for a wall-clock time in Los Angeles during PDT (UTC-7). */
const pdt = (date: string, time: string) =>
  Date.parse(`${date}T${time}:00-07:00`) / 1000;

const entry = (
  order: number,
  title: string,
  dateWatched: string,
  betterThanPrevious: boolean | null = true,
  tmdbId?: number
): WatchEntry => ({
  order,
  title,
  ...(tmdbId !== undefined ? { tmdbId } : {}),
  dateWatched,
  betterThanPrevious,
});

const plex = (
  key: number,
  title: string,
  viewedAt: number,
  extra: Partial<PlexHistoryItem> = {}
): PlexHistoryItem => ({
  historyKey: `/status/sessions/history/${key}`,
  ratingKey: String(1000 + key),
  title,
  type: "movie",
  viewedAt,
  accountID: 1,
  ...extra,
});

const queued = (
  key: number,
  title: string,
  dateWatched: string,
  extra: Partial<QueuedWatch> = {}
): QueuedWatch => ({
  plexKey: `/status/sessions/history/${key}`,
  title,
  plexTitle: title,
  tmdbId: null,
  viewedAt: pdt(dateWatched, "20:00"),
  dateWatched,
  poster: null,
  ...extra,
});

// ---------- localDate ----------

test("localDate uses the given time zone, not UTC", () => {
  // 11pm in Los Angeles is already the next day in UTC.
  assert.equal(localDate(pdt("2026-07-04", "23:00"), TZ), "2026-07-04");
  assert.equal(localDate(pdt("2026-07-04", "23:00"), "UTC"), "2026-07-05");
});

// ---------- selectNewWatches ----------

const history: WatchEntry[] = [
  entry(1, "Twister", "2026-06-29", null),
  entry(2, "Disclosure Day", "2026-06-30"),
];

test("keeps only movie watches after the last recorded date, oldest first", () => {
  const items = [
    plex(3, "Sinners", pdt("2026-07-02", "21:00")),
    plex(1, "Old Movie", pdt("2026-06-20", "21:00")),
    plex(2, "Weapons", pdt("2026-07-01", "21:00")),
    plex(4, "Pilot", pdt("2026-07-03", "21:00"), { type: "episode" }),
  ];

  const result = selectNewWatches(items, history, emptyQueue(), { timeZone: TZ });

  assert.deepEqual(result.map((r) => r.title), ["Weapons", "Sinners"]);
});

test("on the last recorded date, skips films already recorded that day", () => {
  const items = [
    plex(1, "Disclosure Day", pdt("2026-06-30", "19:00")),
    plex(2, "Companion", pdt("2026-06-30", "22:00")),
  ];

  const result = selectNewWatches(items, history, emptyQueue(), { timeZone: TZ });

  assert.deepEqual(result.map((r) => r.title), ["Companion"]);
});

test("skips watches already queued or dismissed, and duplicate rows", () => {
  const queue = {
    ...emptyQueue(),
    pending: [queued(1, "Weapons", "2026-07-01")],
    dismissed: ["/status/sessions/history/2"],
  };
  const items = [
    plex(1, "Weapons", pdt("2026-07-01", "21:00")),
    plex(2, "Trailer Reel", pdt("2026-07-01", "22:00")),
    plex(3, "Sinners", pdt("2026-07-02", "21:00")),
    plex(3, "Sinners", pdt("2026-07-02", "21:00")),
  ];

  const result = selectNewWatches(items, history, queue, { timeZone: TZ });

  assert.deepEqual(result.map((r) => r.historyKey), ["/status/sessions/history/3"]);
});

test("filters to one account when asked", () => {
  const items = [
    plex(1, "Weapons", pdt("2026-07-01", "21:00"), { accountID: 1 }),
    plex(2, "Frozen", pdt("2026-07-01", "22:00"), { accountID: 7 }),
  ];

  const result = selectNewWatches(items, history, emptyQueue(), {
    timeZone: TZ,
    accountID: 1,
  });

  assert.deepEqual(result.map((r) => r.title), ["Weapons"]);
});

test("with an empty history, every movie watch is new", () => {
  const items = [plex(1, "Weapons", pdt("2020-01-01", "21:00"))];

  const result = selectNewWatches(items, [], emptyQueue(), { timeZone: TZ });

  assert.equal(result.length, 1);
});

// ---------- canonicalTitle ----------

const posters: PosterMap = {
  "Ravenous (Les Affamés)": {
    tmdbId: 438740, posterPath: "/r.jpg", matchedTitle: "Ravenous", year: "2017", match: "exact",
  },
  "Mean Girls": {
    tmdbId: 673593, posterPath: "/m.jpg", matchedTitle: "Mean Girls", year: "2024", match: "exact",
  },
  "Dracula": {
    tmdbId: 6114, posterPath: "/d.jpg", matchedTitle: "Bram Stoker's Dracula", year: "1992", match: "fuzzy",
  },
};
const titled: WatchEntry[] = [
  entry(1, "Ravenous (Les Affamés)", "2025-01-01", null),
  entry(2, "Mean Girls", "2025-01-02", true, 673593),
  entry(3, "Dracula", "2025-01-03"),
  entry(4, "The Town", "2025-01-04"),
];

test("a rewatch reuses the title you already gave that film, matched by TMDB id", () => {
  assert.equal(
    canonicalTitle("Ravenous", 438740, "2017", titled, posters),
    "Ravenous (Les Affamés)"
  );
});

test("a rewatch with no TMDB id reuses an existing title that differs only in case", () => {
  assert.equal(canonicalTitle("the town", null, null, titled, posters), "The Town");
});

test("a different film with an already-used name gets its year added", () => {
  // "Mean Girls" in the history is the 2024 film; this is the 2004 one.
  assert.equal(
    canonicalTitle("Mean Girls", 10625, "2004", titled, posters),
    "Mean Girls (2004)"
  );
});

test("a low-confidence poster match does not split a title", () => {
  // "Dracula" was matched to a TMDB film by a fuzzy title search, so its id
  // is not trusted enough to decide this is a different film.
  assert.equal(canonicalTitle("Dracula", 1245, "2025", titled, posters), "Dracula");
});

test("a film you have not watched before keeps Plex's title", () => {
  assert.equal(canonicalTitle("Weapons", 1078605, "2025", titled, posters), "Weapons");
});

// ---------- mergeIntoQueue ----------

test("merging keeps one entry per Plex watch and sorts oldest first", () => {
  const queue = { ...emptyQueue(), pending: [queued(2, "Sinners", "2026-07-02")] };

  const merged = mergeIntoQueue(queue, [
    queued(3, "Weapons", "2026-07-01"),
    queued(2, "Sinners", "2026-07-02"),
  ]);

  assert.deepEqual(merged.pending.map((w) => w.title), ["Weapons", "Sinners"]);
});

// ---------- applyAnswer / undoLastAnswer ----------

const state = (pending: QueuedWatch[]): ReviewState => ({
  history: [entry(1, "Twister", "2026-06-29", null), entry(2, "Disclosure Day", "2026-06-30")],
  queue: { ...emptyQueue(), pending },
  posters: {},
});

const weapons = queued(10, "Weapons", "2026-07-01", {
  tmdbId: 1078605,
  poster: { posterPath: "/w.jpg", matchedTitle: "Weapons", year: "2025" },
});
const sinners = queued(11, "Sinners", "2026-07-02");

test("answering 'better' appends the next watch to the history", () => {
  const next = applyAnswer(state([weapons, sinners]), weapons.plexKey, "better");

  assert.deepEqual(next.history.at(-1), {
    order: 3,
    title: "Weapons",
    tmdbId: 1078605,
    dateWatched: "2026-07-01",
    betterThanPrevious: true,
  });
  assert.deepEqual(next.queue.pending.map((w) => w.title), ["Sinners"]);
});

test("'worse' records false and 'skip' records no comparison", () => {
  const worse = applyAnswer(state([weapons]), weapons.plexKey, "worse");
  const skip = applyAnswer(state([weapons]), weapons.plexKey, "skip");

  assert.equal(worse.history.at(-1)!.betterThanPrevious, false);
  assert.equal(skip.history.at(-1)!.betterThanPrevious, null);
});

test("an entry with no TMDB id is written without a tmdbId field", () => {
  const next = applyAnswer(state([sinners]), sinners.plexKey, "better");

  assert.equal("tmdbId" in next.history.at(-1)!, false);
});

test("the first watch in an empty history is never a comparison", () => {
  const start: ReviewState = { history: [], queue: { ...emptyQueue(), pending: [weapons] }, posters: {} };

  const next = applyAnswer(start, weapons.plexKey, "better");

  assert.equal(next.history[0].order, 1);
  assert.equal(next.history[0].betterThanPrevious, null);
});

test("dismissing drops the watch and remembers it so the next sync skips it", () => {
  const next = applyAnswer(state([weapons, sinners]), weapons.plexKey, "dismiss");

  assert.equal(next.history.length, 2);
  assert.deepEqual(next.queue.pending.map((w) => w.title), ["Sinners"]);
  assert.deepEqual(next.queue.dismissed, [weapons.plexKey]);
});

test("only the watch at the front of the queue can be answered", () => {
  // A stale or repeated submit must not answer the wrong comparison.
  const start = state([weapons, sinners]);

  const next = applyAnswer(start, sinners.plexKey, "better");

  assert.deepEqual(next, start);
});

test("a corrected title is used, and its poster is recorded for new films", () => {
  const next = applyAnswer(state([weapons]), weapons.plexKey, "better", "  Weapons (2025)  ");

  assert.equal(next.history.at(-1)!.title, "Weapons (2025)");
  assert.deepEqual(next.posters["Weapons (2025)"], {
    tmdbId: 1078605,
    posterPath: "/w.jpg",
    matchedTitle: "Weapons",
    year: "2025",
    match: "exact",
  });
});

test("an existing poster entry is left alone", () => {
  const start = state([weapons]);
  start.posters = {
    Weapons: { tmdbId: 1078605, posterPath: "/old.jpg", matchedTitle: "Weapons", year: "2025", match: "exact" },
  };

  const next = applyAnswer(start, weapons.plexKey, "better");

  assert.equal(next.posters.Weapons.posterPath, "/old.jpg");
});

test("renaming to a title pinned to another film drops the conflicting id", () => {
  const start = state([weapons]);
  start.history.push(entry(3, "Mean Girls", "2026-06-30", true, 673593));

  const next = applyAnswer(start, weapons.plexKey, "better", "Mean Girls");

  assert.equal("tmdbId" in next.history.at(-1)!, false);
});

test("undo puts the last answered watch back at the front", () => {
  const start = state([weapons, sinners]);
  const answered = applyAnswer(start, weapons.plexKey, "better");

  const undone = undoLastAnswer(answered);

  assert.deepEqual(undone.history, start.history);
  assert.deepEqual(undone.queue.pending, start.queue.pending);
  assert.deepEqual(undone.posters, start.posters);
  assert.equal(undone.queue.lastAnswered, null);
});

test("undo reverses a dismissal", () => {
  const start = state([weapons, sinners]);

  const undone = undoLastAnswer(applyAnswer(start, weapons.plexKey, "dismiss"));

  assert.deepEqual(undone.queue.pending, start.queue.pending);
  assert.deepEqual(undone.queue.dismissed, []);
});

test("undo does nothing if the history changed since the answer", () => {
  const answered = applyAnswer(state([weapons]), weapons.plexKey, "better");
  // Edited by hand after answering: the recorded entry is no longer last.
  answered.history.push(entry(4, "Hand Added", "2026-07-05"));

  assert.deepEqual(undoLastAnswer(answered), answered);
});

async function main() {
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`PASS  ${name}`);
    } catch (err) {
      failed++;
      console.error(`FAIL  ${name}`);
      console.error(err instanceof Error ? err.message : err);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${tests.length} tests passed`);
}

main();

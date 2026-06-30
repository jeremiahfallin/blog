/**
 * Build-time poster enrichment.
 *
 * Reads the unique movie titles from src/movie-watch-history.json, resolves each
 * to a TMDB movie, and writes src/data/movie-posters.json as
 *   title -> { tmdbId, posterPath, matchedTitle, year, match }
 *
 * - Auth: TMDB_READ_ACCESS_TOKEN (v4 read token) sent as a Bearer header. Loaded
 *   from the environment, or from a local .env file if present.
 * - Disambiguation: a watch-history entry may carry an optional `tmdbId` to pin
 *   the exact film (e.g. to tell the 2004 from the 2024 "Mean Girls"). The script
 *   prefers it over title search and flags titles with multiple same-name matches
 *   so they can be pinned.
 * - Manual fixes: scripts/movie-poster-overrides.json maps a title to either
 *   { tmdbId } (re-resolved against TMDB) or { skip: true } (left unmatched).
 *   Precedence: override id > watch-history `tmdbId` > title search.
 * - Re-runs are cheap: titles already resolved with a poster are skipped; misses
 *   are retried so they can resolve once TMDB has the film.
 *
 * Usage: npm run fetch:posters
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");
const WATCH_HISTORY = path.join(ROOT, "src", "movie-watch-history.json");
const OUTPUT = path.join(ROOT, "src", "data", "movie-posters.json");
const OVERRIDES = path.join(ROOT, "scripts", "movie-poster-overrides.json");

type PosterEntry = {
  tmdbId: number | null;
  posterPath: string | null;
  matchedTitle: string | null;
  year: string | null;
  match: "exact" | "fuzzy" | "none";
};

type Overrides = Record<string, { tmdbId?: number; skip?: boolean }>;

// Minimal .env loader so the script works regardless of how it is invoked.
function loadEnv() {
  if (process.env.TMDB_READ_ACCESS_TOKEN) return;
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function readJson<T>(file: string, fallback: T): T {
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as T)
    : fallback;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tmdb(token: string, urlPath: string): Promise<any> {
  const url = `https://api.themoviedb.org/3${urlPath}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    });
    if (res.status === 429) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`TMDB ${res.status} for ${urlPath}`);
    return res.json();
  }
  throw new Error(`TMDB rate-limited repeatedly for ${urlPath}`);
}

function toEntry(movie: any, match: PosterEntry["match"]): PosterEntry {
  return {
    tmdbId: movie?.id ?? null,
    posterPath: movie?.poster_path ?? null,
    matchedTitle: movie?.title ?? null,
    year: movie?.release_date ? String(movie.release_date).slice(0, 4) : null,
    match,
  };
}

async function resolveTitle(
  token: string,
  title: string
): Promise<{ entry: PosterEntry; candidates: any[] }> {
  const data = await tmdb(
    token,
    `/search/movie?include_adult=false&query=${encodeURIComponent(title)}`
  );
  const results: any[] = data.results ?? [];
  if (results.length === 0) {
    return {
      entry: { tmdbId: null, posterPath: null, matchedTitle: null, year: null, match: "none" },
      candidates: [],
    };
  }
  const norm = (s: string) => s.toLowerCase().trim();
  const exactMatches = results.filter(
    (r) => norm(r.title) === norm(title) || norm(r.original_title) === norm(title)
  );
  // Results are popularity-sorted; prefer an exact title match, else the top hit.
  const chosen = exactMatches[0] ?? results[0];
  // candidates holds same-name films (remakes) so they can be pinned by id.
  return {
    entry: toEntry(chosen, exactMatches.length ? "exact" : "fuzzy"),
    candidates: exactMatches,
  };
}

async function main() {
  loadEnv();
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "Missing TMDB_READ_ACCESS_TOKEN (set it in the environment or a .env file)."
    );
    process.exit(1);
  }

  const history = readJson<{ title: string; tmdbId?: number }[]>(WATCH_HISTORY, []);
  const titles = [...new Set(history.map((h) => h.title))].sort();
  const existing = readJson<Record<string, PosterEntry>>(OUTPUT, {});
  const overrides = readJson<Overrides>(OVERRIDES, {});

  // Canonical id pinned in the watch history itself (disambiguates same-name
  // remakes per watch). First entry with an id wins; warn on conflicts.
  const pinnedByTitle: Record<string, number> = {};
  for (const entry of history) {
    if (typeof entry.tmdbId !== "number") continue;
    if (
      pinnedByTitle[entry.title] !== undefined &&
      pinnedByTitle[entry.title] !== entry.tmdbId
    ) {
      console.warn(
        `Conflicting tmdbId for "${entry.title}": ${pinnedByTitle[entry.title]} vs ${entry.tmdbId} (posters are keyed by title; using the first).`
      );
      continue;
    }
    pinnedByTitle[entry.title] = entry.tmdbId;
  }

  const out: Record<string, PosterEntry> = {};
  let resolved = 0;
  let queried = 0;
  const lowConfidence: string[] = [];
  const misses: string[] = [];
  const ambiguous: string[] = [];

  for (const title of titles) {
    const override = overrides[title];

    if (override?.skip) {
      out[title] = { tmdbId: null, posterPath: null, matchedTitle: null, year: null, match: "none" };
      continue;
    }

    // Precedence: override id > id pinned in the watch history > title search.
    const pinnedId = override?.tmdbId ?? pinnedByTitle[title];

    // Reuse a cached resolution if it already reflects the current pin.
    const cached = existing[title];
    if (
      cached?.posterPath &&
      (pinnedId === undefined || cached.tmdbId === pinnedId)
    ) {
      out[title] = cached;
      resolved++;
      continue;
    }

    try {
      let entry: PosterEntry;
      if (pinnedId !== undefined) {
        const movie = await tmdb(token, `/movie/${pinnedId}`);
        entry = toEntry(movie, "exact");
      } else {
        const result = await resolveTitle(token, title);
        entry = result.entry;
        if (result.candidates.length > 1) {
          ambiguous.push(
            `${title}  (chose ${entry.matchedTitle}, ${entry.year}) — candidates: ` +
              result.candidates
                .map((c) => `${c.id}=${(c.release_date || "?").slice(0, 4)}`)
                .join(", ")
          );
        }
      }
      queried++;
      out[title] = entry;
      if (entry.posterPath) {
        resolved++;
        if (entry.match === "fuzzy") lowConfidence.push(`${title}  ->  ${entry.matchedTitle} (${entry.year})`);
      } else {
        misses.push(title);
      }
      await sleep(40);
    } catch (err) {
      console.error(`Failed: ${title} — ${(err as Error).message}`);
      out[title] = existing[title] ?? {
        tmdbId: null, posterPath: null, matchedTitle: null, year: null, match: "none",
      };
    }
  }

  // Stable, sorted output for clean diffs.
  const sorted = Object.fromEntries(
    Object.keys(out).sort().map((k) => [k, out[k]])
  );
  fs.writeFileSync(OUTPUT, JSON.stringify(sorted, null, 2) + "\n");

  console.log(`\nTitles: ${titles.length} | queried this run: ${queried} | with poster: ${resolved} | misses: ${misses.length}`);
  if (lowConfidence.length) {
    console.log(`\nLow-confidence (fuzzy) matches to review:`);
    for (const l of lowConfidence) console.log(`  ${l}`);
  }
  if (ambiguous.length) {
    console.log(
      `\nAmbiguous (multiple same-name films) — pin the right one with a "tmdbId" on the watch-history entry:`
    );
    for (const a of ambiguous) console.log(`  ${a}`);
  }
  if (misses.length) {
    console.log(`\nNo poster found (add to ${path.basename(OVERRIDES)} with a tmdbId, or mark skip):`);
    for (const m of misses) console.log(`  ${m}`);
  }
  console.log(`\nWrote ${path.relative(ROOT, OUTPUT)}`);
}

main();

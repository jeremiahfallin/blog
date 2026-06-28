# TODO

Remaining items from the June 2026 code evaluation, roughly ordered by impact.
(Already done: per-page metadata/OG/sitemap/RSS, client-side nav fixes, ISO
dates, `tsx` devDependency, `react-force-graph` removal, artifact gitignore,
engine writeup post.)

## Correctness / robustness

- [x] **Set the production domain.** `src/config.ts` falls back to
  `https://jeremiahfallin.com`. Set `NEXT_PUBLIC_SITE_URL` in the deployment
  environment (or edit the fallback) so canonical URLs, Open Graph images,
  the sitemap, and the RSS feed resolve to the real domain.

- [x] **Deduplicate the logistic-regression implementations.**
  `scripts/calculate-static-ratings.ts` reimplemented
  `src/utils/calculateLogisticRatings.ts` inline and the copies had already
  diverged: the script skipped `betterThanPrevious === null`, the util treated
  null as "worse than previous". Extracted one shared implementation in
  `src/utils/logisticRatingsCore.ts` that takes a TF backend; both call sites
  now delegate to it. The shared copy skips null (matching `calculateRatings`)
  and sorts by `order` before pairing each film with its predecessor instead
  of trusting `watchHistory[order - 2]`. Covered by
  `tests/logisticRatingsCore.test.ts`.

- [x] **Harden content loading.** `getBlogPostMetadata` no longer calls
  `notFound()` on metadata problems (dead code — it only ran on files freshly
  read from the content dirs); it now throws naming the offending file. The
  outer `[]`-swallowing `try/catch` in `getBlogPosts` is gone, so one malformed
  MDX file fails the build with its filename instead of silently emptying every
  listing. Also deduplicated the three movies/shows/projects blocks and added an
  `.mdx` filter so stray files aren't treated as slugs.

- [x] **Resolve the graph arrow direction mismatch.** `MovieGraph.tsx` swaps
  link source/target ("to correct arrow direction"), which makes arrows point
  worse → better, but the on-screen caption says arrows point "from better to
  worse." Fix whichever is wrong.

- [x] **Fix the flaky score assertion.** In `tests/movie-api.spec.ts`, the
  `avgBetterScore > avgWorseScore * 0.7` check moved the threshold the wrong way
  when the averages were negative. Replaced it with a sign-invariant rank
  concordance (Mann-Whitney / rank-biserial): the fraction of (better, worse)
  pairs where the better-marked film outranks the worse one, asserted to be
  better than chance (> 0.5). Real data sits at ~0.92.

## Performance / architecture

- [x] **Pass ratings data down from the server instead of client-fetching.**
  `src/app/movies/page.tsx` now imports `calculated-ratings.json` and threads it
  through `MovieViewerClient` → `MovieViewer` to `MovieTable` (movies + cycles)
  and `MovieGraph` (graph + movies) as props. Both components dropped their
  `useEffect`/`fetch`; the table lost its `isLoading`/`SkeletonRows`, and the
  graph derives its node/link/range data via `useMemo`. Added `src/types/ratings.ts`
  as the shared payload type (replacing the duplicated local types). The
  `/api/movies` route is unchanged for external use. Verified in a headless
  browser: zero `/api/movies` requests, table and graph render immediately.

## Accessibility / UX

- [ ] **Make table sorting keyboard-accessible.** Column headers in
  `MovieTable.tsx` sort via `onClick` only — add button semantics (or
  key handlers) and `aria-sort` on the active column.

- [ ] **Check the navbar on small screens.** Logo + four text links + two
  icons in the pill navbar likely overflow near 375px wide; the 768px media
  query in `globals.css` only shrinks padding. Consider collapsing links into
  a menu on small screens.

## Visual / design polish

Deferred items from the visual-improvements pass (already done in that pass:
social links, CSS-grid listings, score HoverCards, breadcrumbs, prev/next
nav, About page, scroll reveals, table skeleton + empty state, uniform date
labels, graph label fade-on-zoom).

- [ ] **Revisit the Movie Watch page.** The table got score HoverCards and
  skeleton/empty states, but a deeper polish pass was deferred. Candidates: a
  summary strip (films watched, date span, # of preference cycles, top-rated
  title), poster thumbnails in the title column, and clearer graph
  controls/zoom affordances.

- [ ] **Add a favicon and a default share image.** The site still ships the
  default Next.js favicon — replace it with a branded mark (e.g. a "JF"
  monogram matching the gradient logo). Per-page Open Graph / Twitter tags
  already exist via `buildPostMetadata`, but pages without a backdrop have no
  image; add a site-wide default OG image (~1200×630) for link previews.

- [ ] **Try an asymmetric / editorial grid.** Listing grids are uniform
  `repeat(auto-fit, minmax(...))`. A staggered 2-1 / 3-2 layout — or masonry
  reflecting movie-backdrop aspect ratios — would add visual variety across
  the home, projects, movies, and shows pages.

## Content / docs

- [ ] **Fix the README project structure.** It lists `content/` and `media/`
  at the repo root; they live at `src/content/` and `public/media/`.

- [ ] **Expand thin content.** Several movie reviews are one or two sentences
  (The Platform's description is "Wow."), and the shows section has a single
  entry. The ranking engine is the differentiator — the writing around it is
  what search engines and visitors actually read.

- [ ] **Note `@tensorflow/tfjs-node` install weight.** It is a large native
  dependency used only at build time. Fine functionally, but it slows
  installs/deploys; consider moving the rating calculation to a separate
  workspace or precommitting its output if deploy times become a problem.

## Product & content ideas

General blog improvements and content directions (from TODO PR #17).

### General

- **Consistent content schedule:** Establish and maintain a regular posting
  schedule (e.g., weekly, bi-weekly) to keep readers engaged.
- **Search functionality:** Implement a search feature so users can find
  specific posts. (Note: the movie table already has title search.)
- **Categorization / tagging:** Introduce categories or tags for posts to
  improve navigation and content discovery.

### Movies and shows

- **Ratings:** Consider a quick-assessment rating system (e.g., 1–5 stars,
  thumbs up/down) alongside the computed BT / logistic scores.

### Projects

- **Live demos / repositories:** Provide links to live demos or code
  repositories (GitHub, GitLab) for each project.
- **"Technologies used":** Add a dedicated section listing the key
  technologies, frameworks, and libraries used in each project.
- **Project goals and outcomes:** Expand project descriptions to cover the
  initial goals and the final outcomes or impact.

### Future content

- **Year-in-review posts:** At the end of each year, summarize the best
  movies, shows, or projects covered.
- **"Top X" lists:** Curated lists such as "Top 5 Horror Movies of the Year,"
  "Must-Watch Sci-Fi Shows," or "Innovative Web Projects."
- **Interviews:** Conduct interviews with people involved in the movies,
  shows, or projects reviewed.
- **Thematic weeks / months:** Dedicate a week or month to a specific theme
  or genre (e.g., "Indie Film Week," "Open Source Project Spotlight").

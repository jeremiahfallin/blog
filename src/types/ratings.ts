// Shape of src/data/calculated-ratings.json — the build-time output of
// scripts/calculate-static-ratings.ts, also served verbatim by /api/movies.

export type MovieRating = {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
  /** Bradley-Terry rating: 100 × the film's share of total strength. */
  btscore: number;
  /**
   * Posterior standard deviation σ of the film's log-strength. The rating
   * plausibly lies between btscore · e^−σ and btscore · e^σ.
   */
  bayesianUncertainty?: number;
  viewCount: number;
  logisticScore: number | null;
};

export type RatingsGraphNode = {
  id: string;
  /** The film's share of total strength (btscore / 100). */
  rating: number;
  /** Same quantity as MovieRating.bayesianUncertainty. */
  uncertainty?: number;
};

export type RatingsGraphLink = {
  source: string;
  target: string;
  weight: number;
};

export type RatingsGraph = {
  nodes: RatingsGraphNode[];
  links: RatingsGraphLink[];
};

export type RatingsData = {
  movies: MovieRating[];
  cycles: string[][];
  graph: RatingsGraph;
};

// Shape of src/data/movie-posters.json — built by scripts/fetch-movie-posters.ts.
export type MoviePoster = {
  tmdbId: number | null;
  posterPath: string | null;
  matchedTitle: string | null;
  year: string | null;
  match: "exact" | "fuzzy" | "none";
};

export type PosterMap = Record<string, MoviePoster>;

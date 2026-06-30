// Shape of src/data/calculated-ratings.json — the build-time output of
// scripts/calculate-static-ratings.ts, also served verbatim by /api/movies.

export type MovieRating = {
  order: number;
  title: string;
  dateWatched: string;
  betterThanPrevious: boolean | null;
  btscore: number;
  bayesianUncertainty?: number;
  viewCount: number;
  logisticScore: number | null;
};

export type RatingsGraphNode = {
  id: string;
  rating: number;
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

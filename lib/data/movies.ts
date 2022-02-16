import path from "path";

import { file, getFiles, BaseProperties } from "./file";

const MOVIES_DIRECTORY = path.join(process.cwd(), "_content", "movies");

interface MovieFrontmatter {
  title: string;
  content: string;
  date: Date;
  description: string;
  rating: string;
  published: boolean;
  recommend: boolean;
}

interface MovieProperties extends BaseProperties {
  slug: string;
  slugString: string;
  href: string;
}

const movieProperties = (filePath: string): MovieProperties => {
  const directory = path.dirname(filePath);
  const dir = path.basename(directory);

  return {
    slug: dir,
    slugString: ["movies", dir].join("-"),
    href: `/movies/${dir}`,
    bundleDirectory: `/img/movies/${dir}/`,
  };
};

export const getMovies = getFiles<MovieFrontmatter, MovieProperties>({
  getProperties: movieProperties,
  directory: MOVIES_DIRECTORY,
  defaultQueryParams: {
    limit: false,
    orderBy: "date",
    order: "DESC",
    skip: 0,
  },
});

export const getMovie = (filePath: string) => {
  return file<MovieFrontmatter, MovieProperties>(
    filePath,
    movieProperties(filePath)
  );
};

export const getMovieFromSlug = (slug: string) => {
  const filePath = path.join(MOVIES_DIRECTORY, slug, "index.mdx");

  return getMovie(filePath);
};

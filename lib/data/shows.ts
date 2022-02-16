import path from "path";

import { file, getFiles, BaseProperties } from "./file";

const SHOWS_DIRECTORY = path.join(process.cwd(), "_content", "shows");

interface ShowFrontmatter {
  title: string;
  content: string;
  date: Date;
  description: string;
  rating: string;
  published: boolean;
  recommend: boolean;
}

interface ShowProperties extends BaseProperties {
  slug: string;
  slugString: string;
  href: string;
}

const showProperties = (filePath: string): ShowProperties => {
  const directory = path.dirname(filePath);
  const dir = path.basename(directory);

  return {
    slug: dir,
    slugString: ["shows", dir].join("-"),
    href: `/shows/${dir}`,
    bundleDirectory: `/img/shows/${dir}/`,
  };
};

export const getShows = getFiles<ShowFrontmatter, ShowProperties>({
  getProperties: showProperties,
  directory: SHOWS_DIRECTORY,
  defaultQueryParams: {
    limit: false,
    orderBy: "date",
    order: "DESC",
    skip: 0,
  },
});

export const getShow = (filePath: string) => {
  return file<ShowFrontmatter, ShowProperties>(
    filePath,
    showProperties(filePath)
  );
};

export const getShowFromSlug = (slug: string) => {
  const filePath = path.join(SHOWS_DIRECTORY, slug, "index.mdx");

  return getShow(filePath);
};

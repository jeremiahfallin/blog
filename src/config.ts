// Site-wide constants used by metadata, the sitemap, robots.txt, and the RSS feed.
//
// SITE_URL must match the production domain for canonical URLs, Open Graph
// images, and the sitemap to resolve correctly. Set NEXT_PUBLIC_SITE_URL in
// the deployment environment to override the fallback below.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jeremiahfallin.com";

export const SITE_NAME = "Jeremiah Fallin";
export const SITE_TITLE = "Jeremiah Fallin | Developer Portfolio";
export const SITE_DESCRIPTION = "Projects, movies, and more by Jeremiah Fallin";

import type { MetadataRoute } from "next";
import { getBlogPosts, BlogPostData } from "@/getBlogPosts";
import { SITE_URL } from "@/config";

function getPostDate(post: BlogPostData): Date | undefined {
  const date = (post.metadata as { date?: string }).date;
  return date ? new Date(date) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/projects",
    "/movies",
    "/shows",
    "/about",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/${post.slug}`,
    lastModified: getPostDate(post),
  }));

  return [...staticRoutes, ...postRoutes];
}

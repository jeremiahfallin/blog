import { BlogPostData } from "@/getBlogPosts";

export interface Adjacent {
  prev?: { href: string; title: string };
  next?: { href: string; title: string };
}

/**
 * Given the full posts list, a section prefix, and the current slug,
 * return the previous and next posts ordered chronologically by metadata.date.
 * Older entries are "previous" (←), newer entries are "next" (→).
 */
export function getAdjacent(
  posts: BlogPostData[],
  section: "movies" | "shows" | "projects",
  currentSlug: string
): Adjacent {
  const getDate = (p: BlogPostData): number => {
    const date = (p.metadata as unknown as { date?: string }).date;
    return date ? new Date(date).getTime() : 0;
  };

  const sectionPosts = posts
    .filter((p) => p.slug.startsWith(`${section}/`))
    .slice()
    .sort((a, b) => getDate(a) - getDate(b));

  const fullSlug = `${section}/${currentSlug}`;
  const idx = sectionPosts.findIndex((p) => p.slug === fullSlug);
  if (idx === -1) return {};

  const prevPost = idx > 0 ? sectionPosts[idx - 1] : undefined;
  const nextPost = idx < sectionPosts.length - 1 ? sectionPosts[idx + 1] : undefined;

  return {
    prev: prevPost
      ? {
          href: `/${prevPost.slug}`,
          title: prevPost.metadata.title as string,
        }
      : undefined,
    next: nextPost
      ? {
          href: `/${nextPost.slug}`,
          title: nextPost.metadata.title as string,
        }
      : undefined,
  };
}

import type { Metadata } from "next";

/**
 * Build per-page Metadata for a content detail page from its MDX metadata
 * export. Relative URLs (canonical, Open Graph images) resolve against the
 * metadataBase set in the root layout.
 */
export async function buildPostMetadata(
  section: "movies" | "shows" | "projects",
  slug: string
): Promise<Metadata> {
  try {
    const { metadata } = await import(`@/content/${section}/${slug}.mdx`);

    const title = metadata.title as string;
    const description = metadata.description as string;
    const background = metadata.background as string | undefined;
    const date = metadata.date as string | undefined;
    const path = `/${section}/${slug}`;

    return {
      title,
      description,
      alternates: { canonical: path },
      openGraph: {
        title,
        description,
        type: "article",
        url: path,
        publishedTime: date,
        images: background ? [{ url: `/media/${background}` }] : undefined,
      },
      twitter: {
        card: background ? "summary_large_image" : "summary",
        title,
        description,
        images: background ? [`/media/${background}`] : undefined,
      },
    };
  } catch {
    return {};
  }
}

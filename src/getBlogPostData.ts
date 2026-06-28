import type { Metadata } from "next/types";

export type PostMetadata = Metadata & {
  title: string;
  description: string;
  background?: string;
};

export type BlogPostData = {
  slug: string;
  metadata: PostMetadata;
};

export async function getBlogPostMetadata(slug: string): Promise<BlogPostData> {
  let file: { metadata?: PostMetadata };
  try {
    file = await import("@/content/" + slug + ".mdx");
  } catch (error: unknown) {
    throw new Error(`Failed to load content file ${slug}.mdx`, { cause: error });
  }

  if (!file?.metadata) {
    throw new Error(`Missing metadata export in ${slug}.mdx`);
  }

  if (!file.metadata.title || !file.metadata.description) {
    throw new Error(
      `Missing required metadata (title and description) in ${slug}.mdx`
    );
  }

  return {
    slug,
    metadata: file.metadata,
  };
}

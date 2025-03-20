import { notFound } from "next/navigation";
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
  try {
    const file = await import("@/content/" + slug + ".mdx");

    if (file?.metadata) {
      if (!file.metadata.title || !file.metadata.description) {
        throw new Error(`Missing some required metadata fields in: ${slug}`);
      }

      return {
        slug,
        metadata: file.metadata,
      };
    } else {
      throw new Error(`Unable to find metadata for ${slug}.mdx`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unexpected error", error);
    }
    return notFound();
  }
}

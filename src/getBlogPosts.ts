import type { Metadata } from "next/types";
import path from "path";
import fs from "fs/promises";
import { getBlogPostMetadata } from "./getBlogPostData";

export type PostMetadata = Metadata & {
  title: string;
  description: string;
  background?: string;
};

export type BlogPostData = {
  slug: string;
  metadata: PostMetadata;
};

const SECTIONS = ["movies", "shows", "projects"] as const;

export async function getBlogPosts(): Promise<BlogPostData[]> {
  const sections = await Promise.all(
    SECTIONS.map(async (section) => {
      const dir = path.join(process.cwd(), "src", "content", section);
      const files = await fs.readdir(dir);

      return Promise.all(
        files
          .filter((file) => file.endsWith(".mdx"))
          .map(async (file) => {
            const slug = `${section}/${file.replace(/\.mdx$/, "")}`;
            const { metadata } = await getBlogPostMetadata(slug);
            return { slug, metadata };
          })
      );
    })
  );

  return sections.flat();
}

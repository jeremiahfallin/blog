import { notFound } from "next/navigation";
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

export async function getBlogPosts(): Promise<BlogPostData[]> {
  try {
    const moviesPath = path.join(process.cwd(), "src", "content/movies/");
    const showsPath = path.join(process.cwd(), "src", "content/shows/");
    const projectsPath = path.join(process.cwd(), "src", "content/projects/");

    const moviesFiles = await fs.readdir(moviesPath);
    const showsFiles = await fs.readdir(showsPath);
    const projectsFiles = await fs.readdir(projectsPath);

    const moviesData = await Promise.all(
      moviesFiles.map(async (file) => {
        const slug = file.replace(".mdx", "");
        const metadata = await getBlogPostMetadata(`movies/${slug}`);
        return {
          slug: `movies/${slug}`,
          metadata: metadata.metadata,
        };
      })
    );

    const showsData = await Promise.all(
      showsFiles.map(async (file) => {
        const slug = file.replace(".mdx", "");
        const metadata = await getBlogPostMetadata(`shows/${slug}`);
        return {
          slug: `shows/${slug}`,
          metadata: metadata.metadata,
        };
      })
    );

    const projectsData = await Promise.all(
      projectsFiles.map(async (file) => {
        const slug = file.replace(".mdx", "");
        const metadata = await getBlogPostMetadata(`projects/${slug}`);
        return {
          slug: `projects/${slug}`,
          metadata: metadata.metadata,
        };
      })
    );

    return [...moviesData, ...showsData, ...projectsData];
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unexpected error", error);
    }
    return notFound();
  }
}

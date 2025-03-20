import { getBlogPosts } from "@/getBlogPosts";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const { default: Post } = await import(`@/content/movies/${slug}.mdx`);

  return <Post />;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  const moviePosts = posts.filter((post) => post.slug.startsWith("movies/"));

  return moviePosts.map((post) => ({
    slug: post.slug.replace("movies/", ""),
  }));
}

export const dynamicParams = false;

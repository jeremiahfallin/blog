"use client";

import { BlogPostData } from "@/getBlogPosts";
import type { RatingsData } from "@/types/ratings";
import dynamic from "next/dynamic";

// Dynamically import MovieViewer with SSR disabled
const MovieViewer = dynamic(() => import("@/components/MovieViewer"), {
  ssr: false,
  loading: () => <p>Loading movie viewer...</p>,
});

interface MovieViewerClientProps {
  posts: BlogPostData[];
  ratings: RatingsData;
}

export default function MovieViewerClient({
  posts,
  ratings,
}: MovieViewerClientProps) {
  return <MovieViewer posts={posts} ratings={ratings} />;
}

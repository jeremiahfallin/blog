"use client";

import { BlogPostData } from "@/getBlogPostData";
import dynamic from "next/dynamic";

// Dynamically import MovieViewer with SSR disabled
const MovieViewer = dynamic(() => import("@/components/MovieViewer"), {
  ssr: false,
  loading: () => <p>Loading movie viewer...</p>,
});

interface MovieViewerClientProps {
  posts: BlogPostData[];
}

export default function MovieViewerClient({ posts }: MovieViewerClientProps) {
  return <MovieViewer posts={posts} />;
}

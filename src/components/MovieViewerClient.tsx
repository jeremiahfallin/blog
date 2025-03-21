"use client";

import dynamic from "next/dynamic";
import { BlogPost } from "@/types"; // Adjust the import path as needed

// Dynamically import MovieViewer with SSR disabled
const MovieViewer = dynamic(() => import("@/components/MovieViewer"), {
  ssr: false,
  loading: () => <p>Loading movie viewer...</p>,
});

interface MovieViewerClientProps {
  posts: BlogPost[];
}

export default function MovieViewerClient({ posts }: MovieViewerClientProps) {
  return <MovieViewer posts={posts} />;
}

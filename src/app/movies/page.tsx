import dynamic from "next/dynamic";
import { getBlogPosts } from "@/getBlogPosts";

// Dynamically import MovieViewer with SSR disabled
const MovieViewer = dynamic(() => import("@/components/MovieViewer"), {
  ssr: false,
  loading: () => <p>Loading movie viewer...</p>,
});

export default async function Movies() {
  const blogPosts = await getBlogPosts();

  return (
    <div>
      <main>
        <h1>Movie Watch History</h1>
        <p>View my movie watch history as a table or interactive graph.</p>
        <MovieViewer posts={blogPosts} />
      </main>
      <footer></footer>
    </div>
  );
}

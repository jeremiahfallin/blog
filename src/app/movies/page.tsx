import { getBlogPosts } from "@/getBlogPosts";
import MovieViewerClient from "@/components/MovieViewerClient";

export default async function Movies() {
  const blogPosts = await getBlogPosts();

  return (
    <div>
      <main>
        <h1>Movie Watch History</h1>
        <p>View my movie watch history as a table or interactive graph.</p>
        <MovieViewerClient posts={blogPosts} />
      </main>
      <footer></footer>
    </div>
  );
}

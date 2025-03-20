import MovieViewer from "@/components/MovieViewer";
import { getBlogPosts } from "@/getBlogPosts";

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

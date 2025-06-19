import { Box, Card, Flex, Heading, Link, Text } from "@radix-ui/themes";
import { getBlogPosts, BlogPostData } from "@/getBlogPosts";
import Image from "next/image";
import { ProjectCard } from "@/components/ProjectCard";

function MovieCard({ movie }: { movie: BlogPostData }) {
  const image = movie.metadata.background as string;

  if (image) {
    return (
      <Box style={{ width: "calc(33.33% - 16px)", minWidth: "280px" }}>
        <Card
          style={{
            position: "relative",
            overflow: "hidden",
            aspectRatio: "16 / 9",
          }}
        >
          <Image
            src={`/media/${image}`}
            alt={movie.metadata.title as string}
            width={640}
            height={360}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
              opacity: 0.7,
            }}
            quality={90}
          />
          <Flex
            position="absolute"
            bottom="0"
            left="0"
            width="100%"
            p="2"
            justify="center"
            align="center"
            style={{
              zIndex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
          >
            <Heading as="h3" size="3">
              <Link href={`/movies/${movie.slug}` as string}>
                {movie.metadata.title as string}
              </Link>
            </Heading>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box style={{ width: "calc(33.33% - 16px)", minWidth: "280px" }}>
      <Card>
        <Flex direction="column" gap="2">
          <Heading as="h3" size="3">
            <Link href={`/movies/${movie.slug}` as string}>
              {movie.metadata.title as string}
            </Link>
          </Heading>
          <Text size="2">{movie.metadata.description as string}</Text>
        </Flex>
      </Card>
    </Box>
  );
}

export default async function Home() {
  const blogPosts = await getBlogPosts();
  const moviePosts = blogPosts.filter((post) => post.slug.startsWith("movie"));
  const projectPosts = blogPosts.filter((post) =>
    post.slug.startsWith("project")
  );

  return (
    <Flex direction="column" gap="4" justify="center" align="center">
      <main>
        <Flex direction="column" gap="4">
          <Heading as="h2" size="4">
            Projects
          </Heading>
          {projectPosts.map((post) => (
            <ProjectCard key={post.slug} project={post} />
          ))}
          <Heading as="h2" size="4">
            Movies
          </Heading>
          <Flex
            direction="row"
            gap="4"
            wrap="wrap"
            justify="between"
            style={{ width: "100%" }}
          >
            {moviePosts.map((post) => (
              <MovieCard key={post.slug} movie={post} />
            ))}
          </Flex>
        </Flex>
      </main>
    </Flex>
  );
}

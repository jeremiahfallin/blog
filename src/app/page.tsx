import { Box, Card, Flex, Heading, Link, Text, Container, Section, Button } from "@radix-ui/themes";
import { getBlogPosts, BlogPostData } from "@/getBlogPosts";
import Image from "next/image";
import { ProjectCard } from "@/components/ProjectCard";
import ScrollReveal from "@/components/ScrollReveal";
import NextLink from "next/link";

function MovieCard({ movie }: { movie: BlogPostData }) {
  const image = movie.metadata.background as string;
  const movieUrl = `/movies/${movie.slug.replace("movies/", "")}`;

  if (image) {
    return (
      <Card
        style={{
          position: "relative",
          overflow: "hidden",
          aspectRatio: "16 / 9",
        }}
        asChild
      >
        <NextLink href={movieUrl}>
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
              opacity: 0.85,
            }}
            quality={90}
          />
          <Flex
            position="absolute"
            bottom="0"
            left="0"
            width="100%"
            p="3"
            justify="center"
            align="center"
            style={{
              zIndex: 1,
              background: "linear-gradient(to top, rgba(9, 9, 11, 0.95) 0%, rgba(9, 9, 11, 0.6) 60%, transparent 100%)",
            }}
          >
            <Heading as="h3" size="3" className="card-title-hover">
              <Link asChild>
                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                  {movie.metadata.title as string}
                </span>
              </Link>
            </Heading>
          </Flex>
        </NextLink>
      </Card>
    );
  }

  return (
    <Card asChild>
      <NextLink href={movieUrl}>
        <Flex direction="column" gap="2" p="3" style={{ height: "100%" }}>
          <Heading as="h3" size="3" className="card-title-hover">
            <Link asChild>
              <span>{movie.metadata.title as string}</span>
            </Link>
          </Heading>
          <Text size="2" style={{ color: "var(--gray-11)" }}>
            {movie.metadata.description as string}
          </Text>
        </Flex>
      </NextLink>
    </Card>
  );
}

export default async function Home() {
  const blogPosts = await getBlogPosts();

  const moviePosts = blogPosts.filter((post) => post.slug.startsWith("movies/")).slice(0, 3);
  const projectPosts = blogPosts
    .filter((post) => post.slug.startsWith("projects/"))
    .sort(
      (a, b) =>
        new Date((b.metadata as { date?: string }).date ?? 0).getTime() -
        new Date((a.metadata as { date?: string }).date ?? 0).getTime()
    )
    .slice(0, 2);

  return (
    <Container size="3">
      {/* Hero Section */}
      <Section size="3" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
        <ScrollReveal>
          <Flex direction="column" gap="4" align="center" style={{ textAlign: "center", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: "-50px",
                width: "300px",
                height: "300px",
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
                zIndex: -1,
                filter: "blur(40px)",
              }}
            />

            <Heading as="h1" size="9" style={{ fontWeight: 900, lineHeight: 1.1, maxWidth: "16ch" }}>
              <span className="hero-gradient-text">Crafting Digital</span>{" "}
              <span className="hero-gradient-accent">Experiences</span>
            </Heading>

            <Text size="4" style={{ maxWidth: "60ch", color: "var(--gray-11)", lineHeight: 1.6 }}>
              Hi, I&apos;m Jeremiah Fallin. I build modern applications with React, TypeScript, and Node,
              and analyze cinema watch trends using machine learning models.
            </Text>

            <Flex gap="4" mt="4" wrap="wrap" justify="center">
              <Button size="3" variant="solid" color="blue" radius="full" asChild>
                <NextLink href="/projects">
                  Explore Projects
                </NextLink>
              </Button>
              <Button size="3" variant="outline" color="gray" radius="full" asChild>
                <NextLink href="/movies">
                  View Movie Ratings
                </NextLink>
              </Button>
            </Flex>
          </Flex>
        </ScrollReveal>
      </Section>

      <hr className="section-divider" />

      {/* Featured Projects Grid */}
      <Section size="2">
        <ScrollReveal>
          <Flex direction="column" gap="5">
            <Flex justify="between" align="end" wrap="wrap" gap="3">
              <Flex direction="column" gap="1">
                <Heading as="h2" size="6" style={{ fontWeight: 800 }}>
                  Featured Projects
                </Heading>
                <Text size="2" style={{ color: "var(--gray-10)" }}>
                  Selected engineering and interface design works
                </Text>
              </Flex>
              <Link asChild color="blue" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                <NextLink href="/projects">
                  View all projects →
                </NextLink>
              </Link>
            </Flex>

            <Box className="featured-pair">
              {projectPosts.map((post) => (
                <ProjectCard key={post.slug} project={post} />
              ))}
            </Box>
          </Flex>
        </ScrollReveal>
      </Section>

      <hr className="section-divider" />

      {/* Recent Watch History Section */}
      <Section size="2" style={{ paddingBottom: "6rem" }}>
        <ScrollReveal>
          <Flex direction="column" gap="5">
            <Flex justify="between" align="end" wrap="wrap" gap="3">
              <Flex direction="column" gap="1">
                <Heading as="h2" size="6" style={{ fontWeight: 800 }}>
                  Recent Watch History
                </Heading>
                <Text size="2" style={{ color: "var(--gray-10)" }}>
                  Cinema tracking quantified by Bradley-Terry & TensorFlow ratings
                </Text>
              </Flex>
              <Link asChild color="blue" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                <NextLink href="/movies">
                  Interactive ranking graph →
                </NextLink>
              </Link>
            </Flex>

            <Box className="movie-feature-grid">
              {moviePosts.map((post) => (
                <MovieCard key={post.slug} movie={post} />
              ))}
            </Box>
          </Flex>
        </ScrollReveal>
      </Section>
    </Container>
  );
}

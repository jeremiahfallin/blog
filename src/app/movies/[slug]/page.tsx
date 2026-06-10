import { getBlogPosts } from "@/getBlogPosts";
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Card,
  Separator,
  Container,
} from "@radix-ui/themes";
import { notFound } from "next/navigation";
import Image from "next/image";
import calculatedRatings from "@/data/calculated-ratings.json";
import Breadcrumb from "@/components/Breadcrumb";
import AdjacentNav from "@/components/AdjacentNav";
import { getAdjacent } from "@/utils/adjacentPosts";
import { buildPostMetadata } from "@/utils/postMetadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return buildPostMetadata("movies", slug);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  try {
    const { default: Post, metadata } = await import(
      `@/content/movies/${slug}.mdx`
    );

    const formattedDate = metadata.date
      ? new Date(metadata.date as string).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

    const hasBackground = metadata.background as string | undefined;

    // Find calculated scores for this movie
    const scoreInfo = (calculatedRatings.movies as Record<string, unknown>[]).find(
      (m) => String(m.title).toLowerCase() === (metadata.title as string).toLowerCase()
    ) as { btscore: number; logisticScore: number | null; viewCount: number } | undefined;

    const allPosts = await getBlogPosts();
    const { prev, next } = getAdjacent(allPosts, "movies", slug);

    return (
      <Container className="project-page">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Movies", href: "/movies" },
            { label: metadata.title as string },
          ]}
        />

        <Card size="3" className="project-header">
          {hasBackground ? (
            <Box className="project-hero-image">
              <Image
                src={`/media/${hasBackground}`}
                alt={metadata.title as string}
                fill
                style={{ objectFit: "cover" }}
                quality={90}
                priority
              />
              <div className="project-image-overlay"></div>
            </Box>
          ) : (
            <Box
              style={{
                height: "180px",
                background: "linear-gradient(135deg, var(--accent-3) 0%, var(--accent-5) 100%)",
              }}
            />
          )}

          <Box p="4" className="project-header-content">
            <Heading as="h1" size="8" className="project-title">
              {metadata.title as string}
            </Heading>

            <Flex direction="column" gap="2" mb="3">
              {formattedDate && (
                <Text size="2" color="gray" className="project-date">
                  {formattedDate}
                </Text>
              )}

              {scoreInfo && (
                <Flex gap="3" wrap="wrap" mt="1">
                  <Badge variant="soft" color="blue" size="2" radius="full">
                    BT Score: {scoreInfo.btscore.toFixed(2)}
                  </Badge>
                  {scoreInfo.logisticScore !== null && (
                    <Badge variant="soft" color="indigo" size="2" radius="full">
                      Logistic Score: {scoreInfo.logisticScore.toFixed(4)}
                    </Badge>
                  )}
                  <Badge variant="outline" color="gray" size="2" radius="full">
                    {scoreInfo.viewCount} {scoreInfo.viewCount === 1 ? "view" : "views"}
                  </Badge>
                </Flex>
              )}
            </Flex>

            {metadata.description && (
              <Text size="3" className="project-description" style={{ fontStyle: "italic", marginTop: "8px" }}>
                &quot;{metadata.description as string}&quot;
              </Text>
            )}
          </Box>
        </Card>

        <Separator size="4" className="project-separator" />

        <Box className="project-content">
          <Post />
        </Box>

        <AdjacentNav prev={prev} next={next} />
      </Container>
    );
  } catch (error) {
    console.error("Error loading movie MDX:", error);
    return notFound();
  }
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  const moviePosts = posts.filter((post) => post.slug.startsWith("movies/"));

  return moviePosts.map((post) => ({
    slug: post.slug.replace("movies/", ""),
  }));
}

export const dynamicParams = false;

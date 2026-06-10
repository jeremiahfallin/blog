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
import Breadcrumb from "@/components/Breadcrumb";
import AdjacentNav from "@/components/AdjacentNav";
import { getAdjacent } from "@/utils/adjacentPosts";
import { getReadingTime } from "@/utils/readingTime";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  // Import the MDX file
  try {
    const { default: Post, metadata } = await import(
      `@/content/projects/${slug}.mdx`
    );

    // Format the date if available
    const formattedDate = metadata.date
      ? new Date(metadata.date as string).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

    // Check if there's a background image
    const hasBackground = metadata.background as string | undefined;

    const allPosts = await getBlogPosts();
    const { prev, next } = getAdjacent(allPosts, "projects", slug);
    const readingMinutes = await getReadingTime("projects", slug);

    return (
      <Container className="project-page">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Projects", href: "/projects" },
            { label: metadata.title as string },
          ]}
        />

        <Card size="3" className="project-header">
          {hasBackground && (
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
          )}

          <Box p="4" className="project-header-content">
            <Heading as="h1" size="8" className="project-title">
              {metadata.title as string}
            </Heading>

            <Flex align="center" gap="3" wrap="wrap" mt="1" mb="2">
              {formattedDate && (
                <Text size="2" color="gray" className="project-date">
                  {formattedDate}
                </Text>
              )}
              <span className="reading-time" aria-label={`${readingMinutes} minute read`}>
                <span aria-hidden>⏱</span>
                {readingMinutes} min read
              </span>
            </Flex>

            {metadata.description && (
              <Text size="3" className="project-description">
                {metadata.description as string}
              </Text>
            )}

            {metadata.tags && (
              <Flex gap="2" wrap="wrap" className="project-tags">
                {(metadata.tags as string[]).map((tag) => (
                  <Badge key={tag} variant="soft" radius="full" className="project-tag">
                    {tag}
                  </Badge>
                ))}
              </Flex>
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
  } catch {
    return notFound();
  }
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  const projectPosts = posts.filter((post) =>
    post.slug.startsWith("projects/")
  );

  return projectPosts.map((post) => ({
    slug: post.slug.replace("projects/", ""),
  }));
}

export const dynamicParams = false;

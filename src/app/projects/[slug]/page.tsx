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

    return (
      <Container className="project-page">
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

            {formattedDate && (
              <Text size="2" color="gray" className="project-date">
                {formattedDate}
              </Text>
            )}

            {metadata.description && (
              <Text size="3" className="project-description">
                {metadata.description as string}
              </Text>
            )}

            {metadata.tags && (
              <Flex gap="2" wrap="wrap" className="project-tags">
                {(metadata.tags as string[]).map((tag) => (
                  <Badge key={tag} variant="soft" className="project-tag">
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

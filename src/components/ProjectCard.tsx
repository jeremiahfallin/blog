import { Box, Card, Flex, Heading, Link, Text, Badge } from "@radix-ui/themes";
import { BlogPostData } from "@/getBlogPosts";
import Image from "next/image";
import NextLink from "next/link";

// Extended metadata type to include common project fields
type ExtendedMetadata = {
  tags?: string[];
  date?: string;
};

const getTagColor = (tag: string): "blue" | "indigo" | "pink" | "orange" | "teal" | "gray" => {
  const t = tag.toLowerCase();
  if (t.includes("react") || t.includes("next")) return "blue";
  if (t.includes("typescript") || t.includes("ts") || t.includes("javascript") || t.includes("js")) return "indigo";
  if (t.includes("design") || t.includes("ui") || t.includes("ux") || t.includes("redesign")) return "pink";
  if (t.includes("ml") || t.includes("ai") || t.includes("tensorflow") || t.includes("tensor") || t.includes("python")) return "orange";
  if (t.includes("web") || t.includes("css") || t.includes("html")) return "teal";
  return "gray";
};

export function ProjectCard({
  project,
  featured = false,
}: {
  project: BlogPostData;
  featured?: boolean;
}) {
  const hasBackground = project.metadata.background as string | undefined;
  const projectUrl = `/projects/${project.slug.replace("projects/", "")}`;

  // Cast metadata to include our extended fields
  const metadata = project.metadata as typeof project.metadata &
    ExtendedMetadata;

  const formattedDate = metadata.date
    ? new Date(metadata.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null;

  if (featured) {
    return (
      <Card className="project-card-featured" asChild>
        <NextLink href={projectUrl}>
          <Box className="project-featured-inner" data-has-image={!!hasBackground}>
            {hasBackground && (
              <Box className="project-featured-media">
                <Image
                  src={`/media/${hasBackground}`}
                  alt={metadata.title as string}
                  fill
                  style={{ objectFit: "cover" }}
                  quality={85}
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
              </Box>
            )}

            <Flex direction="column" gap="3" className="project-featured-body">
              <Text className="project-featured-eyebrow">Featured project</Text>

              <Heading as="h3" size="7" className="card-title-hover">
                <Link asChild>
                  <span>{metadata.title as string}</span>
                </Link>
              </Heading>

              <Text size="3" style={{ color: "var(--gray-11)", lineHeight: 1.6 }}>
                {metadata.description as string}
              </Text>

              {metadata.tags && metadata.tags.length > 0 && (
                <Flex gap="1" wrap="wrap">
                  {metadata.tags.map((tag) => (
                    <Badge key={tag} variant="soft" color={getTagColor(tag)} size="1">
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              )}

              {formattedDate && (
                <Text size="1" style={{ color: "var(--gray-10)", marginTop: "auto" }}>
                  {formattedDate}
                </Text>
              )}
            </Flex>
          </Box>
        </NextLink>
      </Card>
    );
  }

  return (
    <Box style={{ height: "100%" }}>
      <Card
        size="2"
        style={{
          height: "100%",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          cursor: "pointer",
          overflow: "hidden",
        }}
        asChild
      >
        <NextLink href={projectUrl}>
          <Flex direction="column" gap="3" style={{ height: "100%" }}>
            {hasBackground && (
              <Box
                style={{
                  position: "relative",
                  height: "200px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={`/media/${hasBackground}`}
                  alt={metadata.title as string}
                  fill
                  style={{
                    objectFit: "cover",
                    transition: "transform 0.3s ease-in-out",
                  }}
                  quality={85}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </Box>
            )}

            <Flex
              direction="column"
              gap="2"
              p={hasBackground ? "2" : "0"}
              style={{ flexGrow: 1 }}
            >
              <Heading as="h3" size="4" className="card-title-hover">
                <Link asChild>
                  <span>{metadata.title as string}</span>
                </Link>
              </Heading>

              <Text
                size="2"
                style={{
                  color: "var(--gray-11)",
                  marginBottom: "0.5rem",
                  flexGrow: 1,
                }}
              >
                {metadata.description as string}
              </Text>

              {metadata.tags && metadata.tags.length > 0 && (
                <Flex gap="1" wrap="wrap">
                  {metadata.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="soft" color={getTagColor(tag)} size="1">
                      {tag}
                    </Badge>
                  ))}
                  {metadata.tags.length > 3 && (
                    <Badge variant="soft" size="1">
                      +{metadata.tags.length - 3} more
                    </Badge>
                  )}
                </Flex>
              )}

              {formattedDate && (
                <Text
                  size="1"
                  style={{ color: "var(--gray-10)", marginTop: "auto" }}
                >
                  {formattedDate}
                </Text>
              )}
            </Flex>
          </Flex>
        </NextLink>
      </Card>
    </Box>
  );
}

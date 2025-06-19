import { Box, Card, Flex, Heading, Link, Text, Badge } from "@radix-ui/themes";
import { BlogPostData } from "@/getBlogPosts";
import Image from "next/image";
import NextLink from "next/link";

// Extended metadata type to include common project fields
type ExtendedMetadata = {
  tags?: string[];
  date?: string;
};

export function ProjectCard({ project }: { project: BlogPostData }) {
  const hasBackground = project.metadata.background as string | undefined;
  const projectUrl = `/projects/${project.slug.replace("projects/", "")}`;

  // Cast metadata to include our extended fields
  const metadata = project.metadata as typeof project.metadata &
    ExtendedMetadata;

  return (
    <Box
      style={{
        width: "calc(50% - 24px)",
        minWidth: "300px",
        maxWidth: "500px",
      }}
    >
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
              <Heading as="h3" size="4">
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
                    <Badge key={tag} variant="soft" size="1">
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

              {metadata.date && (
                <Text
                  size="1"
                  style={{ color: "var(--gray-10)", marginTop: "auto" }}
                >
                  {new Date(metadata.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                  })}
                </Text>
              )}
            </Flex>
          </Flex>
        </NextLink>
      </Card>
    </Box>
  );
}

import { getBlogPosts } from "@/getBlogPosts";
import { Box, Flex, Heading, Text, Container, Section, Card, Link } from "@radix-ui/themes";
import NextLink from "next/link";
import Image from "next/image";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = {
  title: "TV Shows",
  description: "TV show reviews and watch history reflections.",
};

export default async function Shows() {
  const blogPosts = await getBlogPosts();
  const showPosts = blogPosts.filter((post) =>
    post.slug.startsWith("shows/")
  );

  return (
    <Container size="3">
      <Section size="3" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
        <Flex direction="column" gap="4">
          <Box style={{ maxWidth: "65ch", marginBottom: "2rem" }}>
            <Heading as="h1" size="8" style={{ marginBottom: "1rem" }}>
              TV Shows
            </Heading>
            <Text size="3" style={{ lineHeight: 1.6 }}>
              A collection of my TV show reviews and watch history reflections.
            </Text>
          </Box>

          <ScrollReveal>
            <Box className="card-grid-wide">
              {showPosts.map((post) => {
                const hasBackground = post.metadata.background as string | undefined;
                const showUrl = `/shows/${post.slug.replace("shows/", "")}`;
                return (
                  <Card
                    key={post.slug}
                    size="2"
                    style={{
                      height: "100%",
                      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                    asChild
                  >
                    <NextLink href={showUrl}>
                      <Flex direction="column" gap="3" style={{ height: "100%" }}>
                        {hasBackground ? (
                          <Box
                            style={{
                              position: "relative",
                              height: "200px",
                              overflow: "hidden",
                            }}
                          >
                            <Image
                              src={`/media/${hasBackground}`}
                              alt={post.metadata.title as string}
                              fill
                              style={{
                                objectFit: "cover",
                                transition: "transform 0.3s ease-in-out",
                              }}
                              quality={85}
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </Box>
                        ) : (
                          // Fallback styled header block if there is no backdrop image
                          <Box
                            style={{
                              height: "120px",
                              background: "linear-gradient(135deg, var(--accent-3) 0%, var(--accent-5) 100%)",
                            }}
                          />
                        )}

                        <Flex
                          direction="column"
                          gap="2"
                          p={hasBackground ? "2" : "3"}
                          style={{ flexGrow: 1 }}
                        >
                          <Heading as="h3" size="4">
                            <Link asChild>
                              <span>{post.metadata.title as string}</span>
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
                            {post.metadata.description as string}
                          </Text>
                        </Flex>
                      </Flex>
                    </NextLink>
                  </Card>
                );
              })}
            </Box>
          </ScrollReveal>
        </Flex>
      </Section>
    </Container>
  );
}

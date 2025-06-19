import { getBlogPosts } from "@/getBlogPosts";
import { Box, Flex, Heading, Text, Container, Section } from "@radix-ui/themes";
import { ProjectCard } from "@/components/ProjectCard";

export default async function Projects() {
  const blogPosts = await getBlogPosts();
  const projectPosts = blogPosts.filter((post) =>
    post.slug.startsWith("projects/")
  );

  return (
    <Container size="3">
      <Section size="3" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
        <Flex direction="column" gap="4">
          <Box style={{ maxWidth: "65ch", marginBottom: "2rem" }}>
            <Heading as="h1" size="8" style={{ marginBottom: "1rem" }}>
              Projects
            </Heading>
            <Text size="3" style={{ lineHeight: 1.6 }}>
              A collection of my development and design projects. Each project
              represents a unique challenge and showcases different technical
              skills and problem-solving approaches.
            </Text>
          </Box>

          <Flex
            direction="row"
            gap="6"
            wrap="wrap"
            style={{
              justifyContent: "flex-start",
            }}
          >
            {projectPosts.map((post) => (
              <ProjectCard key={post.slug} project={post} />
            ))}
          </Flex>
        </Flex>
      </Section>
    </Container>
  );
}

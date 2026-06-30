import { getBlogPosts } from "@/getBlogPosts";
import { Box, Flex, Heading, Text, Container, Section } from "@radix-ui/themes";
import { ProjectCard } from "@/components/ProjectCard";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = {
  title: "Projects",
  description:
    "Engineering and interface design projects by Jeremiah Fallin.",
};

export default async function Projects() {
  const blogPosts = await getBlogPosts();
  const projectPosts = blogPosts
    .filter((post) => post.slug.startsWith("projects/"))
    .sort(
      (a, b) =>
        new Date((b.metadata as { date?: string }).date ?? 0).getTime() -
        new Date((a.metadata as { date?: string }).date ?? 0).getTime()
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

          <ScrollReveal>
            <Flex direction="column" gap="5">
              {projectPosts.length > 0 && (
                <ProjectCard project={projectPosts[0]} featured />
              )}
              {projectPosts.length > 1 && (
                <Box className="card-grid-wide">
                  {projectPosts.slice(1).map((post) => (
                    <ProjectCard key={post.slug} project={post} />
                  ))}
                </Box>
              )}
            </Flex>
          </ScrollReveal>
        </Flex>
      </Section>
    </Container>
  );
}

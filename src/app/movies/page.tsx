import { getBlogPosts } from "@/getBlogPosts";
import MovieViewerClient from "@/components/MovieViewerClient";
import { Box, Flex, Heading, Text, Container, Section } from "@radix-ui/themes";

export const metadata = {
  title: "Movies",
  description:
    "Movie watch history ranked with a Bradley-Terry model and a TensorFlow logistic regression — sortable table and interactive comparison graph.",
};

export default async function Movies() {
  const blogPosts = await getBlogPosts();

  return (
    <Container size="3">
      <Section size="3" className="movies-section">
        <Flex direction="column" gap="4">
          <Box className="movies-header-container">
            <Heading as="h1" size="8" className="movies-heading">
              Movie Watch History
            </Heading>
            <Text size="3" className="movies-description">
              View my movie watch history as a table or interactive graph. Hover any score column header for an
              explanation of how the rating is calculated.
            </Text>
          </Box>

          <MovieViewerClient posts={blogPosts} />
        </Flex>
      </Section>
    </Container>
  );
}

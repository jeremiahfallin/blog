import React from "react";
import { Box, Badge, LinkBox, LinkOverlay } from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

import { formatAsDate } from "../lib/functions/format";

export default function ReviewPreviewCard({ review: any }) {
  return (
    <Box
      maxW="sm"
      h="100%"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
    >
      <LinkBox p="6">
        <Box display="flex" alignItems="baseline">
          <Badge
            borderRadius="full"
            px="2"
            colorScheme={review.recommend ? "teal" : "red"}
          >
            {review.recommend ? "👍🏼" : "👎🏼"}
          </Badge>
          <Box
            color="gray.500"
            fontWeight="semibold"
            letterSpacing="wide"
            fontSize="xs"
            ml="2"
          >
            {formatAsDate(new Date(review.date))}
          </Box>
        </Box>

        <Box
          mt="1"
          fontWeight="semibold"
          fontSize="lg"
          as="h4"
          lineHeight="tight"
          isTruncated
        >
          <LinkOverlay href={review.href}>{review.title}</LinkOverlay>
        </Box>

        <Box>{review.description}</Box>

        <Box display="flex" mt="2" alignItems="center">
          {Array(7)
            .fill("")
            .map((_, i) => (
              <StarIcon
                key={i}
                color={i < review.rating ? "green.500" : "gray.300"}
              />
            ))}
        </Box>
      </LinkBox>
    </Box>
  );
}

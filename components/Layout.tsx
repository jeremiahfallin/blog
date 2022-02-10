import React from "react";
import {
  useColorMode,
  Grid,
  GridItem,
  Flex,
  Box,
  Icon,
  useColorModeValue,
  Heading,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import Head from "next/head";
import { OutboundLink } from "react-ga";
import { FaTwitter, FaGithub, FaTwitch } from "react-icons/fa";

import { ChakraNextImage } from "./ChakraNextImage";
import Link from "./Link";

import meta from "../_data/meta.json";

export const Layout: React.FC = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const headerFade = useColorModeValue("green.400", "green.700");

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/img/512.png" />
      </Head>

      <Box
        position="absolute"
        top="1rem"
        right="2rem"
        onClick={toggleColorMode}
      >
        {colorMode === "light" ? (
          <SunIcon h={8} w={8} />
        ) : (
          <MoonIcon h={8} w={8} />
        )}
      </Box>
      <Box paddingBottom="2rem">
        <Grid
          as="header"
          w="100%"
          p="2rem"
          paddingTop="0"
          bgGradient={`linear(to-b, green.500, ${headerFade})`}
          templateColumns="repeat(2, 1fr)"
        >
          <Box>
            <Heading size="lg">
              <Link href="/" fontColor={"inherit"}>
                {meta.name}
              </Link>
            </Heading>
            <Heading size="md">{meta.description}</Heading>
          </Box>
          <Flex gap={4}>
            <Link href="/about" fontColor={"inherit"}>
              About
            </Link>
            <Link href="/contact" fontColor={"inherit"}>
              Contact
            </Link>
          </Flex>
        </Grid>
        <Grid
          gap={6}
          templateColumns="minmax(0.6rem, 1fr) minmax(0.6rem, 1fr) minmax(auto, 60ch) minmax(0.6rem, 1fr) minmax(0.6rem, 1fr)"
          paddingTop="2rem"
        >
          {children}
          <GridItem as="footer" colStart={3}>
            <Grid
              templateColumns="repeat(2, 1fr)"
              alignItems="center"
              justifyContent="center"
            >
              <GridItem>
                <Flex align="center" justify="center" flexDirection="column">
                  <ChakraNextImage
                    src="/img/profile.jpg"
                    alt="Jeremiah Fallin"
                    height={328}
                    width={250}
                    quality={100}
                    borderRadius="full"
                  />
                  <Heading as="h2" size="lg">
                    {meta.name}
                  </Heading>
                  <Heading as="h3" size="md">
                    {meta.description}
                  </Heading>
                </Flex>
              </GridItem>
              <GridItem>
                <Flex
                  h="100%"
                  gap={4}
                  direction="column"
                  align="center"
                  justify="center"
                >
                  <OutboundLink
                    eventLabel="Social Media Link"
                    to={meta.author.social.twitter}
                    aria-label="Twitter"
                  >
                    <Icon as={FaTwitter} w={12} h={12} color="twitter.500" />
                  </OutboundLink>
                  <OutboundLink
                    eventLabel="Social Media Link"
                    to={meta.author.social.github}
                    aria-label="Github"
                  >
                    <Icon as={FaGithub} w={12} h={12} color="github.500" />
                  </OutboundLink>
                  <OutboundLink
                    eventLabel="Social Media Link"
                    to={meta.author.social.twitch}
                    aria-label="Twitch"
                  >
                    <Icon as={FaTwitch} w={12} h={12} color="#9146FF" />
                  </OutboundLink>
                </Flex>
              </GridItem>
            </Grid>
          </GridItem>
        </Grid>
      </Box>
    </>
  );
};

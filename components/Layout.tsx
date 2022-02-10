import React from "react";
import {
  useColorMode,
  Grid,
  GridItem,
  Flex,
  Box,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";
import Link from "next/link";
import Head from "next/head";
import { OutboundLink } from "react-ga";
import styled from "styled-components";
import { FaTwitter, FaGithub, FaTwitch } from "react-icons/fa";

import { ChakraNextImage } from "./ChakraNextImage";

import meta from "../_data/meta.json";

const ModeToggle = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
`;

export const Layout: React.FC = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  const headerFade = useColorModeValue("green.400", "green.700");

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/img/512.png" />
      </Head>

      <ModeToggle onClick={toggleColorMode}>
        {colorMode === "light" ? (
          <SunIcon h={8} w={8} />
        ) : (
          <MoonIcon h={8} w={8} />
        )}
      </ModeToggle>
      <Box paddingBottom="2rem">
        <Box
          w="100%"
          p="2rem"
          bgGradient={`linear(to-b, green.500, ${headerFade})`}
        >
          <header>
            <div>
              <div>
                <Link href="/">
                  <a>
                    <h1>{meta.name}</h1>
                  </a>
                </Link>
                <h2>{meta.description}</h2>
              </div>
              <div>
                <Link href="/about">
                  <a>About</a>
                </Link>
                <Link href="/contact">
                  <a>Contact</a>
                </Link>
              </div>
            </div>
          </header>
        </Box>
        <Grid
          gap={6}
          templateColumns="minmax(0.6rem, 1fr) minmax(0.6rem, 1fr) minmax(auto, 60ch) minmax(0.6rem, 1fr) minmax(0.6rem, 1fr)"
          paddingTop="2rem"
        >
          {children}
          <GridItem colStart={3}>
            <Grid
              templateColumns="repeat(2, 1fr)"
              alignItems="center"
              justifyContent="center"
            >
              <GridItem>
                <ChakraNextImage
                  src="/img/profile.jpg"
                  alt="Jeremiah Fallin"
                  height={328}
                  width={250}
                  quality={100}
                  borderRadius="full"
                />
                <div>
                  <h2>{meta.name}</h2>
                  <h3>{meta.description}</h3>
                </div>
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

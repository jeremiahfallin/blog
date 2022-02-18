import React, { useState, useEffect } from "react";
import { GetStaticPropsContext, NextPage, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { Box, Heading, Grid, GridItem } from "@chakra-ui/react";

import { asyncMap } from "@arcath/utils/lib/functions/async-map";
import { pick } from "@arcath/utils/lib/functions/pick";
import { replaceProperty } from "@arcath/utils/lib/functions/replace-property";

import { Layout } from "../components/Layout";
import { getMovies } from "../lib/data/movies";
import { getShows } from "../lib/data/shows";
import { getProjects } from "../lib/data/projects";

import ReviewPreviewCard from "../components/ReviewPreviewCard";
import Link from "../components/Link";

import meta from "../_data/meta.json";

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const movies = await asyncMap(await getMovies(), async (movies) => {
    const data = replaceProperty(
      pick(await movies.data, [
        "title",
        "href",
        "description",
        "rating",
        "slug",
        "date",
        "recommend",
        "published",
      ]),
      "date",
      (date) => date.toISOString()
    );
    const content = await movies.bundle;

    return { ...data, content };
  });

  const shows = await asyncMap(await getShows(), async (shows) => {
    const data = replaceProperty(
      pick(await shows.data, [
        "title",
        "href",
        "description",
        "rating",
        "slug",
        "date",
        "recommend",
        "published",
      ]),
      "date",
      (date) => date.toISOString()
    );
    const content = await shows.bundle;

    return { ...data, content };
  });

  const projects = await asyncMap(
    await getProjects({ order: "DESC" }),
    async (project) => {
      return pick(await project.data, ["title", "href", "year"]);
    }
  );

  return {
    props: {
      movies,
      shows,
      projects,
    },
  };
};

const IndexPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  movies,
  shows,
  projects,
}) => {
  return (
    <Layout>
      <Head>
        <title>
          {meta.name} / {meta.description}
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Heading as="h2" size="lg" paddingBottom={2} gridColumnStart={3}>
        Movies
      </Heading>
      <Grid
        gap={4}
        gridColumnStart={3}
        templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]}
        w="100%"
      >
        {movies.map((movie) => {
          if (!movie.published) return null;
          return (
            <GridItem key={movie.slug}>
              <ReviewPreviewCard review={movie} />
            </GridItem>
          );
        })}
      </Grid>
      <Box paddingBottom={6} gridColumnStart={3}>
        <Link href="/movies">More...</Link>
      </Box>

      <Heading as="h2" size="lg" paddingBottom={2} gridColumnStart={3}>
        Shows
      </Heading>
      <Grid
        gap={4}
        gridColumnStart={3}
        templateColumns={["repeat(1, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)"]}
      >
        {shows.map((show) => {
          if (!show.published) return null;
          return (
            <GridItem key={show.slug}>
              <ReviewPreviewCard key={show.slug} review={show} />
            </GridItem>
          );
        })}
      </Grid>
      <Box paddingBottom={6} gridColumnStart={3}>
        <Link href="/shows">More...</Link>
      </Box>
      <Grid gap={2} gridColumnStart={3}>
        <Heading as="h2" size="lg">
          Projects
        </Heading>
        {projects.map((project) => {
          return (
            <Box key={project.href} paddingBottom={2}>
              <Link href={`${project.href}`}>{project.title}</Link>
            </Box>
          );
        })}
      </Grid>
    </Layout>
  );
};

export default IndexPage;

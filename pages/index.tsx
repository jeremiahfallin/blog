import React from "react";
import { GetStaticPropsContext, NextPage, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import { Grid, GridItem } from "@chakra-ui/react";
import { asyncMap } from "@arcath/utils/lib/functions/async-map";
import { pick } from "@arcath/utils/lib/functions/pick";

import { Layout } from "../components/layout";
import { getMovies } from "../lib/data/movies";
import { getShows } from "../lib/data/shows";

import ReviewPreviewCard from "../components/ReviewPreviewCard";

import meta from "../_data/meta.json";

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const movies = await asyncMap(await getMovies(), async (movies) => {
    const data = pick(await movies.data, [
      "title",
      "href",
      "description",
      "rating",
      "slug",
      "date",
      "recommend",
      "published",
    ]);
    const content = await movies.bundle;

    return { ...data, content };
  });

  const shows = await asyncMap(await getShows(), async (shows) => {
    const data = pick(await shows.data, [
      "title",
      "href",
      "description",
      "rating",
      "slug",
      "date",
      "recommend",
      "published",
    ]);
    const content = await shows.bundle;

    return { ...data, content };
  });
  return {
    props: {
      movies,
      shows,
    },
  };
};

const IndexPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  movies,
  shows,
}) => {
  return (
    <Layout>
      <Head>
        <title>
          {meta.name} / {meta.description}
        </title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <GridItem as="main" colStart={3}>
        <Grid
          gap={6}
          templateColumns={[
            "repeat(1, 1fr)",
            "repeat(2, 1fr)",
            "repeat(3, 1fr)",
          ]}
        >
          {movies.map((movie) => {
            if (!movie.published) return null;
            return (
              <GridItem key={movie.slug}>
                <ReviewPreviewCard review={movie} />
              </GridItem>
            );
          })}
          {shows.map((show) => {
            if (!show.published) return null;
            return <ReviewPreviewCard key={show.slug} review={show} />;
          })}
        </Grid>
      </GridItem>

      <footer></footer>
    </Layout>
  );
};

export default IndexPage;

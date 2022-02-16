import React from "react";
import { GetStaticPropsContext, NextPage, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { Box, Heading } from "@chakra-ui/react";
import { pick } from "@arcath/utils/lib/functions/pick";
import { asyncMap } from "@arcath/utils/lib/functions/async-map";

import { getMovies } from "../../lib/data/movies";

import { Layout } from "../../components/Layout";
import Link from "../../components/Link";

import { pageTitle } from "../../lib/functions/page-title";

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const movies = await getMovies({ limit: false });

  const moviesWithSource = await asyncMap(movies, async (movie) => {
    const source = await movie.bundle;

    return pick({ ...(await movie.data), source }, [
      "title",
      "source",
      "date",
      "href",
      "description",
    ]);
  });

  return {
    props: {
      movies: moviesWithSource,
    },
  };
};

const MoviesPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  movies,
}) => {
  return (
    <Layout>
      <Head>
        <title>{pageTitle("Movies")}</title>
      </Head>
      <Box>
        {movies.map(({ title, href, description }, i) => {
          return (
            <Box key={href}>
              <Box>
                <Link href={href}>
                  <Heading>{title}</Heading>
                </Link>
                <Box>{description}</Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Layout>
  );
};

export default MoviesPage;

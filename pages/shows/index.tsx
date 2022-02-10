import React from "react";
import { GetStaticPropsContext, NextPage, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { Box, Heading } from "@chakra-ui/react";
import { pick } from "@arcath/utils/lib/functions/pick";
import { asyncMap } from "@arcath/utils/lib/functions/async-map";

import { getShows } from "../../lib/data/shows";

import { Layout } from "../../components/Layout";
import Link from "../../components/Link";

import { pageTitle } from "../../lib/functions/page-title";

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const shows = await getShows({ limit: false });

  const showsWithSource = await asyncMap(shows, async (show) => {
    const source = await show.bundle;

    return pick({ ...(await show.data), source }, [
      "title",
      "source",
      "href",
      "description",
    ]);
  });

  return {
    props: {
      shows: showsWithSource,
    },
  };
};

const ShowsPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  shows,
}) => {
  return (
    <Layout>
      <Head>
        <title>{pageTitle("Shows")}</title>
      </Head>
      <Box>
        {shows.map(({ title, href, description }, i) => {
          return (
            <Box key={href}>
              <Box className="col-span-2">
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

export default ShowsPage;

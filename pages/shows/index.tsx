import React from "react";
import { GetStaticPropsContext, NextPage, InferGetStaticPropsType } from "next";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import { pick } from "@arcath/utils/lib/functions/pick";
import { asyncMap } from "@arcath/utils/lib/functions/async-map";
import { OutboundLink } from "react-ga";

import { getShows } from "../../lib/data/shows";

import { Layout } from "../../components/layout";
import { MDX } from "../../components/MDX";

import { pageTitle } from "../../lib/functions/page-title";

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const shows = await getShows({ limit: false });

  const showsWithSource = await asyncMap(shows, async (show) => {
    const source = await show.bundle;

    return pick({ ...(await show.data), source }, ["title", "source", "href"]);
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
      <div>
        {shows.map(({ title, href, cover, source, link, description }, i) => {
          return (
            <div key={href}>
              <div className="col-span-2">
                <Link href={href}>
                  <h3>{title}</h3>
                </Link>
                <div>{description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default ShowsPage;

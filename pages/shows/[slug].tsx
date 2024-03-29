import React from "react";
import {
  GetStaticPropsContext,
  NextPage,
  GetStaticPaths,
  InferGetStaticPropsType,
} from "next";

import Head from "next/head";
import { pick } from "@arcath/utils/lib/functions/pick";

import { getShows, getShowFromSlug } from "../../lib/data/shows";
import { pageTitle } from "../../lib/functions/page-title";

import { Content } from "../../components/MDX";
import { Layout } from "../../components/Layout";

export const getStaticProps = async ({
  params,
}: GetStaticPropsContext<{ slug: string }>) => {
  if (params.slug) {
    const show = getShowFromSlug(params.slug);

    const source = await show.bundle;

    return {
      props: {
        show: pick(await show.data, ["slug", "title"]),
        source,
      },
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const shows = await getShows({ limit: false });

  const paths = shows.map(({ properties }) => {
    return { params: { slug: properties.slug } };
  });

  return {
    paths,
    fallback: false,
  };
};

const MDXShow: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  show,
  source,
}) => {
  return (
    <Layout>
      <Head>
        <title>{pageTitle(show.title)}</title>
      </Head>
      <Content source={source} heading={show.title} />
    </Layout>
  );
};

export default MDXShow;

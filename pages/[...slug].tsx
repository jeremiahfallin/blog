import React from "react";
import {
  GetStaticPropsContext,
  NextPage,
  GetStaticPaths,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { GridItem } from "@chakra-ui/react";
import { pick } from "@arcath/utils/lib/functions/pick";

import { getPageBySlug, getPages } from "../lib/data/pages";

import { Content } from "../components/MDX";
import { Layout } from "../components/Layout";

import { pageTitle } from "../lib/functions/page-title";

export const getStaticProps = async ({
  params,
}: GetStaticPropsContext<{ slug: string[] }>) => {
  if (params?.slug) {
    const page = getPageBySlug(params.slug[0]);

    const source = await page.bundle;

    return {
      props: {
        page: pick(await page.data, ["title", "slug"]),
        source,
      },
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getPages({ limit: false });

  const paths = pages.map(({ properties }) => {
    return { params: { slug: [properties.slug] } };
  });

  return {
    paths,
    fallback: false,
  };
};

const MDXPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  page,
  source,
}) => {
  return (
    <Layout>
      <Head>
        <title>{pageTitle(page.title)}</title>
      </Head>
      <GridItem colStart={3}>
        <Content source={source} heading={page.title} />
      </GridItem>
    </Layout>
  );
};

export default MDXPage;

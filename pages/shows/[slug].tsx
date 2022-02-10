import React from "react";
import {
  GetStaticPropsContext,
  NextPage,
  GetStaticPaths,
  InferGetStaticPropsType,
} from "next";
import { pick } from "@arcath/utils/lib/functions/pick";

import { getShows, getShowFromSlug } from "../../lib/data/shows";

import { MDX, ContentContainer } from "../../components/MDX";
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
  source,
}) => {
  return (
    <Layout>
      <ContentContainer>
        <MDX source={source} />
      </ContentContainer>
    </Layout>
  );
};

export default MDXShow;

import React from "react";
import {
  GetStaticPropsContext,
  NextPage,
  GetStaticPaths,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { pick } from "@arcath/utils/lib/functions/pick";

import { getMovies, getMovieFromSlug } from "../../lib/data/movies";
import { pageTitle } from "../../lib/functions/page-title";

import { Content } from "../../components/MDX";
import { Layout } from "../../components/Layout";

export const getStaticProps = async ({
  params,
}: GetStaticPropsContext<{ slug: string }>) => {
  if (params.slug) {
    const movie = getMovieFromSlug(params.slug);

    const source = await movie.bundle;

    return {
      props: {
        movie: pick(await movie.data, ["slug", "title"]),
        source,
      },
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const movies = await getMovies({ limit: false });

  const paths = movies.map(({ properties }) => {
    return { params: { slug: properties.slug } };
  });

  return {
    paths,
    fallback: false,
  };
};

const MDXMovie: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  movie,
  source,
}) => {
  return (
    <Layout>
      <Head>
        <title>{pageTitle(movie.title)}</title>
      </Head>
      <Content source={source} heading={movie.title} />
    </Layout>
  );
};

export default MDXMovie;

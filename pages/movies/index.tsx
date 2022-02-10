import React from "react";
import { GetStaticPropsContext, NextPage, InferGetStaticPropsType } from "next";
import Link from "next/link";
import Head from "next/head";
import { pick } from "@arcath/utils/lib/functions/pick";
import { asyncMap } from "@arcath/utils/lib/functions/async-map";

import { getMovies } from "../../lib/data/movies";

import { Layout } from "../../components/Layout";

import { pageTitle } from "../../lib/functions/page-title";

export const getStaticProps = async ({}: GetStaticPropsContext) => {
  const movies = await getMovies({ limit: false });

  const moviesWithSource = await asyncMap(movies, async (movie) => {
    const source = await movie.bundle;

    return pick({ ...(await movie.data), source }, [
      "title",
      "source",
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
      <div>
        {movies.map(({ title, href, description }, i) => {
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

export default MoviesPage;

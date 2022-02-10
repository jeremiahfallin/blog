import React from "react";
import {
  GetStaticPropsContext,
  NextPage,
  GetStaticPaths,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import { pick } from "@arcath/utils/lib/functions/pick";

import { getProjects, getProjectBySlug } from "../../lib/data/projects";
import { pageTitle } from "../../lib/functions/page-title";

import { Content } from "../../components/MDX";
import { Layout } from "../../components/Layout";

export const getStaticProps = async ({
  params,
}: GetStaticPropsContext<{ slug: string }>) => {
  if (params?.slug) {
    const project = getProjectBySlug(params.slug);

    const source = await project.bundle;

    return {
      props: {
        project: pick(await project.data, ["slug", "title", "lead"]),
        source,
      },
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getProjects({ limit: false });

  const paths = projects.map(({ properties }) => {
    return { params: { slug: properties.slug } };
  });

  return {
    paths,
    fallback: false,
  };
};

const MDXProject: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  project,
  source,
}) => {
  return (
    <Layout>
      <Head>
        <title>{pageTitle(project.title)}</title>
      </Head>
      <Content source={source} heading={project.title} />
    </Layout>
  );
};

export default MDXProject;

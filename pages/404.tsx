import React from "react";
import { NextPage } from "next";
import Head from "next/head";
import Link from "../components/Link";

const NotFoundPage: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Error 404 / Page Not Found</title>
      </Head>
      <h1>404</h1>
      <p>
        <i>No such page.</i>
      </p>
      <p>
        <Link href="/">
          <a>Head home and try again</a>
        </Link>
      </p>
      <p>
        If you think this page should exist please{" "}
        <a href="https://github.com/jeremiahfallin/blog/issues">
          open an issue on GitHub
        </a>{" "}
        and I&apos;ll check it out.
      </p>
    </div>
  );
};

export default NotFoundPage;

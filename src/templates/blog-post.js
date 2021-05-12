import React from "react";
import { Link, graphql } from "gatsby";

import Bio from "../components/Bio";
import Layout from "../components/Layout";
import SEO from "../components/SEO";
import HitsCounter from "../components/HitsCounter";

const BlogPostTemplate = (props) => {
  const post = props.data.markdownRemark;
  const siteTitle = props.data.site.siteMetadata.title;

  return (
    <Layout location={props.location} title={siteTitle}>
      <SEO
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />
      <header>
        <h1
          style={{
            marginTop: `15px`,
            marginBottom: 0,
          }}
        >
          {post.frontmatter.title}
        </h1>
        <p
          style={{
            display: `block`,
            marginBottom: `15px`,
          }}
        >
          {post.frontmatter.date}
        </p>
      </header>
      <section dangerouslySetInnerHTML={{ __html: post.html }} />
      <hr
        style={{
          marginBottom: `15px`,
        }}
      />
      <footer>
        <HitsCounter slug={post.fields.slug}></HitsCounter>
      </footer>
    </Layout>
  );
};

export default BlogPostTemplate;

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
      fields {
        slug
      }
    }
  }
`;

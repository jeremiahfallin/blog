import React from "react";
import { Link, graphql } from "gatsby";

import Layout from "../components/Layout";
import SEO from "../components/SEO";

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title;
  const posts = data.allMarkdownRemark.edges;

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="All posts" />
      {posts
        .filter((post) => post?.node?.frontmatter?.published)
        .map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug;
          return node.frontmatter.date !== "Invalid date" ? (
            <article key={node.fields.slug}>
              <header>
                <h3
                  style={{
                    marginBottom: `15px`,
                  }}
                >
                  <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
                    {title}
                  </Link>
                </h3>
                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
                >
                  <small>{node.frontmatter.date}</small>
                  <div style={{ color: "var(--accent)" }}>
                    {"★".repeat(parseInt(node.frontmatter.rating[0]))}
                    {"☆".repeat(7 - parseInt(node.frontmatter.rating[0]))}
                  </div>
                </div>
              </header>
              <section>
                <p
                  dangerouslySetInnerHTML={{
                    __html: node.frontmatter.description || node.excerpt,
                  }}
                />
              </section>
            </article>
          ) : null;
        })}
    </Layout>
  );
};

export default BlogIndex;

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            published
            title
            description
            rating
          }
        }
      }
    }
  }
`;

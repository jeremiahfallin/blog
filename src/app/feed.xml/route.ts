import { getBlogPosts, BlogPostData } from "@/getBlogPosts";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/config";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPostTime(post: BlogPostData): number {
  const date = (post.metadata as { date?: string }).date;
  return date ? new Date(date).getTime() : 0;
}

export async function GET() {
  const posts = (await getBlogPosts())
    .slice()
    .sort((a, b) => getPostTime(b) - getPostTime(a));

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/${post.slug}`;
      const date = (post.metadata as { date?: string }).date;
      const pubDate = date
        ? `\n      <pubDate>${new Date(date).toUTCString()}</pubDate>`
        : "";
      return `    <item>
      <title>${escapeXml(post.metadata.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escapeXml(post.metadata.description)}</description>${pubDate}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

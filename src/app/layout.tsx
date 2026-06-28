import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Box, Flex, Theme } from "@radix-ui/themes";
import SiteHeader from "@/components/SiteHeader";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from "@/config";
import "@radix-ui/themes/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark-theme">
      <body className={geistSans.variable}>
        <Theme appearance="dark" accentColor="blue" grayColor="slate" panelBackground="translucent">
          <Flex direction="column" gap="4">
            <SiteHeader />
            <Box style={{ paddingTop: "80px", minHeight: "100vh" }}>
              {children}
            </Box>
          </Flex>
        </Theme>
      </body>
    </html>
  );
}


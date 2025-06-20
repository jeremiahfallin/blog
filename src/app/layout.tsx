import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Box, Flex, Link, Theme } from "@radix-ui/themes";
import "./globals.css";
import "@radix-ui/themes/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jeremiah Fallin | Developer Portfolio",
  description: "Projects, movies, and more by Jeremiah Fallin",
};

function Header() {
  return (
    <Flex asChild justify="between">
      <header>
        <Link href="/">Jeremiah Fallin</Link>
        <Flex gap="2">
          <Link href="/movies">Movies</Link>
          <Link href="/projects">Projects</Link>
        </Flex>
      </header>
    </Flex>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Theme appearance="dark">
          <Flex direction="column" gap="4" p="2">
            <Header />
            <Box>{children}</Box>
          </Flex>
        </Theme>
      </body>
    </html>
  );
}

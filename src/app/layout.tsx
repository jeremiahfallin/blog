import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Box, Flex, Link, Theme } from "@radix-ui/themes";
import SocialLinks from "@/components/SocialLinks";
import "@radix-ui/themes/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jeremiah Fallin | Developer Portfolio",
  description: "Projects, movies, and more by Jeremiah Fallin",
};

function Header() {
  return (
    <header className="glass-navbar">
      <Flex justify="between" align="center" style={{ width: "100%" }}>
        <Link href="/" className="nav-logo">
          Jeremiah Fallin
        </Link>
        <Flex gap="3" align="center" className="nav-links">
          <Link href="/projects" className="nav-link-item">
            Projects
          </Link>
          <Link href="/movies" className="nav-link-item">
            Movies
          </Link>
          <Link href="/shows" className="nav-link-item">
            Shows
          </Link>
          <Link href="/about" className="nav-link-item">
            About
          </Link>
          <Box ml="1">
            <SocialLinks size={18} gap="2" />
          </Box>
        </Flex>
      </Flex>
    </header>
  );
}

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
            <Header />
            <Box style={{ paddingTop: "80px", minHeight: "100vh" }}>
              {children}
            </Box>
          </Flex>
        </Theme>
      </body>
    </html>
  );
}


"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Link } from "@radix-ui/themes";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import SocialLinks from "@/components/SocialLinks";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/movies", label: "Movies" },
  { href: "/shows", label: "Shows" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: close on Escape (restoring focus to the toggle) or outside click,
  // and close automatically if the viewport grows back to the desktop layout.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    const desktop = window.matchMedia("(min-width: 701px)");
    function onDesktop(e: MediaQueryListEvent) {
      if (e.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <header className="glass-navbar">
      <Flex justify="between" align="center" style={{ width: "100%" }}>
        <Link asChild className="nav-logo">
          <NextLink href="/">Jeremiah Fallin</NextLink>
        </Link>

        {/* Desktop navigation — hidden below the mobile breakpoint */}
        <Flex gap="3" align="center" className="nav-links" asChild>
          <nav aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link asChild className="nav-link-item" key={link.href}>
                <NextLink href={link.href}>{link.label}</NextLink>
              </Link>
            ))}
            <Box ml="1">
              <SocialLinks size={18} gap="2" />
            </Box>
          </nav>
        </Flex>

        {/* Mobile toggle — shown only below the breakpoint */}
        <button
          ref={buttonRef}
          type="button"
          className="nav-hamburger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="nav-hamburger-bars" data-open={open} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </Flex>

      {open && (
        <div id="mobile-nav-panel" ref={panelRef} className="nav-mobile-panel">
          <nav aria-label="Site">
            <Flex direction="column" gap="1">
              {NAV_LINKS.map((link) => (
                <Link asChild className="nav-mobile-link" key={link.href}>
                  <NextLink href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                  </NextLink>
                </Link>
              ))}
              <Box mt="1" pt="2" className="nav-mobile-socials">
                <SocialLinks size={20} gap="3" />
              </Box>
            </Flex>
          </nav>
        </div>
      )}
    </header>
  );
}

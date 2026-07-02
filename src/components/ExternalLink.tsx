import { Link } from "@radix-ui/themes";
import type { ComponentProps } from "react";

type RadixLinkProps = ComponentProps<typeof Link>;

interface ExternalLinkProps extends RadixLinkProps {
  href: string;
  /**
   * When the visible content already conveys meaning to assistive tech
   * (e.g. an icon with its own aria-label), set this false to skip the
   * appended "opens in new tab" hint and avoid a redundant announcement.
   */
  newTabHint?: boolean;
}

/**
 * A Radix Link for external destinations. Always opens in a new tab with
 * the required rel hardening, and appends a visually-hidden "(opens in new
 * tab)" cue so screen-reader users are warned before following the link.
 */
export default function ExternalLink({
  children,
  newTabHint = true,
  ...props
}: ExternalLinkProps) {
  return (
    <Link {...props} target="_blank" rel="noopener noreferrer">
      {children}
      {newTabHint && <span className="visually-hidden"> (opens in new tab)</span>}
    </Link>
  );
}

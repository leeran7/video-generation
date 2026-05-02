"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ScopedLink {
  segment: string;
  label: string;
}

const SHOW_LINKS: ScopedLink[] = [
  { segment: "", label: "Roster" },
  { segment: "/locations", label: "Locations" },
  { segment: "/episodes", label: "Episodes" },
];

export function SiteNav() {
  const pathname = usePathname() ?? "/";

  // Extract show slug from /shows/<slug>/...
  const match = pathname.match(/^\/shows\/([^/]+)/);
  const showSlug = match?.[1];

  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="site-brand">
          STUDIO
        </Link>

        {showSlug && (
          <ul className="site-nav-links">
            {SHOW_LINKS.map((link) => {
              const href = `/shows/${showSlug}${link.segment}`;
              const active =
                link.segment === ""
                  ? pathname === `/shows/${showSlug}` ||
                    pathname.startsWith(`/shows/${showSlug}/characters`)
                  : pathname.startsWith(href);
              return (
                <li key={link.segment}>
                  <Link
                    href={href}
                    className={`site-nav-link${active ? " is-active" : ""}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}

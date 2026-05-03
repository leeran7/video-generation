"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAB_LINKS: { segment: string; label: string }[] = [
  { segment: "", label: "Roster" },
  { segment: "/locations", label: "Locations" },
  { segment: "/episodes", label: "Episodes" },
];

export function ShowAppHeader({
  showTitle,
  showSlug,
}: {
  showTitle: string;
  showSlug: string;
}) {
  const pathname = usePathname() ?? "";
  const base = `/shows/${showSlug}`;
  const crumbs = buildBreadcrumbs(pathname, base, showTitle);

  return (
    <header className="show-app-header">
      <div className="show-app-header-inner">
        <nav className="breadcrumb-nav" aria-label="Breadcrumb">
          <ol className="breadcrumb-list">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="breadcrumb-item">
                {i > 0 ? (
                  <span className="breadcrumb-sep" aria-hidden>
                    /
                  </span>
                ) : null}
                {c.href ? (
                  <Link href={c.href} className="breadcrumb-link">
                    {c.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-current" aria-current="page">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="show-app-title">{showTitle}</h1>

        <ul className="show-app-tabs">
          {TAB_LINKS.map((link) => {
            const href = `${base}${link.segment}`;
            const active =
              link.segment === ""
                ? pathname === base ||
                  pathname.startsWith(`${base}/characters`)
                : pathname.startsWith(href);
            return (
              <li key={link.segment}>
                <Link
                  href={href}
                  className={`show-app-tab${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}

function buildBreadcrumbs(
  pathname: string,
  base: string,
  showTitle: string
): { label: string; href?: string }[] {
  const items: { label: string; href?: string }[] = [
    { label: "Studio", href: "/" },
    { label: showTitle, href: base },
  ];

  if (pathname === base) {
    items.push({ label: "Roster" });
    return items;
  }

  const charPrefix = `${base}/characters/`;
  if (pathname.startsWith(charPrefix)) {
    const slug = pathname.slice(charPrefix.length).split("/")[0] ?? "";
    items.push({ label: "Roster", href: base });
    items.push({ label: humanizeSlug(slug) });
    return items;
  }

  const epList = `${base}/episodes`;
  if (pathname === epList) {
    items.push({ label: "Episodes" });
    return items;
  }

  const epPrefix = `${base}/episodes/`;
  if (pathname.startsWith(epPrefix)) {
    const tail = pathname.slice(epPrefix.length).split("/")[0] ?? "";
    items.push({ label: "Episodes", href: epList });
    if (tail) {
      items.push({ label: humanizeSlug(tail) });
    }
    return items;
  }

  if (pathname.startsWith(`${base}/locations`)) {
    items.push({ label: "Locations" });
    return items;
  }

  return items;
}

function humanizeSlug(slug: string): string {
  const stripped = slug.replace(/^s\d+e\d+-/i, "");
  return stripped
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

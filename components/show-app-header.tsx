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
    <header className="sticky top-[49px] z-40 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-[1400px] px-6 pb-0 pt-[14px]">
        <nav className="mb-1.5" aria-label="Breadcrumb">
          <ol className="m-0 flex list-none flex-wrap items-center gap-x-0.5 p-0 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 ? (
                  <span className="select-none font-medium text-[var(--muted)]" aria-hidden>
                    /
                  </span>
                ) : null}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="text-[var(--muted)] no-underline transition-colors hover:text-[var(--text)]"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-[var(--text)]" aria-current="page">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mb-[14px] text-[clamp(24px,4vw,40px)] font-bold tracking-[0.08em] text-[var(--text)]">
          {showTitle}
        </h1>
        <ul className="m-0 flex list-none flex-wrap gap-1 p-0 pb-3">
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
                  className={`inline-block rounded-[2px] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--muted)] no-underline transition-colors hover:text-[var(--text)]${
                    active ? " bg-white/10 text-[var(--text)]" : ""
                  }`}
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

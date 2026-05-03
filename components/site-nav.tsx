import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="site-brand">
          STUDIO
        </Link>
      </div>
    </nav>
  );
}

import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";

export default async function Home() {
  const showRows = await db.select().from(shows).orderBy(asc(shows.title));

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-0.02em]">
            Studio
          </h1>
          <p className="text-xs uppercase tracking-[0.15em] text-(--muted)">
            {showRows.length} show{showRows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/shows/new"
          className="mb-1 rounded border border-(--border) px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-(--muted) no-underline transition-colors hover:border-(--text) hover:text-(--text)"
        >
          + New show
        </Link>
      </div>
      <div className="mt-8 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
        {showRows.map((show) => (
          <Link
            key={show.id}
            href={`/shows/${show.slug}`}
            className="flex items-center justify-between rounded border border-(--border) bg-(--panel) px-[22px] py-6 text-(--text) no-underline transition-colors hover:border-(--text)"
          >
            <h2 className="m-0 text-lg font-extrabold tracking-[-0.01em]">
              {show.title}
            </h2>
            <span className="text-[11px] uppercase tracking-[0.25em] text-(--muted)">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}

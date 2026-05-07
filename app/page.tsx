import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";
import { PageContainer, PageHeading, Subtext } from "@/components/ui/atoms";

export default async function Home() {
  const showRows = await db.select().from(shows).orderBy(asc(shows.title));

  return (
    <PageContainer>
      <div className="flex items-end justify-between">
        <div>
          <PageHeading>Studio</PageHeading>
          <Subtext>
            {showRows.length} show{showRows.length === 1 ? "" : "s"}
          </Subtext>
        </div>
        <Link
          href="/shows/new"
          className="mb-1 rounded border border-(--border) px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-(--muted) no-underline transition-colors hover:border-(--text) hover:text-(--text)"
        >
          + New show
        </Link>
      </div>
      <div className="mt-8 grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
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
    </PageContainer>
  );
}

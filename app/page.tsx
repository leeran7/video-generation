import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";

export default async function Home() {
  const showRows = await db.select().from(shows).orderBy(asc(shows.title));

  return (
    <main>
      <h1>Studio</h1>
      <p>{showRows.length} show{showRows.length === 1 ? "" : "s"}</p>

      <div className="show-picker">
        {showRows.map((show) => (
          <Link
            key={show.id}
            href={`/shows/${show.slug}`}
            className="show-tile"
          >
            <h2>{show.title}</h2>
            <span className="show-tile-cta">Open →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

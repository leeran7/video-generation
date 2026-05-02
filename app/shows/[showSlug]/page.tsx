import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { CharacterCard } from "@/components/character-card";
import { AntagonistCard } from "@/components/antagonist-card";
import {
  ANTAGONIST_ACCENT,
  accentForRoster,
  type Antagonist,
  type Character,
} from "@/lib/character-data";
import { db } from "@/lib/db/client";
import { characters, shows } from "@/lib/db/schema";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ showSlug: string }>;
}) {
  const { showSlug } = await params;

  const [show] = await db
    .select()
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);

  if (!show) notFound();

  const characterRows = await db
    .select()
    .from(characters)
    .where(eq(characters.showId, show.id))
    .orderBy(
      sql`${characters.rosterNumber} nulls last`,
      asc(characters.name),
    );

  const heroes = characterRows.filter((r) => r.rosterNumber != null);
  const antagonists = characterRows.filter((r) => r.rosterNumber == null);

  return (
    <main>
      <h1 className="show-title">{show.title}</h1>
      <p className="show-meta">
        {heroes.length} heroes · {antagonists.length} antagonists
      </p>

      {heroes.length > 0 && (
        <>
          <h3 className="roster-heading">Heroes</h3>
          <div className="cards-container">
            {heroes.map((row) => (
              <Link
                key={row.slug}
                href={`/shows/${showSlug}/characters/${row.slug}`}
                className="card-link"
              >
                <CharacterCard
                  character={row.data as unknown as Character}
                  accent={accentForRoster(row.rosterNumber!)}
                />
              </Link>
            ))}
          </div>
        </>
      )}

      {antagonists.length > 0 && (
        <>
          <h3 className="roster-heading">Antagonists</h3>
          <div className="cards-container">
            {antagonists.map((row) => (
              <Link
                key={row.slug}
                href={`/shows/${showSlug}/characters/${row.slug}`}
                className="card-link"
              >
                <AntagonistCard
                  antagonist={row.data as unknown as Antagonist}
                  accent={ANTAGONIST_ACCENT}
                />
              </Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

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
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <p className="mb-5 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
        {heroes.length} heroes · {antagonists.length} antagonists
      </p>

      {heroes.length > 0 && (
        <>
          <h3 className="mb-4 mt-8 border-b border-[var(--border)] pb-1.5 text-xs font-bold uppercase tracking-[0.4em] text-[var(--muted)]">
            Heroes
          </h3>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {heroes.map((row) => (
              <Link
                key={row.slug}
                href={`/shows/${showSlug}/characters/${row.slug}`}
                className="group flex h-full text-inherit no-underline"
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
          <h3 className="mb-4 mt-8 border-b border-[var(--border)] pb-1.5 text-xs font-bold uppercase tracking-[0.4em] text-[var(--muted)]">
            Antagonists
          </h3>
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {antagonists.map((row) => (
              <Link
                key={row.slug}
                href={`/shows/${showSlug}/characters/${row.slug}`}
                className="group flex h-full text-inherit no-underline"
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

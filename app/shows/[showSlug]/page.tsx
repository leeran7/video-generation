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
import { PageContainer, Subtext, SectionHeading, CardGrid } from "@/components/ui/atoms";

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
    <PageContainer>
      <Subtext className="mb-5">
        {heroes.length} heroes · {antagonists.length} antagonists
      </Subtext>

      {heroes.length > 0 && (
        <>
          <SectionHeading className="mb-4 mt-8">Heroes</SectionHeading>
          <CardGrid>
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
          </CardGrid>
        </>
      )}

      {antagonists.length > 0 && (
        <>
          <SectionHeading className="mb-4 mt-8">Antagonists</SectionHeading>
          <CardGrid>
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
          </CardGrid>
        </>
      )}
    </PageContainer>
  );
}

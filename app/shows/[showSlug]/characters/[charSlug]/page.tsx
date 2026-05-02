import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CharacterDetail } from "@/components/character-detail";
import { AntagonistDetail } from "@/components/antagonist-detail";
import {
  ANTAGONIST_ACCENT,
  accentForRoster,
  type Antagonist,
  type Character,
} from "@/lib/character-data";
import { db } from "@/lib/db/client";
import { characters, shows } from "@/lib/db/schema";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ showSlug: string; charSlug: string }>;
}) {
  const { showSlug, charSlug } = await params;

  const [show] = await db
    .select()
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);

  if (!show) notFound();

  const [row] = await db
    .select()
    .from(characters)
    .where(
      and(
        eq(characters.showId, show.id),
        eq(characters.slug, charSlug),
      ),
    )
    .limit(1);

  if (!row) notFound();

  const isHero = row.type === "hero";

  return (
    <main>
      <Link href={`/shows/${showSlug}`} className="back-link">
        ← Back to {show.title}
      </Link>

      {isHero ? (
        <CharacterDetail
          character={row.data as unknown as Character}
          accent={accentForRoster(row.rosterNumber ?? 1)}
        />
      ) : (
        <AntagonistDetail
          antagonist={row.data as unknown as Antagonist}
          accent={ANTAGONIST_ACCENT}
        />
      )}
    </main>
  );
}

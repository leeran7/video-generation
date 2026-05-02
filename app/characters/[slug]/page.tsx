import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CharacterDetail } from "@/components/character-detail";
import { AntagonistDetail } from "@/components/antagonist-detail";
import {
  ANTAGONIST_ACCENT,
  accentForRoster,
  type Antagonist,
  type Character,
} from "@/lib/character-data";
import { db } from "@/lib/db/client";
import { characters } from "@/lib/db/schema";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [row] = await db
    .select()
    .from(characters)
    .where(eq(characters.slug, slug))
    .limit(1);

  if (!row) notFound();

  const isHero = row.type === "hero";

  return (
    <main>
      <Link href="/" className="back-link">
        ← Back to roster
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

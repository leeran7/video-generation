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
import { characters } from "@/lib/db/schema";
import { getShowAccess } from "@/lib/auth/show-access";

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ showSlug: string; charSlug: string }>;
}) {
  const { showSlug, charSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access) notFound();
  const show = access.show;

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

  const canEdit = access.canEdit;
  const isHero = row.type === "hero";

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/shows/${showSlug}`}
          className="inline-block text-xs uppercase tracking-[0.2em] text-(--muted) no-underline transition-colors hover:text-(--text)"
        >
          ← Back to {show.title}
        </Link>
        {isHero && canEdit && (
          <Link
            href={`/shows/${showSlug}/characters/${charSlug}/edit`}
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-(--muted) no-underline transition-colors hover:text-(--text)"
          >
            Edit ↗
          </Link>
        )}
      </div>

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

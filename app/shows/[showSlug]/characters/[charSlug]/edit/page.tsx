import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, shows } from "@/lib/db/schema";
import type { Character } from "@/lib/character-data";
import { getShowAccess } from "@/lib/auth/show-access";
import { CharacterEditor } from "./character-editor";

export default async function CharacterEditPage({
  params,
}: {
  params: Promise<{ showSlug: string; charSlug: string }>;
}) {
  const { showSlug, charSlug } = await params;

  const [show] = await db
    .select({ id: shows.id, title: shows.title })
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);
  if (!show) notFound();

  const access = await getShowAccess(showSlug);
  if (!access?.canEdit) notFound();

  const [row] = await db
    .select()
    .from(characters)
    .where(
      and(eq(characters.showId, show.id), eq(characters.slug, charSlug))
    )
    .limit(1);
  if (!row) notFound();

  if (row.type !== "hero") {
    return (
      <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
        <Link
          href={`/shows/${showSlug}/characters/${charSlug}`}
          className="mb-6 inline-block text-xs uppercase tracking-[0.15em] text-(--muted) no-underline transition-colors hover:text-(--text)"
        >
          ← Back to character
        </Link>
        <p className="text-sm text-(--muted)">
          Antagonist editing is not yet supported.
        </p>
      </main>
    );
  }

  const data = row.data as unknown as Character;

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <Link
        href={`/shows/${showSlug}/characters/${charSlug}`}
        className="mb-6 inline-block text-xs uppercase tracking-[0.15em] text-(--muted) no-underline transition-colors hover:text-(--text)"
      >
        ← Back to {data.codename || row.name}
      </Link>
      <h1 className="m-0 mb-1 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-(--text)">
        Edit {data.codename || row.name}
      </h1>
      <p className="mb-5 text-[11px] uppercase tracking-[0.15em] text-(--muted)">
        {row.lockStatus ? `Status: ${row.lockStatus}` : "Status: draft"}
      </p>

      <CharacterEditor
        showSlug={showSlug}
        charSlug={charSlug}
        initial={{
          name: row.name ?? data.codename ?? "",
          realName: row.realName ?? data.realName ?? "",
          lockStatus: row.lockStatus ?? "draft",
          data,
        }}
      />
    </main>
  );
}

import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters } from "@/lib/db/schema";
import type { Character } from "@/lib/character-data";
import { getShowAccess } from "@/lib/auth/show-access";
import { PageContainer, PageHeading, Subtext, BackLink } from "@/components/ui/atoms";
import { CharacterEditor } from "./character-editor";

export default async function CharacterEditPage({
  params,
}: {
  params: Promise<{ showSlug: string; charSlug: string }>;
}) {
  const { showSlug, charSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access?.canEdit) notFound();

  const [row] = await db
    .select()
    .from(characters)
    .where(
      and(eq(characters.showId, access.show.id), eq(characters.slug, charSlug))
    )
    .limit(1);
  if (!row) notFound();

  if (row.type !== "hero") {
    return (
      <PageContainer>
        <BackLink href={`/shows/${showSlug}/characters/${charSlug}`}>
          ← Back to character
        </BackLink>
        <p className="text-sm text-(--muted)">Antagonist editing is not yet supported.</p>
      </PageContainer>
    );
  }

  const data = row.data as unknown as Character;

  return (
    <PageContainer>
      <BackLink href={`/shows/${showSlug}/characters/${charSlug}`}>
        ← Back to {data.codename || row.name}
      </BackLink>
      <PageHeading size="md">Edit {data.codename || row.name}</PageHeading>
      <Subtext className="mb-5">
        {row.lockStatus ? `Status: ${row.lockStatus}` : "Status: draft"}
      </Subtext>

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
    </PageContainer>
  );
}

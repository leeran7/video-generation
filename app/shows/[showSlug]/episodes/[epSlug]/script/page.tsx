import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, episodes } from "@/lib/db/schema";
import { getShowAccess } from "@/lib/auth/show-access";
import { PageContainer, PageHeading, Subtext, BackLink } from "@/components/ui/atoms";
import { ScriptEditor } from "./script-editor";

export default async function ScriptEditorPage({
  params,
}: {
  params: Promise<{ showSlug: string; epSlug: string }>;
}) {
  const { showSlug, epSlug } = await params;

  const access = await getShowAccess(showSlug);
  if (!access?.canEdit) notFound();
  const showId = access.show.id;

  const [epResult, charRows] = await Promise.all([
    db
      .select({
        id: episodes.id,
        title: episodes.title,
        slug: episodes.slug,
        scriptContent: episodes.scriptContent,
        lockStatus: episodes.lockStatus,
      })
      .from(episodes)
      .where(and(eq(episodes.showId, showId), eq(episodes.slug, epSlug)))
      .limit(1),
    db
      .select({ name: characters.name, slug: characters.slug })
      .from(characters)
      .where(eq(characters.showId, showId))
      .orderBy(asc(characters.rosterNumber)),
  ]);
  const ep = epResult[0];
  if (!ep) notFound();

  const characterNames = charRows
    .map((r) => r.name)
    .filter((n): n is string => !!n);

  return (
    <PageContainer>
      <BackLink href={`/shows/${showSlug}/episodes/${epSlug}`}>
        ← Back to episode
      </BackLink>
      <PageHeading size="md">{ep.title}</PageHeading>
      <Subtext className="mb-5">
        Script editor {ep.lockStatus ? `· ${ep.lockStatus}` : ""}
      </Subtext>

      <ScriptEditor
        showSlug={showSlug}
        epSlug={epSlug}
        initialContent={ep.scriptContent ?? ""}
        characterNames={characterNames}
      />
    </PageContainer>
  );
}

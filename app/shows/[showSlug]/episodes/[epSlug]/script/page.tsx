import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { characters, episodes } from "@/lib/db/schema";
import { getShowAccess } from "@/lib/auth/show-access";
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
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <Link
        href={`/shows/${showSlug}/episodes/${epSlug}`}
        className="mb-6 inline-block text-xs uppercase tracking-[0.15em] text-(--muted) no-underline transition-colors hover:text-(--text)"
      >
        ← Back to episode
      </Link>
      <h1 className="m-0 mb-1 text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-0.02em] text-(--text)">
        {ep.title}
      </h1>
      <p className="mb-5 text-[11px] uppercase tracking-[0.15em] text-(--muted)">
        Script editor {ep.lockStatus ? `· ${ep.lockStatus}` : ""}
      </p>

      <ScriptEditor
        showSlug={showSlug}
        epSlug={epSlug}
        initialContent={ep.scriptContent ?? ""}
        characterNames={characterNames}
      />
    </main>
  );
}

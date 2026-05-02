import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { episodes, shows } from "@/lib/db/schema";
import { getJobStatus } from "@/lib/inngest/job-status";
import { RenderConsole } from "./console";

export default async function RenderJobPage({
  params,
}: {
  params: Promise<{ showSlug: string; epSlug: string; jobId: string }>;
}) {
  const { showSlug, epSlug, jobId } = await params;

  const [show] = await db
    .select()
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);
  if (!show) notFound();

  const [ep] = await db
    .select()
    .from(episodes)
    .where(and(eq(episodes.showId, show.id), eq(episodes.slug, epSlug)))
    .limit(1);
  if (!ep) notFound();

  const initialData = await getJobStatus(jobId);
  if (!initialData || initialData.job.episodeId !== ep.id) notFound();

  return (
    <main>
      <Link
        href={`/shows/${showSlug}/episodes/${epSlug}`}
        className="back-link"
      >
        ← {ep.title}
      </Link>

      <div className="detail">
        <div className="detail-bar" />
        <div className="detail-header">
          <div className="detail-eyebrow">
            Render job · {jobId.slice(0, 8)}
          </div>
          <h1 className="detail-name">{ep.title}</h1>
        </div>

        <RenderConsole
          jobId={jobId}
          showSlug={showSlug}
          epSlug={epSlug}
          initialData={initialData}
        />
      </div>
    </main>
  );
}

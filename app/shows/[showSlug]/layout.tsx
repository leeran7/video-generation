import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { ShowAppHeader } from "@/components/show-app-header";
import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";

export default async function ShowLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ showSlug: string }>;
}) {
  const { showSlug } = await params;

  const [show] = await db
    .select({ title: shows.title, slug: shows.slug })
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);

  if (!show) notFound();

  return (
    <>
      <ShowAppHeader showTitle={show.title} showSlug={show.slug} />
      {children}
    </>
  );
}

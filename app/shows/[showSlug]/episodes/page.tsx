export default async function EpisodesPage({
  params,
}: {
  params: Promise<{ showSlug: string }>;
}) {
  await params;
  return (
    <main>
      <h1>Episodes</h1>
      <p className="placeholder-text">Coming soon.</p>
    </main>
  );
}

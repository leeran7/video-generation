export default async function LocationsPage({
  params,
}: {
  params: Promise<{ showSlug: string }>;
}) {
  await params;
  return (
    <main>
      <h1>Locations</h1>
      <p className="placeholder-text">Coming soon.</p>
    </main>
  );
}

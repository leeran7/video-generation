import { readFile } from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { shows } from "@/lib/db/schema";

type LocationRow = {
  slug: string;
  name: string;
  area: string;
  interior: boolean;
  conceptBoard: boolean;
  notes: string;
};

type LocationsFile = {
  locations: LocationRow[];
};

async function loadLocations(): Promise<LocationRow[]> {
  const file = path.join(process.cwd(), "production/locations.json");
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as LocationsFile;
    return parsed.locations ?? [];
  } catch {
    return [];
  }
}

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ showSlug: string }>;
}) {
  const { showSlug } = await params;

  const [showResult, locations] = await Promise.all([
    db.select().from(shows).where(eq(shows.slug, showSlug)).limit(1),
    loadLocations(),
  ]);
  const show = showResult[0];
  if (!show) notFound();

  const byArea = new Map<string, LocationRow[]>();
  for (const loc of locations) {
    const key = loc.area || "Unknown";
    const list = byArea.get(key) ?? [];
    list.push(loc);
    byArea.set(key, list);
  }
  const areas = [...byArea.keys()].sort();
  const withBoard = locations.filter((l) => l.conceptBoard).length;

  return (
    <main className="mx-auto max-w-[1400px] px-6 pb-20 pt-10">
      <h2 className="m-0 mb-1 text-[clamp(32px,5vw,48px)] font-extrabold tracking-[-0.02em] text-(--text)">
        Locations
      </h2>
      <p className="mb-5 text-[11px] uppercase tracking-[0.15em] text-(--muted)">
        {locations.length} location{locations.length === 1 ? "" : "s"} ·{" "}
        {withBoard} with concept board
      </p>

      {locations.length === 0 && (
        <p className="text-[13px] uppercase tracking-[0.1em] text-(--muted)">
          No locations registered.
        </p>
      )}

      {areas.map((area) => {
        const list = byArea.get(area)!;
        return (
          <section key={area} className="mt-9 first-of-type:mt-6">
            <header className="mb-3 flex items-baseline gap-3.5 border-b border-(--border) pb-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-(--muted)">
                {list.length}
              </span>
              <h2 className="m-0 text-lg font-bold tracking-[-0.01em]">{area}</h2>
            </header>
            <ul className="m-0 mb-6 grid list-none gap-4 p-0 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
              {list.map((loc) => (
                <li
                  key={loc.slug}
                  className="flex flex-col overflow-hidden rounded-[2px] border border-(--border) bg-[color-mix(in_srgb,var(--panel)_50%,transparent)]"
                >
                  <div className="flex aspect-video items-center justify-center border-b border-(--border) bg-[color-mix(in_srgb,var(--panel)_80%,black)]">
                    {loc.conceptBoard ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="block h-full w-full object-cover"
                        src={`/api/locations/${loc.slug}/board`}
                        alt={`Concept board for ${loc.name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-[11px] uppercase tracking-[0.18em] text-(--muted)">
                        Concept board pending
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="m-0 text-sm text-(--text)">
                        {loc.name}
                      </h3>
                      <span
                        className={`whitespace-nowrap rounded-[2px] border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                          loc.interior
                            ? "border-[color-mix(in_srgb,var(--text)_30%,var(--border))] text-(--text)"
                            : "border-(--border) text-(--muted)"
                        }`}
                      >
                        {loc.interior ? "Interior" : "Exterior"}
                      </span>
                    </div>
                    <p className="m-0 text-xs leading-[1.5] text-(--muted)">
                      {loc.notes}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}

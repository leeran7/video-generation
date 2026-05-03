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

  const [show] = await db
    .select()
    .from(shows)
    .where(eq(shows.slug, showSlug))
    .limit(1);
  if (!show) notFound();

  const locations = await loadLocations();

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
    <main>
      <h2 className="page-section-heading">Locations</h2>
      <p className="show-meta">
        {locations.length} location{locations.length === 1 ? "" : "s"} ·{" "}
        {withBoard} with concept board
      </p>

      {locations.length === 0 && (
        <p className="placeholder-text">No locations registered.</p>
      )}

      {areas.map((area) => {
        const list = byArea.get(area)!;
        return (
          <section key={area} className="arc-section">
            <header className="arc-section-head">
              <span className="arc-section-num">{list.length}</span>
              <h2 className="arc-section-title">{area}</h2>
            </header>
            <ul className="location-grid">
              {list.map((loc) => (
                <li key={loc.slug} className="location-card">
                  <div className="location-board">
                    {loc.conceptBoard ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/locations/${loc.slug}/board`}
                        alt={`Concept board for ${loc.name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="location-board-empty">
                        Concept board pending
                      </div>
                    )}
                  </div>
                  <div className="location-body">
                    <div className="location-head">
                      <h3 className="location-name">{loc.name}</h3>
                      <span
                        className={`location-chip${
                          loc.interior ? " location-chip-int" : ""
                        }`}
                      >
                        {loc.interior ? "Interior" : "Exterior"}
                      </span>
                    </div>
                    <p className="location-notes">{loc.notes}</p>
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

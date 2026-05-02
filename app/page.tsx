import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { CharacterCard } from "@/components/character-card";
import { AntagonistCard } from "@/components/antagonist-card";
import {
  ANTAGONIST_ACCENT,
  accentForRoster,
  type Antagonist,
  type Character,
} from "@/lib/character-data";
import { db } from "@/lib/db/client";
import { characters, shows } from "@/lib/db/schema";

type CharacterRow = typeof characters.$inferSelect;

export default async function Home() {
  const [showRows, characterRows] = await Promise.all([
    db.select().from(shows).orderBy(asc(shows.title)),
    db
      .select()
      .from(characters)
      .orderBy(
        sql`${characters.rosterNumber} nulls last`,
        asc(characters.name),
      ),
  ]);

  const heroesByShow = new Map<string, CharacterRow[]>();
  const antagonistsByShow = new Map<string, CharacterRow[]>();
  for (const row of characterRows) {
    if (!row.showId) continue;
    const target = row.rosterNumber != null ? heroesByShow : antagonistsByShow;
    const list = target.get(row.showId) ?? [];
    list.push(row);
    target.set(row.showId, list);
  }

  return (
    <main>
      <h1>Studio</h1>
      <p>{showRows.length} shows</p>

      {showRows.map((show) => {
        const heroes = heroesByShow.get(show.id) ?? [];
        const antagonists = antagonistsByShow.get(show.id) ?? [];
        return (
          <section key={show.id} className="show-section">
            <h2 className="show-title">{show.title}</h2>
            <p className="show-meta">
              {heroes.length} heroes · {antagonists.length} antagonists
            </p>

            {heroes.length > 0 && (
              <>
                <h3 className="roster-heading">Heroes</h3>
                <div className="cards-container">
                  {heroes.map((row) => (
                    <Link
                      key={row.slug}
                      href={`/characters/${row.slug}`}
                      className="card-link"
                    >
                      <CharacterCard
                        character={row.data as unknown as Character}
                        accent={accentForRoster(row.rosterNumber!)}
                      />
                    </Link>
                  ))}
                </div>
              </>
            )}

            {antagonists.length > 0 && (
              <>
                <h3 className="roster-heading">Antagonists</h3>
                <div className="cards-container">
                  {antagonists.map((row) => {
                    const antagonist = row.data as unknown as Antagonist;
                    return (
                      <Link
                        key={row.slug}
                        href={`/characters/${row.slug}`}
                        className="card-link"
                      >
                        <AntagonistCard
                          antagonist={antagonist}
                          accent={ANTAGONIST_ACCENT}
                        />
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        );
      })}
    </main>
  );
}

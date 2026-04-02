import { CharacterCard } from './CharacterCard'
import { accentForRoster, CHARACTERS } from './characterData'
import './App.css'

export default function App() {
  return (
    <div className="nova-force">
      <header>
        <div className="show-title">NOVA FORCE</div>
        <div className="show-tagline">Five Heroes. One City. Infinite Stakes.</div>
        <div className="divider" />
        <div className="roster-label">⬡ Team Roster — Season 01 ⬡</div>
      </header>

      <div className="cards-container">
        {CHARACTERS.map((character, index) => (
          <CharacterCard
            key={character.codename}
            character={character}
            accent={accentForRoster(character.rosterNumber)}
            index={index}
          />
        ))}
      </div>

      <footer>
        NOVA FORCE — ORIGINAL CHARACTER CONCEPTS — SEASON 01
      </footer>
    </div>
  )
}

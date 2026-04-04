import type { CSSProperties } from 'react'
import type { Character } from './characterData'

export function CharacterCard({ character, accent, index }: CharacterCardProps) {
  const padded = String(character.rosterNumber).padStart(2, '0')
  const cardDelay = `${0.1 * (index + 1)}s`
  const floatDelay = `${0.4 * index}s`

  return (
    <div
      className="card"
      style={
        {
          '--accent': accent,
          animationDelay: cardDelay,
        } as CSSProperties
      }
    >
      <div className="card-bar" />
      <div className="card-visual">
        <div className="hero-number">{padded}</div>
        <div
          className="hero-icon"
          style={{ animationDelay: floatDelay }}
          aria-hidden
        >
          {character.icon}
        </div>
      </div>
      <div className="card-body">
        <div className="hero-name">{character.codename}</div>
        <div className="hero-alias">
          Real Name: {character.realName} · Age {character.age}
        </div>

        <div className="section-label">Personality</div>
        <div className="section-content">{character.personality}</div>

        <div className="section-label">Traits</div>
        <div className="traits-list">
          {character.traits.map((trait) => (
            <span key={trait} className="trait-tag">
              {trait}
            </span>
          ))}
        </div>

        <div className="section-label">Mindset</div>
        <div className="section-content">{character.mindset}</div>

        <div className="section-label">Visual Distinctions</div>
        <div className="visual-distinction">{character.visualDistinctions}</div>

        <div className="section-label">Powers</div>
        <div className="section-content">{character.powers}</div>

        <div className="section-label">Power spec</div>
        <div className="section-content">{character.powersSpec}</div>

        <div className="section-label">Role</div>
        <div className="section-content">{character.role}</div>

        <div className="section-label">Signature Color</div>
        <div className="section-content">{character.signatureColor}</div>

        <div className="section-label">Season 1 arc</div>
        <div className="section-content">
          {character.seasonOneArc.map((arc) => (
            <div key={arc.act}>
              <strong>Act {arc.act}</strong> (Ep {arc.episodes.join(', ')}): {arc.description}
            </div>
          ))}
        </div>

        <div className="section-label">Voice &amp; cadence</div>
        <div className="section-content">{character.voiceCadence}</div>

        <div className="section-label">Humanizing details</div>
        <div className="section-content">{character.humanizingDetails}</div>

        <div className="section-label">Influences &amp; twist</div>
        <div className="section-content">{character.influencesAndTwist}</div>

        <div className="section-label">Animation notes</div>
        <div className="section-content">{character.animationCraftNotes}</div>
      </div>
    </div>
  )
}

type CharacterCardProps = {
  character: Character
  accent: string
  index: number
}

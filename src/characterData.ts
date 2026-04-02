import glitch from '../characters/glitch.json'
import solace from '../characters/solace.json'
import surge from '../characters/surge.json'
import titan from '../characters/titan.json'
import wraith from '../characters/wraith.json'

export const CHARACTERS = [surge, wraith, titan, glitch, solace].sort(
  (a, b) => a.rosterNumber - b.rosterNumber,
) as Character[]

const ACCENT_COLORS = [
  '#00f0ff',
  '#ff4060',
  '#a855f7',
  '#22c55e',
  '#f59e0b',
] as const

export function accentForRoster(rosterNumber: number): string {
  return ACCENT_COLORS[rosterNumber - 1] ?? ACCENT_COLORS[0]
}

/** Matches `characters/*.json` field order and shape. */
export interface Character {
  show: string
  season: number
  rosterNumber: number
  codename: string
  icon: string
  realName: string
  age: number
  personality: string
  traits: string[]
  mindset: string
  visualDistinctions: string
  powers: string
  powersSpec: string
  role: string
  signatureColor: string
  seasonOneArc: string
  voiceCadence: string
  humanizingDetails: string
  influencesAndTwist: string
  animationCraftNotes: string
}

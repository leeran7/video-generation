export type DesignStyle = {
  id: string;
  label: string;
  image: string;
  promptSuffix: string;
};

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: "animated-series",
    label: "Animated Series",
    image: "/design-styles/animated-series.png",
    promptSuffix:
      "Character design sheet in a modern animated series style. Clean linework, expressive proportions, bold flat colors with simple cel shading. Full-body front/back/side turnaround on white background.",
  },
  {
    id: "anime",
    label: "Anime",
    image: "/design-styles/anime.png",
    promptSuffix:
      "Character design sheet in a Japanese anime style. Sharp linework, large expressive eyes, dynamic proportions. Full-body turnaround views on white background with color palette swatches.",
  },
  {
    id: "comic-book",
    label: "Comic Book",
    image: "/design-styles/comic-book.png",
    promptSuffix:
      "Character design sheet in a Western comic book style. Bold ink outlines, dynamic musculature, high-contrast colors. Full-body front and action pose on white background.",
  },
  {
    id: "concept-art",
    label: "Concept Art",
    image: "/design-styles/concept-art.png",
    promptSuffix:
      "Character concept art sheet. Painterly rendering, detailed costume/material callouts, soft lighting. Multiple angle sketches with notes on white background.",
  },
  {
    id: "flat-vector",
    label: "Flat Vector",
    image: "/design-styles/flat-vector.png",
    promptSuffix:
      "Character design in a clean flat vector illustration style. Minimal shading, geometric shapes, limited color palette. Full-body silhouette and color variants on white background.",
  },
  {
    id: "pixel-art",
    label: "Pixel Art",
    image: "/design-styles/pixel-art.png",
    promptSuffix:
      "Character sprite sheet in a retro pixel art style. 16-bit or 32-bit aesthetic, limited color palette, clear animation frames. Multiple poses on transparent/white background.",
  },
  {
    id: "3d-cgi",
    label: "3D CGI",
    image: "/design-styles/3d-cgi.png",
    promptSuffix:
      "Character design in a 3D CGI animation style. Smooth subsurface scattering skin, volumetric hair, physically-based material shading. Turntable render views on neutral background with texture/material callouts.",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    image: "/design-styles/watercolor.png",
    promptSuffix:
      "Character illustration in a loose watercolor painting style. Wet-on-wet color bleeds, visible paper texture, soft ink linework. Full-body painting with visible brushwork and color palette on white paper background.",
  },
  {
    id: "noir",
    label: "Noir",
    image: "/design-styles/noir.png",
    promptSuffix:
      "Character design in a film noir style. High-contrast black and white with dramatic chiaroscuro lighting. Heavy shadows, stark highlights, minimal mid-tones. Strong silhouette on dark background.",
  },
  {
    id: "chibi",
    label: "Chibi",
    image: "/design-styles/chibi.png",
    promptSuffix:
      "Character in chibi/super-deformed style. Oversized round head (50–60% of total height), tiny simplified body, huge sparkly eyes, exaggerated expressions. Cute pastel color palette on white background.",
  },
  {
    id: "retro-cartoon",
    label: "Retro Cartoon",
    image: "/design-styles/retro-cartoon.png",
    promptSuffix:
      "Character design in a classic 1930s–1960s rubber hose cartoon style. Bendy limbs, white gloves, exaggerated round forms, muted vintage color palette. Bold black outlines on aged cream background.",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    image: "/design-styles/cyberpunk.png",
    promptSuffix:
      "Character design in a cyberpunk aesthetic. Dark base palette with neon accent lighting (magenta, cyan, electric blue). Cybernetic implants, tech-wear, holographic UI elements. High-contrast on near-black background.",
  },
  {
    id: "ghibli",
    label: "Studio Ghibli",
    image: "/design-styles/ghibli.png",
    promptSuffix:
      "Character design in the Studio Ghibli aesthetic. Soft naturalistic anime — expressive round faces, hand-painted color warmth, flowing hair and fabric, subtle shading. No heavy outlines. Clean white background with soft atmospheric lighting.",
  },
  {
    id: "manga",
    label: "Manga",
    image: "/design-styles/manga.png",
    promptSuffix:
      "Character design in a black and white manga style. Crisp ink linework, screen-tone shading patterns, speed lines, dramatic hatching for shadows. Multiple expression insets in the corners. White background. Publication-ready manga art.",
  },
  {
    id: "dark-fantasy",
    label: "Dark Fantasy",
    image: "/design-styles/dark-fantasy.png",
    promptSuffix:
      "Character design in a detailed dark fantasy illustration style. Ornate armor or robe with intricate patterns, battle-worn details, dramatic atmospheric lighting. Rich jewel-toned color palette. Painterly rendering, dark moody background. High-detail fantasy RPG concept art quality.",
  },
  {
    id: "art-nouveau",
    label: "Art Nouveau",
    image: "/design-styles/art-nouveau.png",
    promptSuffix:
      "Character design in an Art Nouveau poster style. Alphonse Mucha-inspired ornamental border of flowing vines and geometric patterns framing the figure. Sinuous lines, muted gold and sage palette, flat areas of decorative pattern. Elegant full-body illustration on cream background.",
  },
  {
    id: "claymation",
    label: "Claymation",
    image: "/design-styles/claymation.png",
    promptSuffix:
      "Character design rendered to look like a stop-motion clay puppet. Visible clay texture, fingerprint marks, slightly imperfect smooth surfaces, bold saturated colors. Aardman/Laika aesthetic — expressive face with clay-built features. Neutral studio backdrop with soft diffuse lighting.",
  },
  {
    id: "pop-art",
    label: "Pop Art",
    image: "/design-styles/pop-art.png",
    promptSuffix:
      "Character design in a bold Pop Art graphic style. Roy Lichtenstein-inspired Ben-Day dots, thick black outlines, flat primary colors (red, yellow, blue, black), bold speech bubble graphic element. Graphic and flat, high visual impact. White background.",
  },
  {
    id: "ink-wash",
    label: "Ink Wash",
    image: "/design-styles/ink-wash.png",
    promptSuffix:
      "Character design in a traditional East Asian ink wash painting style (sumi-e). Minimal brushstrokes, wet ink gradients from deep black to pale grey, deliberate negative space. Simple but expressive. Off-white rice paper texture background. Calligraphic elegance.",
  },
  {
    id: "pastel-sketch",
    label: "Pastel Sketch",
    image: "/design-styles/pastel-sketch.png",
    promptSuffix:
      "Character design in a soft pastel sketch style. Loose confident pencil lines, layered pastel color blocking, visible paper grain. Warm and approachable — like a professional character study sketchbook page. Light cream background with subtle texture.",
  },
  {
    id: "gothic-lolita",
    label: "Gothic Lolita",
    image: "/design-styles/gothic-lolita.png",
    promptSuffix:
      "Character design in a Gothic Lolita fashion illustration style. Elaborate layered dress with lace, ribbons, petticoats and Victorian-inspired details. Dark color palette with white lace accents, roses, coffin motifs. Elegant elongated proportions. Flat fashion illustration style on white background.",
  },
  {
    id: "storybook",
    label: "Storybook",
    image: "/design-styles/storybook.png",
    promptSuffix:
      "Character design in a classic children's storybook illustration style. Warm gouache or tempera paint quality, rounded friendly proportions, expressive face, rich earthy color palette. Hand-crafted texture. Similar to Beatrix Potter or Jon Klassen quality. Soft natural background.",
  },
];

export const DEFAULT_STYLE_ID = "animated-series";

export function getStyle(id: string): DesignStyle {
  return DESIGN_STYLES.find((s) => s.id === id) ?? DESIGN_STYLES[0];
}

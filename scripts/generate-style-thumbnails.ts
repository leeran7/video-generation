/**
 * Generate real character design thumbnails for each art style using gpt-image-1.
 * Saves PNGs to public/design-styles/{id}.png
 *
 * Usage: pnpm tsx scripts/generate-style-thumbnails.ts [styleId]
 *   styleId — optional, regenerate only that one style
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { config } from "dotenv";
config();

const OpenAI = (await import("openai")).default;
const { DESIGN_STYLES } = await import("../lib/design-styles");

const targetId = process.argv[2] ?? null;
const styles = targetId
  ? DESIGN_STYLES.filter((s) => s.id === targetId)
  : DESIGN_STYLES;

if (styles.length === 0) {
  console.error(`No style found for id "${targetId}"`);
  process.exit(1);
}

const PROMPTS: Record<string, string> = {
  "animated-series":
    "Full-body character design sheet of a young adult superhero in a sleek costume with cape and chest emblem. Modern animated series style (similar to Invincible or The Owl House). Bold flat colors with clean black cel-shading outlines. Front-facing pose, arms slightly out. Clean white background. Professional animation studio quality.",

  "anime":
    "Full-body character design sheet of a teenage anime hero in dynamic battle stance. Spiky hair, large expressive eyes, detailed costume with armor pieces and glowing accents. Japanese anime style similar to My Hero Academia or Demon Slayer. Sharp linework, vibrant colors, speed lines behind figure. White background. Studio-quality anime art.",

  "comic-book":
    "Full-body character design sheet of a muscular superhero in a classic Western comic book style. Bold ink outlines, dynamic pose, halftone shading, primary color scheme. Art style similar to classic Marvel or DC comics. Dramatic upward angle. Solid white background with subtle halftone dot pattern. Professional comic illustration.",

  "concept-art":
    "Detailed character concept art of an original superhero. Painterly rendering with dramatic rim lighting, atmospheric shading. Multiple notes and callouts pointing to costume details and material textures. Three-quarter view pose. Dark atmospheric background with soft gradient. Professional concept art quality similar to Arcane or Spider-Verse.",

  "flat-vector":
    "Full-body character design of a sleek superhero in clean modern flat vector illustration style. Bold geometric shapes, minimal shading, limited but vibrant color palette. No outlines between same-colored areas, crisp silhouette. Similar to Steven Universe or Gravity Falls aesthetic. Pure white background. Professionally designed vector art.",

  "pixel-art":
    "Detailed pixel art character sprite sheet of a superhero. 32-bit retro game aesthetic. Character shown in multiple poses: idle, running, and action attack pose. Clean pixel grid, carefully anti-aliased edges, limited but expressive color palette. Black background. High-quality game sprite art similar to Octopath Traveler or Shovel Knight.",

  "3d-cgi":
    "Full-body 3D CGI rendered character design of a superhero. Smooth Pixar/DreamWorks quality render with subsurface scattering skin, volumetric hair, physically-based materials. Soft studio three-point lighting, slight ambient occlusion. Neutral gradient background. Turntable-style render showing front view. High-quality CGI character concept.",

  "watercolor":
    "Full-body watercolor illustration of a superhero character. Loose expressive brushwork, visible paper texture, wet-on-wet color bleeding, warm-cool color interplay. Detailed but painterly — clear character silhouette with loose ink lines over watercolor washes. Cream paper background. Gallery-quality illustration art.",

  "noir":
    "Full-body character design of a noir detective/hero. Extreme chiaroscuro black and white with harsh single-source lighting from below. Long shadows, heavy ink blacks, minimal midtones. Trench coat, fedora, dramatic silhouette. Rain-streaked city alley background in deep shadow. 1940s detective comic illustration quality.",

  "chibi":
    "Full-body chibi character design of a superhero with oversized round head that makes up 60% of their height, tiny simplified body, huge sparkling eyes with multiple catchlights, exaggerated cute expressions. Pastel color scheme with soft gradients. Super detailed face, simplified body. White background with small decorative stars and hearts. High-quality chibi illustration art.",

  "retro-cartoon":
    "Full-body character design of a 1940s rubber hose cartoon superhero. Round fluid forms, white gloves, bendy limbs, exaggerated round eyes with pie-cut pupils, wide toothy grin. Muted vintage color palette with aged look. Black bold outlines. Classic Fleischer Studios / early Disney aesthetic. Cream background with film grain texture.",

  "cyberpunk":
    "Full-body cyberpunk character design of a street mercenary with cybernetic augmentations — glowing neon implants, tech-wear jacket, holographic visor. Neon magenta and cyan accent lighting against near-black base colors. Detailed mechanical arm, data ports, neon-lit city background at night. Blade Runner / Ghost in the Shell visual quality.",

  "ghibli":
    "Full-body character design in the Studio Ghibli aesthetic. A young adventurer in practical travel clothes — soft naturalistic anime style, expressive round face, flowing hair, hand-painted warmth in the colors. No heavy outlines. Subtle shading, gentle highlights. Clean white background with soft warm atmospheric glow. Quality matching Spirited Away or Princess Mononoke.",

  "manga":
    "Full-body character design in a black and white manga style. Crisp ink linework, screen-tone dot shading patterns on clothing and shadows, dramatic hatching for deep shadows, speed lines radiating behind the figure. Small expression inset panels in the corners. Clean white background. Publication-quality manga art similar to One Piece or Berserk.",

  "dark-fantasy":
    "Full-body character concept art in a detailed dark fantasy illustration style. A warrior or mage in ornate battle-worn armor or layered robes with intricate patterns and runes. Dramatic rim lighting from below, atmospheric particle effects, rich jewel-toned color palette — deep crimson, midnight blue, tarnished gold. Painterly rendering. Dark moody background. High-detail fantasy RPG concept art quality similar to Dark Souls or Dragon Age.",

  "art-nouveau":
    "Full-body character design in an Art Nouveau poster illustration style inspired by Alphonse Mucha. An elegant figure in flowing robes surrounded by an ornamental border of sinuous vines, flowers, and geometric patterns. Flat areas of muted gold, sage green, dusty rose. Elongated graceful proportions. Decorative background with subtle floral motifs. Cream parchment background.",

  "claymation":
    "Full-body character design rendered to look like a handmade stop-motion clay puppet. Visible clay texture with subtle fingerprint marks and tool marks, slightly imperfect smooth surfaces, bold saturated colors with matte finish. Aardman / Laika aesthetic — Wallace and Gromit or Coraline quality. Expressive round face built from clay. Neutral warm studio backdrop with diffuse soft-box lighting.",

  "pop-art":
    "Full-body character design in a bold Pop Art graphic style. Roy Lichtenstein-inspired Ben-Day halftone dots on shadows, thick black outlines, flat primary colors — red, yellow, blue, black and white only. Dynamic action pose. A speech bubble graphic element with bold text. Graphic and flat, extremely high visual impact. Pure white background.",

  "ink-wash":
    "Full-body character design in a traditional East Asian ink wash painting style (sumi-e). A warrior or monk in minimal flowing robes. Sparse confident brushstrokes — wet ink gradients ranging from deep black to near-invisible pale grey. Deliberate use of negative white space. Simple but deeply expressive. Off-white rice paper texture background. Calligraphic elegance and restraint.",

  "pastel-sketch":
    "Full-body character design in a soft pastel sketch style. Loose confident pencil construction lines still visible, layered soft pastel color blocking for costume and skin. Visible paper grain texture. Warm approachable illustration feel — like a professional character sketchbook study page. Handwritten-style notes pointing to design details. Light cream textured paper background.",

  "gothic-lolita":
    "Full-body character design in a Gothic Lolita fashion illustration style. Elaborate layered dress with black and white lace, ribbon bows, petticoats, Victorian corset, coffin purse, and rose accessories. Pale skin, dramatic eye makeup, elegant elongated fashion-illustration proportions. Flat clean fashion illustration rendering. White background with subtle decorative frame.",

  "storybook":
    "Full-body character design in a classic children's storybook illustration style. A young adventurer in practical cozy clothing. Warm gouache or tempera paint quality — thick opaque color, rounded friendly proportions, wide expressive eyes, rich earthy color palette. Hand-crafted textured paint surface. Similar to Beatrix Potter, Jon Klassen, or Chris Van Allsburg in quality. Soft warm natural outdoor background.",
};

const openai = new OpenAI();
const outDir = path.join(process.cwd(), "public/design-styles");
await mkdir(outDir, { recursive: true });

for (const style of styles) {
  const prompt = PROMPTS[style.id];
  if (!prompt) {
    console.warn(`No prompt defined for style "${style.id}", skipping`);
    continue;
  }

  process.stdout.write(`Generating ${style.label}...`);
  try {
    type ImgResponse = { data?: { b64_json?: string }[] };
    const result = (await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    } as Parameters<typeof openai.images.generate>[0])) as ImgResponse;

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned");

    const buf = Buffer.from(b64, "base64");
    const outPath = path.join(outDir, `${style.id}.png`);
    await writeFile(outPath, buf);
    console.log(` ✓ saved ${style.id}.png`);
  } catch (err) {
    console.error(` ✗ failed: ${(err as Error).message}`);
  }
}

console.log("Done.");
process.exit(0);

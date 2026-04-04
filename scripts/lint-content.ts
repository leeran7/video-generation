#!/usr/bin/env node
/**
 * Content lint: enforce single source of truth across production JSON files.
 *
 * Fields that reference data owned by another file must use pointer syntax:
 *   "See <path> → <field>"
 *
 * Usage: pnpm content:lint
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const POINTER_RE = /^See .+ → .+/;

type Check =
  | { file: string; jsonPath: string[]; rule: "pointer" }
  | { file: string; jsonPath: string[]; rule: "pointer-in-array"; field: string };

const CHECKS: Check[] = [
  // series-bible.json cross-references
  {
    file: "production/series-bible.json",
    jsonPath: ["shadowOrganization", "details"],
    rule: "pointer",
  },
  {
    file: "production/series-bible.json",
    jsonPath: ["seasonOneArcSummary", "structure"],
    rule: "pointer",
  },
  {
    file: "production/series-bible.json",
    jsonPath: ["seasonOneArcSummary", "antagonist"],
    rule: "pointer",
  },
  {
    file: "production/series-bible.json",
    jsonPath: ["seasonOneArcSummary", "beats"],
    rule: "pointer",
  },
  // heroColorKeys — each entry's signatureColor must point to characters/*.json
  {
    file: "production/series-bible.json",
    jsonPath: ["visualLanguage", "heroColorKeys"],
    rule: "pointer-in-array",
    field: "signatureColor",
  },
  // season.json villain block
  {
    file: "Season 1/season.json",
    jsonPath: ["villain", "details"],
    rule: "pointer",
  },
];

function dig(obj: unknown, keys: string[]): unknown {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

function main(): void {
  const violations: string[] = [];

  for (const check of CHECKS) {
    const abs = path.resolve(ROOT, check.file);
    let data: unknown;
    try {
      data = JSON.parse(readFileSync(abs, "utf8")) as unknown;
    } catch {
      violations.push(`Cannot read ${check.file}`);
      continue;
    }

    const value = dig(data, check.jsonPath);
    const loc = `${check.file} → ${check.jsonPath.join(".")}`;

    if (check.rule === "pointer") {
      if (typeof value !== "string" || !POINTER_RE.test(value)) {
        violations.push(`${loc}: must be a pointer ("See X → Y"), got: ${JSON.stringify(value)}`);
      }
    } else {
      // pointer-in-array
      if (!Array.isArray(value)) {
        violations.push(`${loc}: expected array`);
      } else {
        for (let i = 0; i < value.length; i++) {
          const item = value[i] as Record<string, unknown>;
          const fieldVal = item[check.field];
          if (typeof fieldVal !== "string" || !POINTER_RE.test(fieldVal)) {
            violations.push(
              `${loc}[${i}].${check.field}: must be a pointer, got: ${JSON.stringify(fieldVal)}`,
            );
          }
        }
      }
    }
  }

  if (violations.length === 0) {
    process.exit(0);
  }

  const msg = `Content lint — single source of truth violations:\n${violations.map((v) => `  • ${v}`).join("\n")}`;

  // Output as hook-compatible JSON so Claude sees it as injected context.
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: msg,
      },
    }),
  );

  process.exit(1);
}

main();

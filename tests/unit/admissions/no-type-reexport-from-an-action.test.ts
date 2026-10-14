import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A "use server" FILE MUST NOT RE-EXPORT ANYTHING. NOT EVEN A TYPE.
 *
 * ── WHAT THIS COST, 14 OCTOBER 2026 ─────────────────────────────────────────
 *
 * The shadow day step shipped with one line in src/lib/admissions/decisions.ts:
 *
 *     export type { DecisionType };
 *
 * It was there for a kind reason - the decision's body had moved to
 * decisions-core.ts, and re-exporting the type meant every existing importer of
 * "@/lib/admissions/decisions" kept working. The comment beside it even said
 * "It is a type, so it erases and does not become a server action."
 *
 * That sentence is false, and the deploy died on it: 252 errors, one for every
 * route in the JAG.
 *
 *     Export DecisionType doesn't exist in target module
 *     The export DecisionType was not found in module
 *       [project]/src/lib/admissions/decisions.ts [app-rsc] (ecmascript)
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * Next's server-actions transform reads the EXPORT NAMES of a "use server"
 * module and writes one action binding per name into every route's generated
 * actions.js - BEFORE TypeScript erases the types:
 *
 *     export {DecisionType as '7fc922871dc64090...'} from 'ACTIONS_MODULE2'
 *
 * The type then vanished, as types do, and 252 routes held a reference to an
 * export that was not there.
 *
 * ── WHY NOTHING ELSE CAUGHT IT ──────────────────────────────────────────────
 *
 * tsc erases the type and is satisfied. The scoped typecheck was green, the
 * ship script's own typecheck was green, 200 tests passed, and the push went
 * through. A GREEN TYPECHECK IS NOT EVIDENCE OF A BUILD - the same lesson as
 * 3 October, learned again at a cost of one failed deploy and an hour.
 *
 * ── AND THEN THIS FILE FAILED THE SHIP, WHICH WAS ALSO MINE ─────────────────
 *
 * Its first version read all 7,239 files under src/ TWICE - once in each `it` -
 * and threw on Windows during the full suite. The repository was clean the
 * whole time: 109 "use server" files, zero offenders, checked three separate
 * ways. The guard was the thing that was broken.
 *
 * So it now reads each file ONCE, into one list shared by every assertion;
 * skips any file whose text does not contain "use server" before doing any
 * other work; survives a file it cannot read, which on Windows can simply mean
 * an editor has it open; and says how long the walk took, so the next person
 * to see it go slow knows where to look.
 *
 * A guard that fails a ship on its own weight teaches people to delete guards.
 *
 * ── WHAT IS AND IS NOT BANNED ───────────────────────────────────────────────
 *
 * BANNED  export { X }            - a re-export specifier list
 *         export type { X }         with or without `from`, with or without
 *         export { X } from "y"     the type keyword. The transform sees a
 *         export type { X } from "y"  NAME either way.
 *
 * FINE    export type Foo = ...   - a type DECLARATION. Many "use server"
 *         export interface Foo {}   files in the JAG use these today and have
 *                                   built for weeks. SWC strips the whole
 *                                   declaration before the transform runs.
 *
 * FINE    export async function   - what a "use server" file is for.
 *
 * If you need to share a type out of an action file, put the type where the
 * work lives and import it from there, which is what decisions-core.ts does.
 */

const root = join(__dirname, "..", "..", "..");

interface SourceFile {
  readonly path: string;
  readonly source: string;
}

/**
 * ONE WALK, ONE READ PER FILE, AND IT NEVER THROWS.
 *
 * A directory or file that cannot be read is skipped rather than fatal. On
 * Windows that is routine - an open editor, an indexer, a lock - and a guard
 * that dies on it is worse than no guard, because it fails the ship for a
 * reason that has nothing to do with the code.
 */
function readServerActionFiles(dir: string, found: SourceFile[] = []): SourceFile[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);

    let isDirectory = false;
    try {
      isDirectory = statSync(full).isDirectory();
    } catch {
      continue;
    }

    if (isDirectory) {
      readServerActionFiles(full, found);
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;

    let source: string;
    try {
      source = readFileSync(full, "utf8");
    } catch {
      continue;
    }

    /* The cheap test first. Almost every file in src/ fails it, and the
       comment-stripping below is the expensive part. */
    if (!source.includes("use server")) continue;
    if (!isServerActionFile(source)) continue;

    found.push({ path: full, source });
  }
  return found;
}

/** The first non-empty, non-comment line being "use server" is the marker. */
function isServerActionFile(source: string): boolean {
  const firstCode = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("//"));
  return firstCode === '"use server";' || firstCode === "'use server';";
}

/**
 * A re-export specifier list, which is what the transform picks up.
 *
 * Deliberately NOT matching `export type Foo =` or `export interface Foo` -
 * the brace has to come before anything that could be a declaration name.
 */
const REEXPORT_LIST = /^\s*export\s+(?:type\s+)?\{/m;

/* Walked ONCE for the whole file. Every assertion below reads this list. */
const walkStartedAt = Date.now();
const ACTION_FILES = readServerActionFiles(join(root, "src"));
const WALK_MS = Date.now() - walkStartedAt;

describe("no 'use server' file re-exports a name", () => {
  it("finds the action files at all, so a passing run means something", () => {
    /* THE TEST THAT PROTECTS THE TEST. A walker that silently finds nothing
       passes every assertion below and guards nothing - which is how a guard
       quietly stops being one, and this walker now swallows read errors on
       purpose, so it needs this more than it did before.

       The JAG had 109 "use server" files on 14 October 2026. */
    expect(ACTION_FILES.length).toBeGreaterThan(50);
  });

  it("has no export specifier list in any of them", () => {
    const offenders: string[] = [];
    for (const file of ACTION_FILES) {
      const match = REEXPORT_LIST.exec(file.source);
      if (match) {
        const line = file.source.slice(0, match.index).split("\n").length + 1;
        offenders.push(
          `${file.path.slice(root.length + 1)}:${line} — ${match[0].trim()}`
        );
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("still allows a type declaration, which is how most of them do it", () => {
    /* Proving the rule is narrow. If this assertion ever fails it means the
       pattern above got greedy and is now banning something that builds
       perfectly well - which would send the next person on a hunt for a
       problem that is not there. */
    const declaring = ACTION_FILES.filter((f) =>
      /^\s*export\s+(type\s+\w+\s*=|interface\s+\w+)/m.test(f.source)
    );
    expect(declaring.length).toBeGreaterThan(5);
  });

  it("walks fast enough that it will not fail a ship on its own weight", () => {
    /*
     * THE ASSERTION THIS FILE EARNED THE HARD WAY.
     *
     * Its first version read all 7,239 files under src/ twice and threw during
     * the full suite on Windows - a guard failing a ship for its own reasons,
     * which is exactly how guards get deleted. One walk, one read, and the
     * cheap string test before any regex work.
     *
     * Generous on purpose: this is a tripwire for something going badly wrong,
     * not a benchmark. Linux does it in well under a second; Windows with a
     * live virus scanner is slower and that is fine.
     */
    expect(WALK_MS).toBeLessThan(20000);
  });
});

describe("the file that taught us this", () => {
  const decisions = readFileSync(
    join(root, "src/lib/admissions/decisions.ts"),
    "utf8"
  );

  it("exports exactly one thing, and it is the action", () => {
    const exports = decisions.match(/^export .*/gm) ?? [];
    expect(exports).toEqual([
      "export async function submitAdmissionsDecision(formData: FormData) {",
    ]);
  });

  it("keeps the reason written down where the next person will read it", () => {
    /* The comment is the deliverable here as much as the deletion is. Someone
       will have the same good reason to re-export a type from this exact file,
       and the error they would get names a route they never touched. */
    expect(decisions).toContain("DO NOT RE-EXPORT ANYTHING FROM THIS FILE");
    expect(decisions).toContain("Export DecisionType doesn't exist in target module");
  });
});

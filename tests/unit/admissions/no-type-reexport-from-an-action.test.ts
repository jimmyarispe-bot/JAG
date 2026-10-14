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
 * This test is the thing that sees it, because it reads what the transform
 * reads: the export names.
 *
 * ── WHAT IS AND IS NOT BANNED ───────────────────────────────────────────────
 *
 * BANNED  export { X }            - a re-export specifier list
 *         export type { X }         with or without `from`, with or without
 *         export { X } from "y"     the type keyword. The transform sees a
 *         export type { X } from "y"  NAME either way.
 *
 * FINE    export type Foo = ...   - a type DECLARATION. Twelve "use server"
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

function tsFilesUnder(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === ".git") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsFilesUnder(full, found);
    else if (/\.tsx?$/.test(entry)) found.push(full);
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

describe("no 'use server' file re-exports a name", () => {
  const sourceFiles = tsFilesUnder(join(root, "src"));

  it("finds the action files at all, so a passing run means something", () => {
    /* THE TEST THAT PROTECTS THE TEST. A walker that silently finds nothing
       passes every assertion below and guards nothing - which is how a guard
       quietly stops being one. The JAG had 13 "use server" files on
       14 October 2026. */
    const actionFiles = sourceFiles.filter((f) =>
      isServerActionFile(readFileSync(f, "utf8"))
    );
    expect(actionFiles.length).toBeGreaterThan(5);
  });

  it("has no export specifier list in any of them", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      if (!isServerActionFile(source)) continue;
      const match = REEXPORT_LIST.exec(source);
      if (match) {
        const line = source.slice(0, match.index).split("\n").length + 1;
        offenders.push(
          `${file.slice(root.length + 1)}:${line} — ${match[0].trim()}`
        );
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("still allows a type declaration, which is how the other twelve do it", () => {
    /* Proving the rule is narrow. If this assertion ever fails it means the
       pattern above got greedy and is now banning something that builds
       perfectly well - which would send the next person on a hunt for a
       problem that is not there. */
    const declaring = sourceFiles.filter((f) => {
      const source = readFileSync(f, "utf8");
      return (
        isServerActionFile(source) &&
        /^\s*export\s+(type\s+\w+\s*=|interface\s+\w+)/m.test(source)
      );
    });
    expect(declaring.length).toBeGreaterThan(5);
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

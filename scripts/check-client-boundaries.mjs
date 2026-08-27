#!/usr/bin/env node
/**
 * Fail the build early when a client component reaches server-only code.
 *
 * On 27 Aug a production deploy died because PeopleDirectoryTable ("use client")
 * imported a constant from directory.ts, which imports the Supabase server
 * client, which imports next/headers. `tsc` passed — the types are correct on
 * both sides of the boundary — and every local check passed. Only the real
 * build caught it, ten minutes into a deploy, with production stuck a commit
 * behind.
 *
 * This walks the import graph out of every "use client" file and fails if it
 * reaches a server-only module. It takes about a second.
 *
 * The walk stops at "use server" files: a client component importing a server
 * action is the supported pattern, and Next replaces that import with an RPC
 * stub, so nothing behind it is bundled. It also ignores `import type`, which
 * is erased before bundling.
 *
 *   node scripts/check-client-boundaries.mjs
 *
 * Exits non-zero and prints the full chain from the client file to the
 * offending import.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, "src");

/** Importing any of these from the browser bundle is a build failure. */
const SERVER_ONLY = [
  "next/headers",
  "server-only",
  "next/dist/server",
  "node:fs",
  "node:child_process",
  "fs",
  "child_process",
];

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"];

function walkDir(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkDir(full, out);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

const cache = new Map();
function read(file) {
  if (!cache.has(file)) cache.set(file, readFileSync(file, "utf8"));
  return cache.get(file);
}

function directive(source) {
  // Only a directive in the first few lines counts; a "use client" string
  // buried in the body is just a string.
  const head = source.slice(0, 400);
  if (/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(head)) return "client";
  if (/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use server["']/.test(head)) return "server";
  return null;
}

const IMPORT_RE =
  /(?:^|\n)\s*(?:import\s+([\s\S]*?)\s+from\s*|import\s*|export\s+(?:\*|\{[\s\S]*?\})\s+from\s*)["']([^"']+)["']/g;

function importsOf(source) {
  const found = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    const clause = match[1] ?? "";
    const specifier = match[2];
    // `import type { X } from` and `{ type X, type Y }` are erased at compile
    // time and cannot pull anything into the bundle.
    if (/^\s*type\s/.test(clause)) continue;
    const named = clause.match(/\{([\s\S]*)\}/);
    if (named && !clause.replace(named[0], "").trim()) {
      const specifiers = named[1].split(",").map((s) => s.trim()).filter(Boolean);
      if (specifiers.length && specifiers.every((s) => s.startsWith("type "))) continue;
    }
    found.push(specifier);
  }
  return found;
}

function resolveImport(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) base = join(SRC, specifier.slice(2));
  else if (specifier.startsWith(".")) base = resolve(dirname(fromFile), specifier);
  else return null; // a package: only interesting if it is on the SERVER_ONLY list

  for (const ext of EXTENSIONS) {
    if (existsSync(base + ext)) return base + ext;
  }
  for (const ext of EXTENSIONS) {
    const index = join(base, "index" + ext);
    if (existsSync(index)) return index;
  }
  if (existsSync(base) && statSync(base).isFile()) return base;
  return null;
}

const violations = [];

/** Depth-first out of one client entry point, carrying the chain for the report. */
function walkImports(file, chain, seen) {
  if (seen.has(file)) return;
  seen.add(file);

  const source = read(file);

  for (const specifier of importsOf(source)) {
    const offender = SERVER_ONLY.find(
      (s) => specifier === s || specifier.startsWith(s + "/")
    );
    if (offender) {
      violations.push({ chain: [...chain, file], specifier });
      continue;
    }

    const next = resolveImport(specifier, file);
    if (!next) continue;

    // A "use server" module is an RPC boundary — Next never bundles what is
    // behind it, so the walk stops here rather than reporting a false alarm.
    if (directive(read(next)) === "server") continue;

    walkImports(next, [...chain, file], seen);
  }
}

const files = walkDir(SRC);
const clientFiles = files.filter((f) => directive(read(f)) === "client");

for (const entry of clientFiles) {
  walkImports(entry, [], new Set());
}

const rel = (f) => relative(ROOT, f).replace(/\\/g, "/");

if (violations.length === 0) {
  console.log(
    `client boundaries ok — ${clientFiles.length} client components, none reach server-only code`
  );
  process.exit(0);
}

console.error(
  `\n${violations.length} client component${violations.length === 1 ? "" : "s"} reach${
    violations.length === 1 ? "es" : ""
  } server-only code. This is the error the production build throws.\n`
);

for (const violation of violations) {
  const [entry, ...rest] = violation.chain;
  console.error(`  ${rel(entry)}  ("use client")`);
  for (const step of rest) console.error(`    → ${rel(step)}`);
  console.error(`    → ${violation.specifier}   ← server-only\n`);
}

console.error(
  "Fix: move the shared values into a module with no server imports and point\n" +
    "the client component at that. See src/lib/people/directory-shared.ts.\n"
);

process.exit(1);

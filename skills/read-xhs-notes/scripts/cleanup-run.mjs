#!/usr/bin/env node

// Delete only an explicit run-scoped directory inside an explicit temporary root.
import { rm } from "node:fs/promises";
import path from "node:path";

const [targetArg, rootArg] = process.argv.slice(2);
if (!targetArg || !rootArg) {
  throw new Error("Usage: cleanup-run.mjs <run-directory> <temporary-root>");
}

const target = path.resolve(targetArg);
const root = path.resolve(rootArg);
const relative = path.relative(root, target);
const base = path.basename(target);

if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
  throw new Error("Refusing a directory outside the explicit temporary root");
}
if (path.dirname(target) !== root) {
  throw new Error("Refusing a nested or indirect run directory");
}
if (!/^run-[a-z0-9-]+$/i.test(base)) {
  throw new Error("Refusing a non run-scoped directory");
}

await rm(target, { recursive: true, force: true });

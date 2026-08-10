#!/usr/bin/env node

// Read card records from stdin and sort by rendered visual position.
// Expected shape: [{"id":"...","rect":{"top":0,"left":0}, ...}]
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const cards = JSON.parse(Buffer.concat(chunks).toString("utf8"));
if (!Array.isArray(cards)) throw new Error("Input must be a JSON array");

const ordered = cards
  .map((card, index) => ({ card, index }))
  .sort((a, b) => {
    const ar = a.card.rect ?? {};
    const br = b.card.rect ?? {};
    const at = Number.isFinite(ar.top) ? ar.top : Number.POSITIVE_INFINITY;
    const bt = Number.isFinite(br.top) ? br.top : Number.POSITIVE_INFINITY;
    const band = 36;
    if (Math.abs(at - bt) > band) return at - bt;
    const al = Number.isFinite(ar.left) ? ar.left : Number.POSITIVE_INFINITY;
    const bl = Number.isFinite(br.left) ? br.left : Number.POSITIVE_INFINITY;
    return al - bl || a.index - b.index;
  })
  .map(({ card }) => card);

process.stdout.write(`${JSON.stringify(ordered, null, 2)}\n`);

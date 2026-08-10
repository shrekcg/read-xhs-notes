#!/usr/bin/env node

// Emit a re-openable Xiaohongshu note URL without session or share parameters.
const input = process.argv[2];
if (!input) throw new Error("Usage: sanitize-note-url.mjs <url>");

const parsed = new URL(input);
const noteMatch = parsed.pathname.match(/\/explore\/([a-z0-9]+)/i)
  ?? parsed.pathname.match(/\/user\/profile\/[^/]+\/([a-z0-9]+)/i);
const noteId = noteMatch?.[1] ?? null;

const safeUrl = noteId
  ? `https://www.xiaohongshu.com/explore/${noteId}`
  : (() => {
      parsed.search = "";
      parsed.hash = "";
      parsed.username = "";
      parsed.password = "";
      return parsed.toString();
    })();

process.stdout.write(`${JSON.stringify({ noteId, safeUrl })}\n`);

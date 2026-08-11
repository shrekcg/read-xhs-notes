#!/usr/bin/env node

// Extract one Xiaohongshu URL from shared text, then remove session/share parameters.
const input = process.argv.slice(2).join(" ");
if (!input) throw new Error("Usage: sanitize-note-url.mjs <url-or-shared-text>");

const match = input.match(/https?:\/\/[^\s<>"'《》〈〉（）()，,。！？!]+/i);
if (!match) throw new Error("No Xiaohongshu URL found in input");

const parsed = new URL(match[0]);
const hostname = parsed.hostname.toLowerCase();
const isXhsHost = hostname === "xhslink.cn"
  || hostname.endsWith(".xhslink.cn")
  || hostname === "xiaohongshu.com"
  || hostname.endsWith(".xiaohongshu.com");
if (!isXhsHost) throw new Error("Input URL is not a Xiaohongshu link");

parsed.search = "";
parsed.hash = "";
parsed.username = "";
parsed.password = "";
const sourceUrl = parsed.toString();
const noteMatch = parsed.pathname.match(/\/explore\/([a-z0-9]+)/i)
  ?? parsed.pathname.match(/\/user\/profile\/[^/]+\/([a-z0-9]+)/i);
const noteId = noteMatch?.[1] ?? null;

const safeUrl = noteId
  ? `https://www.xiaohongshu.com/explore/${noteId}`
  : sourceUrl;

process.stdout.write(`${JSON.stringify({ noteId, sourceUrl, safeUrl })}\n`);

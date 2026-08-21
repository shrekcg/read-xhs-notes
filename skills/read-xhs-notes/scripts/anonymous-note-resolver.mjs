#!/usr/bin/env node

import { pathToFileURL } from "node:url";

// Resolve one public Xiaohongshu note without account credentials.
// This helper deliberately fails closed: it never reads cookies and never
// falls back to an authenticated browser session.

const PAGE_HOSTS = new Set([
  "xiaohongshu.com",
  "www.xiaohongshu.com",
  "m.xiaohongshu.com",
  "xhslink.cn",
  "www.xhslink.cn",
]);
const FINAL_PAGE_HOSTS = new Set([
  "xiaohongshu.com",
  "www.xiaohongshu.com",
  "m.xiaohongshu.com",
]);
const MEDIA_HOST_SUFFIXES = [".xhscdn.com", ".xhsimg.com"];
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 5 * 1024 * 1024;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(object, keys) {
  for (const key of keys) {
    const value = cleanString(object?.[key]);
    if (value) return value;
  }
  return "";
}

function noteIdFromUrl(value) {
  const url = new URL(value);
  return url.pathname.match(/\/(?:explore|discovery\/item)\/([a-z0-9]+)/i)?.[1]
    ?? url.pathname.match(/\/user\/profile\/[^/]+\/([a-z0-9]+)/i)?.[1]
    ?? null;
}

function normalizeInputUrl(value) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (!PAGE_HOSTS.has(hostname)) {
    throw new Error("输入链接不是允许的小红书链接");
  }
  if (url.protocol !== "https:" && !hostname.endsWith("xhslink.cn")) {
    throw new Error("小红书页面只允许 HTTPS 访问");
  }
  url.protocol = "https:";
  url.username = "";
  url.password = "";
  return url;
}

function isAllowedFinalUrl(value) {
  const url = new URL(value);
  return url.protocol === "https:" && FINAL_PAGE_HOSTS.has(url.hostname.toLowerCase());
}

function safeUrlFor(value, noteId) {
  if (noteId) return `https://www.xiaohongshu.com/explore/${noteId}`;
  const url = new URL(value);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function imageUrlFromItem(item) {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const direct = firstString(item, ["urlDefault", "urlPre", "url", "originUrl"]);
  if (/^https?:\/\//i.test(direct)) return direct.replace(/^http:/i, "https:");
  for (const key of ["urlList", "infoList", "stream"]) {
    if (!Array.isArray(item[key])) continue;
    for (const nested of item[key]) {
      const url = imageUrlFromItem(nested);
      if (url) return url;
    }
  }
  return "";
}

function imageUrlsFromNote(note) {
  const urls = [];
  for (const key of ["imageList", "images", "image_list"]) {
    if (!Array.isArray(note?.[key])) continue;
    for (const item of note[key]) {
      const url = imageUrlFromItem(item);
      if (url) urls.push(url);
    }
  }
  for (const candidate of [note?.cover, note?.video?.cover, note?.video?.firstFrame]) {
    const url = imageUrlFromItem(candidate);
    if (url) urls.push(url);
  }
  return Array.from(new Set(urls)).slice(0, 20);
}

function isAllowedMediaUrl(value) {
  try {
    const url = new URL(value.replace(/^http:/i, "https:"));
    return url.protocol === "https:"
      && MEDIA_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

function videoUrlFromNote(note) {
  if (!note || typeof note !== "object") return "";
  const queue = [{ value: note, path: "" }];
  const visited = new WeakSet();
  const candidates = [];
  while (queue.length && candidates.length < 40) {
    const { value, path } = queue.shift();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    for (const [key, entry] of Object.entries(value)) {
      const entryPath = `${path}.${key}`;
      if (typeof entry === "string" && isAllowedMediaUrl(entry)
        && !/\.(?:avif|gif|heic|heif|jpe?g|png|webp)(?:$|\?)/i.test(entry)) {
        const url = new URL(entry.replace(/^http:/i, "https:"));
        const score = (/video/i.test(url.hostname) ? 5 : 0)
          + (/video|stream|h264|h265|avc|hevc|master|originVideo/i.test(entryPath) ? 4 : 0)
          + (/masterUrl|master_url|backupUrls|url/i.test(key) ? 2 : 0)
          - (/cover|image|avatar/i.test(entryPath) ? 6 : 0);
        if (score >= 4) candidates.push({ url: url.toString(), score });
      } else if (entry && typeof entry === "object") {
        queue.push({ value: entry, path: entryPath });
      }
    }
  }
  return candidates.sort((a, b) => b.score - a.score)[0]?.url || "";
}

function looksLikeNote(value, expectedNoteId) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidateId = firstString(value, ["noteId", "note_id", "id"]).toLowerCase();
  if (expectedNoteId && candidateId !== expectedNoteId.toLowerCase()) return false;
  return Boolean(
    firstString(value, ["title", "displayTitle", "desc", "description", "content"])
      || imageUrlsFromNote(value).length,
  );
}

function findNote(root, expectedNoteId) {
  if (!root || typeof root !== "object") return null;
  const directCandidates = [
    root?.noteDetailMap?.[expectedNoteId]?.note,
    root?.noteDetailMap?.[expectedNoteId],
    root?.noteData?.data?.noteData,
    root?.noteData?.note,
    root?.note,
  ];
  for (const candidate of directCandidates) {
    if (looksLikeNote(candidate, expectedNoteId)) return candidate;
  }
  const queue = [root];
  const visited = new WeakSet();
  let inspected = 0;
  while (queue.length && inspected < 20_000) {
    const value = queue.shift();
    if (!value || typeof value !== "object" || visited.has(value)) continue;
    visited.add(value);
    inspected += 1;
    if (looksLikeNote(value, expectedNoteId)) return value;
    for (const entry of Object.values(value)) {
      if (entry && typeof entry === "object") queue.push(entry);
    }
  }
  return null;
}

function extractJsonAssignment(html, variableName) {
  const marker = `window.${variableName}`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const equalsIndex = html.indexOf("=", markerIndex + marker.length);
  if (equalsIndex < 0) return null;
  const source = html.slice(equalsIndex + 1).trimStart();
  if (!source.startsWith("{")) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return parseJsonLikeObject(source.slice(0, index + 1));
    }
  }
  return null;
}

function parseJsonLikeObject(source) {
  const output = [];
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      output.push(char);
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      output.push(char);
      continue;
    }
    if (source.startsWith("undefined", index)
      && !/[\w$]/.test(source[index - 1] ?? "")
      && !/[\w$]/.test(source[index + 9] ?? "")) {
      output.push("null");
      index += 8;
      continue;
    }
    if (source.startsWith("NaN", index)
      && !/[\w$]/.test(source[index - 1] ?? "")
      && !/[\w$]/.test(source[index + 3] ?? "")) {
      output.push("null");
      index += 2;
      continue;
    }
    if (source.startsWith("Infinity", index)
      && !/[\w$]/.test(source[index - 1] ?? "")
      && !/[\w$]/.test(source[index + 8] ?? "")) {
      output.push("null");
      index += 7;
      continue;
    }
    output.push(char);
  }
  return JSON.parse(output.join(""));
}

function extractState(html) {
  for (const name of ["__INITIAL_STATE__", "__INITIAL_SSR_STATE__"]) {
    const state = extractJsonAssignment(html, name);
    if (state) return state;
  }
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  for (const script of scripts) {
    const match = script.match(/(?:window\.)?(?:__INITIAL_STATE__|__INITIAL_SSR_STATE__)\s*=\s*([\s\S]+)/);
    if (!match) continue;
    try {
      return parseJsonLikeObject(match[1].trim().replace(/;\s*$/, ""));
    } catch {
      // Try the balanced parser above against this smaller script.
    }
  }
  return null;
}

function normalizeNote(note, resolvedUrl, expectedNoteId) {
  const noteId = firstString(note, ["noteId", "note_id", "id"]) || expectedNoteId || null;
  const body = firstString(note, ["desc", "description", "content", "text"]);
  const title = firstString(note, ["title", "displayTitle"]);
  const user = note.user ?? note.author ?? {};
  const author = firstString(user, ["nickname", "nickName", "name"]);
  const tags = (note.tagList ?? note.tags ?? [])
    .map((tag) => typeof tag === "string" ? tag : firstString(tag, ["name", "title"]))
    .filter(Boolean);
  const imageUrls = imageUrlsFromNote(note).filter(isAllowedMediaUrl);
  const videoUrl = videoUrlFromNote(note);
  const type = firstString(note, ["type", "noteType"]) || (videoUrl ? "video" : "normal");
  return {
    noteId,
    title,
    author,
    body,
    tags: Array.from(new Set(tags)),
    type,
    imageUrls,
    videoUrl,
    sourceUrl: safeUrlFor(resolvedUrl, noteId),
    readStatus: "success",
    coverage: {
      bodyComplete: Boolean(body),
      imagesExpected: imageUrls.length,
      imagesProcessed: 0,
      videoCoverage: videoUrl ? "available" : "unavailable",
      uncertainSegments: [],
    },
  };
}

async function fetchHtml(inputUrl, options = {}) {
  let currentUrl = normalizeInputUrl(inputUrl);
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await (options.fetchImpl ?? fetch)(currentUrl, {
        method: "GET",
        redirect: "manual",
        credentials: "omit",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": "read-xhs-notes/0.1 anonymous-local-resolver",
        },
      });
    } finally {
      clearTimeout(timeout);
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirectCount === MAX_REDIRECTS) throw new Error("匿名解析重定向次数超过限制");
      const location = response.headers.get("location");
      if (!location) throw new Error("匿名解析返回了无效重定向");
      const nextUrl = new URL(location, currentUrl);
      if (!PAGE_HOSTS.has(nextUrl.hostname.toLowerCase())) {
        throw new Error("匿名解析器拒绝跳转到非小红书域名");
      }
      currentUrl = normalizeInputUrl(nextUrl.toString());
      continue;
    }
    if (!response.ok) throw new Error(`匿名解析请求失败（HTTP ${response.status}）`);
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
      throw new Error("匿名解析页面超过大小限制");
    }
    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      throw new Error("匿名解析页面超过大小限制");
    }
    if (!isAllowedFinalUrl(currentUrl.toString())) {
      throw new Error("匿名解析未到达小红书笔记页面");
    }
    return { html, resolvedUrl: currentUrl.toString() };
  }
  throw new Error("匿名解析失败");
}

export async function resolveAnonymousNote(inputUrl, options = {}) {
  const expectedNoteId = options.expectedNoteId ?? noteIdFromUrl(inputUrl);
  const { html, resolvedUrl } = await fetchHtml(inputUrl, options);
  const resolvedNoteId = noteIdFromUrl(resolvedUrl) ?? expectedNoteId;
  const state = extractState(html);
  const note = findNote(state, resolvedNoteId);
  if (!note) {
    throw new Error("匿名页面没有可读取的笔记主体；不会切换到你的登录浏览器");
  }
  return normalizeNote(note, resolvedUrl, resolvedNoteId);
}

async function main() {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) throw new Error("用法：anonymous-note-resolver.mjs <小红书链接>");
  const result = await resolveAnonymousNote(input);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

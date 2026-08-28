import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolveAnonymousNote } from "../skills/read-xhs-notes/scripts/anonymous-note-resolver.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function runScript(name, args = [], input = undefined) {
  return spawnSync(
    process.execPath,
    [path.join(repoRoot, "skills/read-xhs-notes/scripts", name), ...args],
    { encoding: "utf8", input },
  );
}

test("sanitize-note-url extracts the URL from native share text", () => {
  const result = runScript("sanitize-note-url.mjs", [
    "《示例标题 http://xhslink.cn/o/AbCd1234 复制这段，去【小红书】发现更多好内容~》",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    noteId: null,
    sourceUrl: "http://xhslink.cn/o/AbCd1234",
    safeUrl: "http://xhslink.cn/o/AbCd1234",
  });
});

test("sanitize-note-url removes tracking parameters and canonicalizes note URLs", () => {
  const result = runScript("sanitize-note-url.mjs", [
    "https://www.xiaohongshu.com/user/profile/user123/abc123?xsec_token=placeholder&share_id=tracking#part",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    noteId: "abc123",
    sourceUrl: "https://www.xiaohongshu.com/user/profile/user123/abc123",
    safeUrl: "https://www.xiaohongshu.com/explore/abc123",
  });
});

test("sanitize-note-url rejects non-Xiaohongshu URLs", () => {
  const result = runScript("sanitize-note-url.mjs", ["https://example.com/note"]);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not a Xiaohongshu link/);
});

test("anonymous resolver extracts a public note without credentials", async () => {
  const noteId = "64cb12340000000001020304";
  const sourceUrl = `https://xhslink.cn/o/share-${noteId}`;
  const requestedUrls = [];
  let requestInit;
  const state = {
    note: {
      noteDetailMap: {
        [noteId]: {
          note: {
            noteId,
            title: "匿名解析标题",
            desc: "匿名解析正文",
            imageList: [
              { urlDefault: "https://sns-webpic-qc.xhscdn.com/first.webp" },
            ],
            user: { nickname: "作者" },
            tagList: [{ name: "设计" }],
            type: "normal",
          },
        },
      },
    },
  };
  const html = `<html><script>window.__INITIAL_STATE__=${JSON.stringify(state).replace(
    '{"note":',
    '{"optional":undefined,"note":',
  )}</script></html>`;
  const note = await resolveAnonymousNote(sourceUrl, {
    fetchImpl: async (url, init) => {
      requestedUrls.push(url.toString());
      requestInit = init;
      if (requestedUrls.length === 1) {
        return new Response("", {
          status: 302,
          headers: { location: `https://www.xiaohongshu.com/explore/${noteId}` },
        });
      }
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    },
  });

  assert.deepEqual(requestedUrls, [
    "https://xhslink.cn/o/share-64cb12340000000001020304",
    `https://www.xiaohongshu.com/explore/${noteId}`,
  ]);
  assert.equal(requestInit.credentials, "omit");
  assert.equal(
    Object.keys(requestInit.headers).some((name) => name.toLowerCase() === "cookie"),
    false,
  );
  assert.equal(note.title, "匿名解析标题");
  assert.equal(note.body, "匿名解析正文");
  assert.deepEqual(note.imageUrls, ["https://sns-webpic-qc.xhscdn.com/first.webp"]);
  assert.equal(note.sourceUrl, `https://www.xiaohongshu.com/explore/${noteId}`);
});

test("anonymous resolver follows only Xiaohongshu redirects", async () => {
  const sourceUrl = "https://xhslink.cn/o/example";
  await assert.rejects(
    resolveAnonymousNote(sourceUrl, {
      fetchImpl: async () => new Response("", {
        status: 302,
        headers: { location: "https://example.com/collect-account" },
      }),
    }),
    /非小红书域名/,
  );
});

test("anonymous resolver fails closed instead of using a logged-in browser", async () => {
  await assert.rejects(
    resolveAnonymousNote("https://www.xiaohongshu.com/explore/64cb12340000000001020304", {
      fetchImpl: async () => new Response("<html><h1>请登录后查看</h1></html>", { status: 200 }),
    }),
    /不会切换到你的登录浏览器/,
  );
});

test("order-cards sorts a visual row left-to-right and rows top-to-bottom", () => {
  const input = JSON.stringify([
    { id: "right", rect: { top: 10, left: 300 } },
    { id: "next", rect: { top: 100, left: 10 } },
    { id: "left", rect: { top: 12, left: 10 } },
  ]);
  const result = runScript("order-cards.mjs", [], input);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).map((card) => card.id), [
    "left",
    "right",
    "next",
  ]);
});

test("order-cards rejects non-array input", () => {
  const result = runScript("order-cards.mjs", [], "{}");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Input must be a JSON array/);
});

test("cleanup-run deletes only a direct run-scoped child", async (context) => {
  const sandbox = await mkdtemp(path.join(tmpdir(), "read-xhs-notes-test-"));
  context.after(() => rm(sandbox, { recursive: true, force: true }));
  const root = path.join(sandbox, "root");
  const target = path.join(root, "run-valid");
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, "sample.txt"), "temporary");

  const result = runScript("cleanup-run.mjs", [target, root]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(target), false);
});

test("cleanup-run refuses roots, nested paths and arbitrary names", async (context) => {
  const sandbox = await mkdtemp(path.join(tmpdir(), "read-xhs-notes-test-"));
  context.after(() => rm(sandbox, { recursive: true, force: true }));
  const root = path.join(sandbox, "root");
  const nested = path.join(root, "parent", "run-nested");
  const arbitrary = path.join(root, "cache");
  await mkdir(nested, { recursive: true });
  await mkdir(arbitrary, { recursive: true });

  for (const target of [root, nested, arbitrary]) {
    const result = runScript("cleanup-run.mjs", [target, root]);
    assert.notEqual(result.status, 0, `unexpectedly accepted ${target}`);
    assert.equal(existsSync(target), true, `unexpectedly deleted ${target}`);
  }
});

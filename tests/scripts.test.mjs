import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

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

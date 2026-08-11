import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const skillRoot = path.join(repoRoot, "skills/read-xhs-notes");

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("Skill has valid core metadata and directly linked references", () => {
  const skill = read("skills/read-xhs-notes/SKILL.md");
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter, "SKILL.md frontmatter is missing");

  const keys = frontmatter[1]
    .split("\n")
    .map((line) => line.match(/^([a-z_]+):/)?.[1])
    .filter(Boolean);
  assert.deepEqual(keys, ["name", "description"]);
  assert.match(frontmatter[1], /^name: read-xhs-notes$/m);

  const references = readdirSync(path.join(skillRoot, "references"))
    .filter((name) => name.endsWith(".md"));
  for (const name of references) {
    assert.ok(
      skill.includes(`[references/${name}](references/${name})`),
      `${name} is not linked directly from SKILL.md`,
    );
  }
});

test("README relative links resolve", () => {
  const readme = read("README.md");
  const targets = [...readme.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((target) => target.startsWith("./") && !target.includes("#"));

  for (const target of targets) {
    assert.equal(
      existsSync(path.resolve(repoRoot, target)),
      true,
      `missing README target: ${target}`,
    );
  }
});

test("README keeps one consistent Feishu destination contract", () => {
  const readme = read("README.md");
  const persistence = read("skills/read-xhs-notes/references/persistence.md");

  assert.ok(!readme.includes("飞书目标=<文档或文件夹>"), "README must not accept a document as 飞书目标");
  assert.ok(!readme.includes("写入已有飞书文档"), "README must not promise writes to existing documents");
  assert.ok(readme.includes("不会追加或覆盖既有飞书文档"), "README must preserve the new-document contract");
  assert.ok(persistence.includes("不追加或覆盖已有飞书文档"), "persistence reference must preserve the new-document contract");
});

test("privacy wording distinguishes the current Agent from extra services", () => {
  const readme = read("README.md");
  const skill = read("skills/read-xhs-notes/SKILL.md");

  assert.ok(!readme.includes("不会把笔记内容发送给第三方服务"), "README must not make an absolute no-third-party claim");
  assert.ok(readme.includes("当前 Agent 及其模型"), "README must describe current-Agent processing");
  assert.ok(readme.includes("额外发送到当前 Agent 运行环境之外"), "README must distinguish extra external services");
  assert.ok(skill.includes("当前 Agent 及其模型"), "Skill must describe current-Agent processing");
});

test("OpenAI UI metadata satisfies local constraints", () => {
  const yaml = read("skills/read-xhs-notes/agents/openai.yaml");
  const description = yaml.match(/short_description: "([^"]+)"/)?.[1];
  const defaultPrompt = yaml.match(/default_prompt: "([^"]+)"/)?.[1];

  assert.ok(description, "short_description is missing");
  assert.ok(description.length >= 25 && description.length <= 64);
  assert.match(defaultPrompt ?? "", /\$read-xhs-notes/);
});

test("README SVGs are Chinese-first and structurally present", () => {
  const hero = read("assets/readme/hero.svg");
  const workflow = read("assets/readme/workflow.svg");

  assert.match(hero, /^<svg/);
  assert.match(hero, /快速读取小红书笔记/);
  assert.match(workflow, /^<svg/);
  assert.match(workflow, /已授权会话/);
  assert.match(workflow, /内容识别/);
  assert.match(workflow, /阅读记录/);
});

# Reading record contract

## Fidelity rules

- Put source reconstruction before any reading-oriented restructuring.
- Keep original order and retain names, numbers, steps, conditions, exceptions, and conclusions.
- Distinguish directly visible text from OCR, ASR, and model interpretation.
- Add source markers only where they improve checking; do not clutter short text notes.

## Suggested wording

Use “笔记明确说……” for page-grounded claims, “图片中可读到……” for OCR, “视频在 01:24 显示……” for key-frame observations, and “当前无法确认……” for gaps. Mark a high-information item as “笔记提到” rather than treating it as a verified recommendation.

## High-information inventory

Extract literal items that help a reader reuse the note in another Agent or AI tool:

- 工具与资源 — product, model, repository, website, template, dataset, or file.
- Skill / 工作流 — named skill, agent role, sequence, integration, or operating method.
- 提示词与命令 — preserve enough surrounding condition to make a prompt or command usable.
- 规则 / 指标 / 限制 — numbers, version requirements, prerequisites, exceptions, and caveats.

For every item, preserve the literal name and a `[正文]`, `[图 n]`, or `[视频 mm:ss]` marker. Include a link only if it is visible in the source; do not manufacture a URL from a product name.

## Raw text presentation

Label the blocks separately:

1. 原始正文 — page text captured from the note.
2. 图片文字稿 — OCR-derived text, grouped by image index.
3. 视频文字稿 — accessible subtitle or ASR text, grouped by timestamp.

If combined source text is too long for chat, create one Markdown artifact only when requested or configured. Never silently truncate it.

# Output contract

## Fidelity rules

- Put source reconstruction before compression.
- Keep original order and retain names, numbers, steps, conditions, exceptions, and conclusions.
- Distinguish directly visible text from OCR, ASR, and model interpretation.
- Add source markers only where they improve checking; do not clutter short text notes.

## Suggested wording

Use “笔记明确说……” for page-grounded claims, “图片中可读到……” for OCR, “视频在 01:24 显示……” for key-frame observations, and “当前无法确认……” for gaps. Avoid “作者证明了” or “一定可以” unless the source itself provides that level of support.

## Raw text presentation

Label the blocks separately:

1. 原始正文 — page text captured from the note.
2. 图片文字稿 — OCR-derived text, grouped by image index.
3. 视频文字稿 — accessible subtitle or ASR text, grouped by timestamp.

If combined source text is too long for chat, create one Markdown artifact only when requested or configured. Never silently truncate it.

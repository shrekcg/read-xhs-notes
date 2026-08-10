---
name: read-xhs-notes
description: Quickly read, batch-capture, and optionally archive Xiaohongshu notes from one link, a user-authorized favorites list, a user-authorized likes list, or an explicit link list. Use when a user wants the actual content of Xiaohongshu text, image, or accessible video notes; wants to batch-read notes; wants tools, skills, workflows, prompts, links, commands, and other high-information items extracted; or wants source-linked note records saved locally or to an explicitly authorized knowledge destination.
---

# Xiaohongshu Note Reader

Treat this skill as a fast reading and content-capture pipeline. Make a note readable before making it shorter. Preserve source order and strong information so the user can reuse a note in an Agent, AI tool, or later review.

## Authorization and privacy boundary

- Use only a user-authorized, visible browser session. Ask the user to sign in manually when necessary.
- Never ask for, inspect, export, log, or store cookies, tokens, passwords, QR-login payloads, local storage, browser profiles, or other credentials.
- Do not bypass a CAPTCHA, login challenge, access control, rate limit, or platform restriction. Let the user complete any required interactive step.
- Treat `收藏` and `点赞` as separate private entry points. Use either only after the user authorizes that specific account scope.
- Do not transmit note contents or browser data to an external model, OCR/ASR service, document service, or knowledge base unless the user explicitly authorizes that destination.

## Batch entry points

Accept these request modes:

- `入口=链接` — one note link.
- `入口=链接列表` — user-provided links.
- `入口=收藏` — newest or selected notes in the user's authorized favorites view.
- `入口=喜欢` — newest or selected notes in the user's authorized likes view.
- `入口=可见卡片` — cards currently rendered on an authorized page.

For `收藏` and `喜欢`, first confirm the active page state (`tab=fav` or `tab=liked`) and the `笔记` sub-view. Capture the bounding rectangle of each **card container**, not its title link. Sort cards by container position—top-to-bottom, then left-to-right within the same visual band—and deduplicate by note ID. Show the selected titles before opening notes when the batch is large.

## Workflow

1. Identify the entry point, requested count, and whether the user wants an archive.
2. Capture note title, author, clean source link, page body, media type, visible media order, and media availability. Exclude comments, likes, and unrelated metadata unless asked.
3. Read every carrier:
   - Preserve the full page body and paragraph order.
   - OCR every text-bearing image in order. Prefer original page assets; use screenshots only when necessary.
   - For video, read accessible subtitles or speech when available, then sample key frames for on-screen text and meaningful visual changes. Report partial coverage when audio, captions, or frames are unavailable.
4. Build a normalized evidence package. Keep page body, OCR, subtitle/ASR, key-frame observations, and uncertainty separate.
5. Extract high-information items without promoting or validating them: tools, skills, repositories, websites, workflows, prompts, commands, configurations, templates, metrics, constraints, and referenced links. Keep every item's source marker.
6. If the environment supports a child-agent runner, dispatch only the normalized package for reading analysis. Inherit the current model and reasoning effort by default; honor a user-specified model or reasoning level only when the runner supports it. Never pass browser state or credentials.
7. Render a standard reading record. Preserve names, numbers, steps, conditions, exceptions, causal links, and the author's conclusion. Use light restructuring only to improve scanability.
8. If requested, archive the records using the persistence contract. Sanitize saved links before writing them and require an explicit destination for any external document service.
9. Verify selected-card coverage, source markers, high-information items, persisted link safety, and unsupported inferences. Clean temporary media and intermediates in a `finally` path.

## Request configuration

Accept natural-language overrides such as:

`入口=<链接|链接列表|收藏|喜欢|可见卡片> 数量=<N> 模型=<available-model> 推理=<继承|低|中|高> 阅读=<保真|轻度整理> 原文=<自动|附上|单独文件|不输出> 沉淀=<不保存|本地Markdown|本地CSV+Markdown|飞书文档> 输出目录=<path> 飞书目标=<doc-or-folder> 缓存=<即刻清理|24小时|3天>`

Defaults: `阅读=保真`, `原文=自动`, `沉淀=不保存`, and `缓存=即刻清理`. Keep model, reasoning, reading depth, archive target, and temporary retention independent.

## Standard reading record

Output every note in this order:

1. 标题 / 类型 / 来源入口
2. 原链接 — use a cleaned, re-openable note URL; never include session query parameters.
3. 快速读到的内容 — two or three source-grounded sentences.
4. 内容还原 — the main body, following source order. Use `[正文]`, `[图 3]`, or `[视频 01:24]` when they aid checking.
5. 强信息清单 — grouped as `工具与资源`, `Skill/工作流`, `提示词与命令`, `规则/指标/限制`, with source markers and links only when actually present.
6. 可以直接复用的内容 — concrete prompts, commands, steps, or templates; do not invent a recommendation.
7. 原始文本 — label page body, image OCR, and video subtitle/ASR separately.
8. 信息缺口 — unreadable, unavailable, or partially covered content only.

For batches, finish the full record for every note before adding an optional cross-note index. Do not let a batch synthesis replace the individual source records.

## Normalized evidence package

```yaml
note:
  id: <note-id>
  title: <title>
  author: <author>
  entry_point: <link|link_list|favorites|likes|visible_cards>
  source_url: <sanitized re-openable URL>
classification:
  display_type: <human label>
  primary_carrier: <body_text|image_text|speech|mixed>
raw_content:
  body: <page body>
  images:
    - index: 1
      ocr_text: <derived text>
      visual_notes: <observable structure only>
  video:
    transcript: <derived speech/subtitles>
    frames:
      - timestamp: 00:00
        text: <on-screen text>
        visual_notes: <observable action or diagram>
high_information:
  - kind: <tool|skill|workflow|prompt|command|link|metric|constraint|template>
    name: <literal source name>
    detail: <source-grounded description>
    source_marker: <正文|图 2|视频 01:24>
    url: <sanitized URL when present>
coverage:
  body_complete: true
  images_expected: 0
  images_processed: 0
  video_coverage: <complete|partial|unavailable>
  uncertain_segments: []
```

## Resources

- Read [references/session-and-privacy.md](references/session-and-privacy.md) before operating a signed-in session or explaining authorization.
- Read [references/media-routing.md](references/media-routing.md) when choosing OCR, image, video, or cleanup behavior.
- Read [references/output-contract.md](references/output-contract.md) when rendering a reading record or strong-information inventory.
- Read [references/persistence.md](references/persistence.md) when saving local files or an explicitly authorized document destination.
- Read [references/quality-checklist.md](references/quality-checklist.md) before finalizing a batch or media-heavy note.
- Use [scripts/order-cards.mjs](scripts/order-cards.mjs) only to sort already-captured card-container records.
- Use [scripts/sanitize-note-url.mjs](scripts/sanitize-note-url.mjs) before saving any note URL.
- Use [scripts/cleanup-run.mjs](scripts/cleanup-run.mjs) only with an explicit run directory and its explicit temporary-root directory.

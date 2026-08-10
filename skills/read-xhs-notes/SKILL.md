---
name: read-xhs-notes
description: Read and faithfully reconstruct Xiaohongshu notes from one link or a user-authorized favorites list. Use when a user asks what a Xiaohongshu note says, wants a source-grounded light summary, requests recent or selected favorites, needs image text or accessible video content read, or wants to compare a summary against the original text.
---

# Xiaohongshu Note Reader

Treat this skill as a reading pipeline, not generic summarization. Capture the source structure first; compress only after extraction and coverage checks.

## Authorization and privacy boundary

- Use only a user-authorized, visible browser session. Ask the user to sign in manually when necessary.
- Never ask for, inspect, export, log, or store cookies, tokens, passwords, QR-login payloads, local storage, browser profiles, or other credentials.
- Do not bypass a CAPTCHA, login challenge, access control, rate limit, or platform restriction. Let the user complete any required interactive step.
- Use a profile page only for the account already authorized by the user. Do not treat a shared profile link as permission to browse private favorites.
- Do not transmit note contents, browser data, or personal files to a third party unless the user explicitly authorizes that destination.

## Workflow

1. Identify the request mode: one link, the newest `N` visually ordered favorites, selected favorites, or comparison.
2. For favorites, confirm the `收藏 / 笔记` view. Order cards by their rendered position—top-to-bottom, then left-to-right within a visual band—and deduplicate by note ID. Never rely on DOM source order alone.
3. Capture the title, author, page body, media type, visible media order, and media availability. Exclude comments, likes, and unrelated metadata unless asked.
4. Route each carrier:
   - Read page body in full and preserve its paragraph order.
   - OCR every text-bearing image in order. Prefer original page assets; use screenshots only when they are the only accessible evidence.
   - For video, use accessible subtitles or speech transcription when available, then sample key frames for on-screen text and meaningful visual changes. If audio or video cannot be accessed, report timestamped key-frame coverage only.
5. Build a normalized content package. Keep page body, OCR, subtitle/ASR, observations, and uncertainty separate.
6. If the environment supports a child-agent runner, dispatch only the normalized package for analysis. Inherit the current model and reasoning effort by default; honor a user-specified model or reasoning level only when the runner supports it. Never pass browser state or credentials.
7. Produce a light, source-grounded reconstruction. Preserve names, numbers, steps, conditions, exceptions, causal links, and the author's conclusion. Do not turn an OCR or ASR fragment into an exact quote.
8. Verify title/author, carrier coverage, numbers, source markers, and unsupported inferences. Repair a missing source section before summarizing.
9. Clean temporary media and intermediates in a `finally` path. Retain only user-requested text artifacts for the requested TTL.

## Analysis configuration

Accept natural-language overrides such as:

`模型=<available-model> 推理=<继承|低|中|高> 压缩=<轻度|标准|高度> 原文=<自动|附上|单独文件|不输出> 缓存=<即刻清理|24小时|3天>`

When omitted, inherit the current model and reasoning effort, use `压缩=轻度`, use `原文=自动`, and delete media after completion. Keep analysis model, reasoning level, output compression, and retention policy independent.

## Output contract

Output each note in this order:

1. 标题
2. 作者
3. 类型 — a human-readable label derived from separate media and carrier fields, for example `多图文字笔记（正文很短，主要信息在图片）`.
4. 这篇具体讲了什么 — two or three precise, source-grounded sentences.
5. 内容还原 — the main body, following source order. Use `[正文]`, `[图 3]`, or `[视频 01:24]` only when they aid checking.
6. 核心观点 — source-supported claims only.
7. 可以直接带走的内容 — steps, rules, tools, prompts, metrics, or actions when present.
8. 原始文本 — label page body, image OCR, and video subtitle/ASR separately. Never call derived OCR or ASR the exact original.
9. 信息缺口 — include only unreadable, unavailable, or partially covered content.

Use light compression by default: preserve roughly 70% reconstruction, 20% structure, and 10% summary. For batches, complete every note independently before adding a cross-note synthesis.

## Normalized content package

```yaml
note:
  id: <note-id>
  title: <title>
  author: <author>
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
coverage:
  body_complete: true
  images_expected: 0
  images_processed: 0
  video_coverage: <complete|partial|unavailable>
  uncertain_segments: []
```

When the package is large, keep a per-image or per-time-section inventory before merging. Never merge away numbers, tools, steps, conditions, or exceptions.

## Resources

- Read [references/session-and-privacy.md](references/session-and-privacy.md) before operating a signed-in session or explaining authorization.
- Read [references/media-routing.md](references/media-routing.md) when choosing OCR, image, video, or cleanup behavior.
- Read [references/output-contract.md](references/output-contract.md) when refining source markers or raw-text presentation.
- Read [references/quality-checklist.md](references/quality-checklist.md) before finalizing a batch or media-heavy note.
- Use [scripts/order-cards.mjs](scripts/order-cards.mjs) only to deterministically sort already-captured card records.
- Use [scripts/cleanup-run.mjs](scripts/cleanup-run.mjs) only with an explicit run directory and its explicit temporary-root directory.

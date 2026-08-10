# Quality checklist

Before returning a result, verify:

- The user-authorized scope is correct; favorites were not inferred from a public profile or note link.
- The correct `收藏 / 笔记` cards were selected by visual order and deduplicated by note ID.
- Title and author match the opened note.
- Body paragraphs and named sections are represented in source order.
- Every source number, tool name, list item, step, condition, and exception survives reconstruction.
- Image indexes and video timestamps are correct when used.
- OCR, subtitle, ASR, and key-frame uncertainty are labeled instead of guessed.
- Comments, likes, and unrelated metadata are not mixed into content unless requested.
- The summary contains no unsupported claims or inflated certainty.
- Raw page body, image OCR, and video transcript are labeled as different evidence types.
- Run-scoped media and intermediates are cleaned according to the requested policy.

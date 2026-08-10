# Quality checklist

Before returning a result, verify:

- The user-authorized scope is correct; favorites or likes were not inferred from a public profile or note link.
- The active entry point is correct: `tab=fav` for 收藏 or `tab=liked` for 喜欢, with the `笔记` sub-view selected.
- The correct cards were selected by card-container visual order and deduplicated by note ID; title-link positions and DOM array order were not used for sorting.
- Title and author match the opened note.
- Body paragraphs and named sections are represented in source order.
- Every source number, tool name, list item, step, condition, and exception survives reconstruction.
- Image indexes and video timestamps are correct when used.
- OCR, subtitle, ASR, and key-frame uncertainty are labeled instead of guessed.
- Comments, likes, and unrelated metadata are not mixed into content unless requested.
- The summary contains no unsupported claims or inflated certainty.
- Strong-information items preserve literal names and source markers; they are not presented as recommendations unless the source supports that claim.
- Saved note URLs contain no session, share, or authorization query parameters.
- Raw page body, image OCR, and video transcript are labeled as different evidence types.
- Run-scoped media and intermediates are cleaned according to the requested policy.

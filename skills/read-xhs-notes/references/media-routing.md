# Media routing

## Text

Capture the full visible page body and preserve paragraph and heading order. Ignore comments by default.

## Images

Prefer original page image assets when the browser exposes them. OCR every text-bearing image in order and record image index, confidence, and unreadable regions. Treat cover-only imagery as non-evidence for claims. Use screenshots only as a fallback.

## Video

Capture accessible subtitles and speech before sampling key frames for on-screen text and meaningful visual changes. Increase frame density for silent screen recordings. Record timestamps.

Do not claim full transcription when the browser exposes only a stream, audio is unavailable, captions are absent, or the runtime has no speech-to-text capability. In that case, report partial coverage with the exact evidence available.

## Temporary data

Create media only under one run-scoped directory inside a dedicated temporary root, for example `<temp-root>/run-2026-08-10-abc123/`. Delete source video after audio/frame extraction, delete frames after OCR or vision processing, and delete all intermediates after verification.

A multi-day TTL is guaranteed only when a scheduled cleaner exists. Otherwise sweep expired run directories at the next invocation. Use `cleanup-run.mjs <run-directory> <temporary-root>` rather than a broad deletion command.

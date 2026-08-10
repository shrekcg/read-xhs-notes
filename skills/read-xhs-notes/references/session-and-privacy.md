# Session and privacy

## User action

1. Open Xiaohongshu in a browser the agent can visibly control.
2. Log in manually with the user's normal method.
3. Open or explicitly share the target note, favorites page, or a browser tab with the agent.
4. Complete any CAPTCHA, device verification, or login confirmation manually.

The user should never paste a cookie, token, password, QR-login value, browser profile, or session export into chat.

## Agent action

- Read visible page content only after the user has authorized the page or account scope.
- Do not access browser storage, cookie jars, saved passwords, extension data, or profile directories.
- Keep browser work in the background unless the user asks to watch it.
- Restore or close temporary navigation tabs according to the host browser's normal cleanup rules.

## Favorites scope

`我的收藏` is private account content. Require the user to have authorized their own signed-in favorites page. Do not infer that permission from a public note link, public profile, or another person's shared page.

## Failure handling

- If login is required, ask the user to complete it in the visible browser; do not request credentials.
- If a CAPTCHA or device check appears, pause and ask the user to complete it.
- If the page has no usable browser session, provide the reading template and explain that only publicly visible content may be available.

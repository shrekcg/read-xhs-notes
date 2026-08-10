# Persistence contract

## Select the smallest useful destination

| Request | Destination | Recommended use |
| --- | --- | --- |
| `沉淀=本地Markdown` | One batch Markdown document | A readable review after a small batch |
| `沉淀=本地CSV+Markdown` | One `index.csv` plus one Markdown record per note | A growing personal library; recommended default for repeated batches |
| `沉淀=飞书文档` | A user-specified Feishu document or folder | Shared review or an existing Feishu knowledge workflow |

Do not write anything when `沉淀=不保存`. For a Feishu destination, require an explicit document or folder target and explicit user authorization at write time. Use the host's document connector when available; otherwise report that the destination is unsupported rather than simulating a save.

## Local layout

Use a user-selected output directory. For `本地CSV+Markdown`, use this stable layout:

```text
xhs-library/
├── index.csv
├── batches/
│   └── 2026-08-10-favorites.md
└── notes/
    └── 6a717ae00000000008013570.md
```

Do not place media downloads, browser data, or credentials in the archive. The archive contains only the standard reading record and user-approved text artifacts.

## Index fields

Keep the index machine-readable and source-linked:

```text
note_id,title,entry_point,source_url,captured_at,display_type,high_information,coverage,record_path
```

- `note_id`: stable note identifier when available.
- `title`: literal note title.
- `entry_point`: `link`, `link_list`, `favorites`, `likes`, or `visible_cards`.
- `source_url`: sanitized re-openable note URL; never an href containing session parameters.
- `captured_at`: ISO 8601 timestamp of the read.
- `display_type`: human-readable media label.
- `high_information`: short semicolon-separated literal item names.
- `coverage`: `complete`, `partial`, or `unavailable`.
- `record_path`: relative Markdown record path.

Deduplicate by `note_id` when available, otherwise by sanitized source URL. Update an existing index row rather than writing a duplicate unless the user asks to retain reading history.

## Markdown record

Use this shape for each note:

```markdown
# <literal title>

- 来源入口：<收藏 | 喜欢 | 链接列表 | 单条链接>
- 原链接：<sanitized re-openable URL>
- 读取时间：<ISO 8601>
- 类型：<display type>

## 快速读到的内容

<two or three source-grounded sentences>

## 内容还原

<source-order body with evidence markers>

## 强信息清单

### 工具与资源
### Skill / 工作流
### 提示词与命令
### 规则 / 指标 / 限制

## 原始文本

<page body, OCR, and ASR labeled separately>

## 信息缺口

<only when needed>
```

## Link sanitation

Before writing a URL, remove query and fragment components, especially `xsec_token`, `xsec_source`, sharing IDs, timestamps, and tracking parameters. When a stable note ID is known, prefer `https://www.xiaohongshu.com/explore/<note-id>`. Preserve the user-provided short link only when no stable note ID is available.

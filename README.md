<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="read-xhs-notes: a source-grounded Xiaohongshu note reader for text, image, and video notes">
</p>

<p align="center">
  <a href="#安装"><strong>安装</strong></a> ·
  <a href="#第一次使用"><strong>第一次使用</strong></a> ·
  <a href="#批量入口"><strong>批量入口</strong></a> ·
  <a href="#内容沉淀"><strong>内容沉淀</strong></a> ·
  <a href="#登录态与隐私"><strong>登录态与隐私</strong></a> ·
  <a href="#能力边界"><strong>能力边界</strong></a>
</p>

`read-xhs-notes` 是一个面向 Codex、Claude Code 等 Agent Skills 兼容工具的小红书**快速阅读与批量录入** Skill。它的价值不是“再做一个总结器”，而是把小红书里难以复看的正文、图片文字、视频信息和强信息内容，变成可快速阅读、可回链、可沉淀的笔记记录。

它支持单条链接、链接列表、用户明确授权的`收藏`与`喜欢`批量入口，以及图文和可访问视频。每篇笔记都会保留原始内容结构，并重点提取工具、Skill、工作流、提示词、命令、链接、指标与限制，便于后续应用到自己的 Agent、AI 工具或知识库。

<p align="center">
  <img src="./assets/readme/workflow.svg" width="100%" alt="从已授权的可见浏览器会话、内容盘点和媒体证据，到保真阅读输出的四步流程">
</p>

## 安装

本仓库遵循通用 Agent Skills 目录约定，`npx skills` 能发现并安装其中的 `read-xhs-notes`。

```bash
# 安装到当前项目，供 Codex 使用
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -a codex

# 全局安装到 Codex，跳过交互确认
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -g -a codex -y

# 安装到 Claude Code（同一份 Skill）
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -g -a claude-code -y
```

也可以克隆仓库后，将 [`skills/read-xhs-notes`](./skills/read-xhs-notes) 放到你的 Agent 所识别的 skills 目录。不同 Agent 的浏览器连接方式不同；本 Skill 需要的是“能读取用户已授权、可见浏览器标签页”的能力，而不是某个特定浏览器品牌。

## 第一次使用

首次只需要用户在自己的浏览器中完成一次登录。之后，只要该浏览器会话仍有效，Agent 可以在用户明确授权的范围内读取笔记或收藏。

1. 在 Agent 能控制的可见浏览器中打开小红书。
2. 用户自己完成登录、设备验证或验证码。
3. 打开或明确分享目标笔记、收藏页或标签页。
4. 直接发出请求，例如：

```text
用 $read-xhs-notes 快速读这条小红书笔记，原文=附上，缓存=即刻清理。

用 $read-xhs-notes 批量读取我“我的收藏”里最新 5 篇笔记。先按屏幕上的瀑布流顺序列出标题，再逐篇输出标准阅读记录；模型=继承，推理=中，阅读=保真。

用 $read-xhs-notes 批量读取我“喜欢”里的最新 10 篇笔记，沉淀=本地CSV+Markdown，输出目录=~/Documents/xhs-library。

用 $read-xhs-notes 读取这条视频笔记。优先给出字幕/口播和画面中的操作步骤；如果无法完整转写，请标出已覆盖的时间段和信息缺口。
```

`入口`、`数量`、`模型`、`推理`、`阅读`、`原文`、`沉淀`、`输出目录` 与 `缓存` 是相互独立的自然语言配置。若当前 Agent 支持子 Agent 和模型选择，Skill 只把已经脱敏的内容包交给阅读分析阶段；它不会传递浏览器会话或任何凭据。

## 批量入口

批量阅读不等于只读“收藏”。Skill 支持下列入口：

| 入口 | 用途 | 已验证页面状态 |
| --- | --- | --- |
| `入口=收藏` | 批量读取用户收藏的笔记 | `tab=fav&subTab=note` |
| `入口=喜欢` | 批量读取用户点赞的笔记 | `tab=liked&subTab=note` |
| `入口=链接列表` | 批量读取用户粘贴的一组链接 | 不依赖个人列表 |
| `入口=可见卡片` | 读取当前已授权页面上渲染的卡片 | 适合用户手动筛选后交给 Agent |

收藏和喜欢是不同的页面入口，必须分别确认当前选中的 `笔记` 子视图。卡片会根据**卡片容器的屏幕位置**排序：先上后下、同一行先左后右；不能用 DOM 数组顺序，也不能用标题文字所在位置代替卡片位置。

## 登录态与隐私

这个项目**不收集、索取、读取、导出或保存**任何小红书登录信息，包括：Cookie、Token、密码、二维码登录数据、浏览器本地存储、浏览器 Profile 或扩展数据。

正确的授权流程是：

```text
用户在自己的可见浏览器手动登录
        ↓
用户打开/明确分享目标页面或“我的收藏”范围
        ↓
Agent 只读取可见页面与已授权媒体
        ↓
临时媒体在本次处理后清理
```

- 遇到登录、验证码、设备验证、访问限制或反爬提示时，Agent 必须暂停并由用户手动完成；不会尝试绕过。
- `我的收藏` 是私有内容。公开笔记链接或公开主页链接，不等于对收藏列表的授权。
- Skill 默认不分析评论区，也不会将笔记内容发送给第三方服务；若运行环境要使用外部 OCR、ASR 或模型，必须在执行前明确获得用户对该目的地的授权。

这条边界对用户最重要：你无需交出“登录缓存相关的 key”，也不应把它们粘贴给任何 Agent。

## 能力

| 笔记形态 | 读取方式 | 输出中的证据标记 |
| --- | --- | --- |
| 纯文本 / 图文正文 | 完整正文与段落顺序 | `[正文]` |
| 多图文字笔记 | 按图片顺序 OCR，保留不可读区域 | `[图 1]`、`[图 2]` |
| 正文很短、主要信息在图中 | 图片逐张优先，正文只作补充 | `[图 n]` |
| 视频笔记 | 可访问的字幕/语音 + 关键帧 + 屏幕文字 | `[视频 01:24]` |
| 批量收藏 / 喜欢 | 按真实瀑布流视觉顺序逐篇读取，形成可回链记录 | 每篇独立输出 |

默认输出是一份标准阅读记录：标题/类型/来源入口、原链接、快速读到的内容、内容还原、强信息清单、可以直接复用的内容、原始文本、信息缺口。

### 强信息清单

这部分是区别于普通总结器的重点。它不会凭空推荐工具，而是把笔记中真正出现过、且适合后续复用的内容按来源标记提取出来：

- 工具与资源：产品、模型、仓库、网站、模板、数据集或文件。
- Skill / 工作流：命名 Skill、Agent 分工、步骤链路和集成方法。
- 提示词与命令：尽量保留适用条件与上下文，避免只截取一句口号。
- 规则 / 指标 / 限制：版本、数字、前置条件、例外和作者提醒。

## 保真原则

- 先让内容可快速读，后做最小必要的阅读性整理；不追求“只剩结论”。
- 正文、图片 OCR、视频字幕/ASR、关键帧观察会分开标记，避免把推断写成原文。
- 名称、数字、步骤、条件、例外和作者结论不能在整理中丢失。
- 视频没有可访问音频、字幕或完整帧时，只报告实际覆盖到的片段，不伪造逐句转写。
- 批量收藏必须按页面视觉位置排序；不能把 DOM 数组顺序当成瀑布流顺序。

## 内容沉淀

阅读完成后可以选择不保存，也可以把记录沉淀为本地文档或飞书文档。推荐从**本地 CSV + Markdown**开始：Markdown 适合完整回顾，CSV 是可筛选、可导入其他 AI 工具或表格的索引。

```text
xhs-library/
├── index.csv                         # 可筛选的总索引
├── batches/2026-08-10-favorites.md   # 一次批量阅读的总览
└── notes/<note-id>.md                # 每篇笔记的完整阅读记录
```

`index.csv` 至少包含：`note_id`、标题、来源入口（收藏/喜欢/链接）、干净原链接、读取时间、笔记类型、强信息项、内容覆盖度和 Markdown 路径。这样你以后可以按“提到过 Codex 的笔记”“有 Prompt 的笔记”“我喜欢的旅行笔记”检索，也能一键回到小红书原笔记。

沉淀选项：

```text
沉淀=不保存                 # 默认
沉淀=本地Markdown           # 一份批量回顾文档
沉淀=本地CSV+Markdown       # 推荐：索引 + 单篇完整记录
沉淀=飞书文档 飞书目标=<文档或文件夹>
```

飞书写入是明确的外部操作：只有在你指定了目标文档或文件夹，并在当次明确要求“沉淀到飞书”时才执行。所有沉淀格式都只保存净化后的可回链地址；不会保存小红书页面中的会话参数、分享参数或登录数据。

## 能力边界

这是一个**用户授权浏览器内的阅读工作流**，不是爬虫、账号自动化工具或小红书非官方 API。

- 需要一个带有效登录态、并能由当前 Agent 读取的浏览器会话。
- OCR、字幕提取、语音转写与原始媒体下载能力取决于宿主 Agent、浏览器和用户允许使用的本地工具；没有这些能力时，Skill 会降级为可见正文与关键帧阅读，并说明缺口。
- 不保证平台页面、反爬规则或登录会话在任何时刻都可用。
- 不会绕过验证码、付费墙、访问控制、限流或版权保护。

## 临时文件与清理

处理图片或视频时，临时内容应放在独立临时根目录中的 `run-...` 子目录。完成验证后立即删除；若用户明确要求保留，则使用 24 小时或 3 天等 TTL，并在下一次运行时清扫过期目录。

仓库内的 [`cleanup-run.mjs`](./skills/read-xhs-notes/scripts/cleanup-run.mjs) 只会删除“指定临时根目录的直接 `run-...` 子目录”，拒绝根目录、父目录、嵌套目录和任意非 run 路径，避免清理扩大到用户文件。

## 仓库结构

```text
.
├── assets/readme/                 # GitHub README 的静态 SVG
└── skills/read-xhs-notes/
    ├── SKILL.md                   # 主工作流与触发说明
    ├── agents/openai.yaml          # Codex UI 元数据
    ├── references/                 # 隐私、媒体与输出约束
    └── scripts/                    # 卡片排序与受限清理工具
```

## 贡献

欢迎提交可复现的问题、页面变化样本、输出保真性改进和不同 Agent 的兼容性反馈。请不要在 Issue、PR、日志或示例中提交 Cookie、Token、密码、浏览器 Profile、真实私人收藏内容或任何其他凭据。

## License

[MIT](./LICENSE) © 2026 Shrek Wu

---

## English quick start

`read-xhs-notes` is a fast Xiaohongshu reading, batch-capture, and optional archival skill for Codex, Claude Code, and other Agent Skills-compatible tools. It reads an already authorized visible browser session; it never requests, exports, or stores login credentials.

```bash
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -g -a codex -y
```

Log in manually in your visible browser, open or explicitly share the target note, favorites, or likes scope, then ask the agent to use `$read-xhs-notes`. It captures page text, image OCR, accessible video evidence, and source-linked tools, skills, workflows, prompts, commands, and links. It can optionally archive standard records locally or to an explicitly authorized document destination. It does not bypass CAPTCHA, access controls, or platform restrictions.

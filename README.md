<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="read-xhs-notes: a source-grounded Xiaohongshu note reader for text, image, and video notes">
</p>

<p align="center">
  <a href="#安装"><strong>安装</strong></a> ·
  <a href="#第一次使用"><strong>第一次使用</strong></a> ·
  <a href="#登录态与隐私"><strong>登录态与隐私</strong></a> ·
  <a href="#能力边界"><strong>能力边界</strong></a>
</p>

`read-xhs-notes` 是一个面向 Codex、Claude Code 等 Agent Skills 兼容工具的小红书笔记阅读 Skill。它的目标不是把笔记粗暴压缩成几句话，而是先按来源顺序读取正文、图片文字和可访问的视频信息，再给出可核对的轻度整理。

它支持单条笔记、用户明确授权的“我的收藏”批量阅读、图片文字笔记，以及带字幕/可转写语音的视频笔记。评论、点赞和作者互动默认不进入内容分析。

<p align="center">
  <img src="./assets/readme/workflow.svg" width="100%" alt="从已授权的可见浏览器会话、内容盘点和媒体证据，到保真阅读输出的四步流程">
</p>

## 安装

本仓库遵循通用 Agent Skills 目录约定，`npx skills` 能发现并安装其中的 `read-xhs-notes`。

```bash
# 安装到当前项目，供 Codex 使用
npx skills add shrekwu/read-xhs-notes --skill read-xhs-notes -a codex

# 全局安装到 Codex，跳过交互确认
npx skills add shrekwu/read-xhs-notes --skill read-xhs-notes -g -a codex -y

# 安装到 Claude Code（同一份 Skill）
npx skills add shrekwu/read-xhs-notes --skill read-xhs-notes -g -a claude-code -y
```

也可以克隆仓库后，将 [`skills/read-xhs-notes`](./skills/read-xhs-notes) 放到你的 Agent 所识别的 skills 目录。不同 Agent 的浏览器连接方式不同；本 Skill 需要的是“能读取用户已授权、可见浏览器标签页”的能力，而不是某个特定浏览器品牌。

## 第一次使用

首次只需要用户在自己的浏览器中完成一次登录。之后，只要该浏览器会话仍有效，Agent 可以在用户明确授权的范围内读取笔记或收藏。

1. 在 Agent 能控制的可见浏览器中打开小红书。
2. 用户自己完成登录、设备验证或验证码。
3. 打开或明确分享目标笔记、收藏页或标签页。
4. 直接发出请求，例如：

```text
用 $read-xhs-notes 读取这条小红书笔记，轻度总结，原文=附上，缓存=即刻清理。

用 $read-xhs-notes 分析我“我的收藏”里最新 5 篇笔记。先按屏幕上的瀑布流顺序列出标题，再逐篇保真整理；模型=继承，推理=中，压缩=轻度。

用 $read-xhs-notes 读取这条视频笔记。优先给出字幕/口播和画面中的操作步骤；如果无法完整转写，请标出已覆盖的时间段和信息缺口。
```

`模型`、`推理`、`压缩`、`原文` 与 `缓存` 是相互独立的自然语言配置。若当前 Agent 支持子 Agent 和模型选择，Skill 只把已经脱敏的内容包交给分析阶段；它不会传递浏览器会话或任何凭据。

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
| 批量收藏 | 按真实瀑布流视觉顺序逐篇读取，再做横向归纳 | 每篇独立输出 |

默认输出顺序为：标题、作者、类型、这篇具体讲了什么、内容还原、核心观点、可以直接带走的内容、原始文本、信息缺口。

## 保真原则

- 先还原来源，后做总结；默认是轻度压缩，不追求“只剩结论”。
- 正文、图片 OCR、视频字幕/ASR、关键帧观察会分开标记，避免把推断写成原文。
- 名称、数字、步骤、条件、例外和作者结论不能在压缩中丢失。
- 视频没有可访问音频、字幕或完整帧时，只报告实际覆盖到的片段，不伪造逐句转写。
- 批量收藏必须按页面视觉位置排序；不能把 DOM 数组顺序当成瀑布流顺序。

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

`read-xhs-notes` is a source-grounded Xiaohongshu note-reading skill for Codex, Claude Code, and other Agent Skills-compatible tools. It reads an already authorized visible browser session; it never requests, exports, or stores login credentials.

```bash
npx skills add shrekwu/read-xhs-notes --skill read-xhs-notes -g -a codex -y
```

Log in manually in your visible browser, open or explicitly share the target note/favorites scope, then ask the agent to use `$read-xhs-notes`. It reconstructs page text, image OCR, and accessible video evidence separately before a light summary. It does not bypass CAPTCHA, access controls, or platform restrictions.

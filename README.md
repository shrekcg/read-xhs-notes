<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="read-xhs-notes：快速读取小红书笔记">
</p>

<p align="center">
  <a href="#核心能力"><strong>核心能力</strong></a> ·
  <a href="#第一次使用"><strong>第一次使用</strong></a> ·
  <a href="#单篇匿名读取"><strong>匿名读取</strong></a> ·
  <a href="#批量入口"><strong>批量入口</strong></a> ·
  <a href="#内容沉淀"><strong>内容沉淀</strong></a> ·
  <a href="#安全边界"><strong>安全边界</strong></a>
</p>

`read-xhs-notes` 是一个面向 Codex、Claude Code 等兼容 Agent Skills 工具的小红书快速阅读 Skill。

它把笔记正文、图片文字、视频字幕/口播和关键画面整理成可回看的阅读记录。默认保留原始顺序和证据标记，轻度整理时尽量接近原文，不把不确定内容补成确定事实。

<p align="center">
  <img src="./assets/readme/workflow.svg" width="100%" alt="从入口、内容识别到阅读记录的工作流">
</p>

## 核心能力

- 单条公开笔记优先走匿名解析，不依赖登录态、Cookie 或 Token。
- 支持 `xhslink.cn` 短链接和小红书公开长链接。
- 支持纯文字、图文、多图文字、视频和混合媒体笔记。
- 图片按顺序做 OCR；视频优先读取字幕/口播，再抽取有意义的关键帧。
- 支持用户明确授权的收藏、喜欢和当前可见卡片批量阅读。
- 结果区分原始正文、图片 OCR、视频文字稿和 AI 整理，便于回到原文核对。
- 可选沉淀为本地 Markdown、CSV + Markdown 或新建飞书文档。

## 安装

本仓库遵循通用 Agent Skills 目录约定：

```bash
# 安装到当前项目
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -a codex

# 全局安装到 Codex
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -g -a codex -y

# 安装到 Claude Code
npx skills add shrekcg/read-xhs-notes --skill read-xhs-notes -g -a claude-code -y
```

也可以克隆仓库，再将 [`skills/read-xhs-notes`](./skills/read-xhs-notes) 放入 Agent 能识别的 skills 目录。

## 第一次使用

单条公开笔记可以直接提供链接，不必先登录。只有读取“我的收藏”或“喜欢”等私有列表时，才需要用户在 Agent 可连接的可见浏览器中自行登录，并明确打开对应页面。

```text
用 $read-xhs-notes 阅读这条小红书笔记，整理=轻度，原文=附上。

用 $read-xhs-notes 读取我收藏的最新 5 篇，整理=高度；先按瀑布流顺序列出标题，再逐篇输出。

用 $read-xhs-notes 读取这条视频笔记，整理=中度；保留已覆盖的视频时间段和无法识别的部分。
```

可独立设置 `入口`、`数量`、`模型`、`推理`、`整理`、`原文`、`沉淀`、`输出目录` 和 `缓存`。默认是：`整理=中度`、`原文=自动`、`沉淀=不保存`、`缓存=即刻清理`。

## 单篇匿名读取

单条公开链接默认先走本地脚本 [`anonymous-note-resolver.mjs`](./skills/read-xhs-notes/scripts/anonymous-note-resolver.mjs)。它只请求用户给出的这一条链接，使用 `credentials: omit`，从公开页面内嵌状态中提取标题、正文、图片和视频地址。

解析器的行为是：

1. 还原 `xhslink.cn` 短链接，并限制重定向只能留在小红书域名内。
2. 读取公开页面中的笔记状态数据，不访问 Cookie、Token、Local Storage 或浏览器 Profile。
3. 输出去除分享参数的可回链地址，以及正文、媒体地址和读取状态。
4. 匿名页面没有笔记主体、出现登录墙、验证码或访问限制时直接失败，不偷偷切换到登录态发请求。

本地只读验证：

```bash
node skills/read-xhs-notes/scripts/anonymous-note-resolver.mjs <公开小红书链接>
```

脚本只负责页面数据解析。图片 OCR、视频字幕/语音、关键帧和轻度总结仍由 Skill 的内容识别流程完成。更详细的域名、大小、重定向和失败边界见 [`references/anonymous-resolver.md`](./skills/read-xhs-notes/references/anonymous-resolver.md)。

## 批量入口

| 入口 | 适用范围 | 需要什么 |
| --- | --- | --- |
| `入口=链接` | 单条笔记 | 公开链接即可，优先匿名读取 |
| `入口=链接列表` | 用户提供的一组链接 | 不依赖个人列表 |
| `入口=收藏` | 我的收藏中的笔记 | 用户明确授权的 `tab=fav&subTab=note` 页面 |
| `入口=喜欢` | 我的喜欢中的笔记 | 用户明确授权的 `tab=liked&subTab=note` 页面 |
| `入口=可见卡片` | 当前页面已渲染的卡片 | 用户手动筛选并授权当前页面 |

收藏或喜欢列表只由浏览器取得卡片和笔记 ID，卡片按屏幕位置排序：先上后下，同一行从左到右；不得使用 DOM 数组顺序。每篇内容仍优先切到匿名解析，匿名被拒绝时才在已授权浏览器中补读并标记读取路径。

## 整理深度与输出

| 深度 | 适用场景 | 处理方式 |
| --- | --- | --- |
| `轻度` | 想接近原文地快速读完 | 最小分段和衔接，保留顺序、细节、例子与条件 |
| `中度` | 日常单篇阅读 | 归并主题、步骤和结论，保留内容还原 |
| `高度` | 批量初筛 | 突出观点、步骤、限制和值得回看的点，仍保留来源标记 |

每篇记录通常包括：

1. 标题、类型、来源入口、整理深度和读取状态；
2. 去除分享参数的原链接；
3. 这篇笔记具体讲了什么；
4. 按正文、图片和视频顺序的内容还原；
5. 原始正文、图片 OCR、视频文字稿的分开标注；
6. 识别说明、覆盖范围和信息缺口。

视频没有可访问字幕或音轨时，不会声称已经完整转写，只报告实际覆盖的时间段和关键画面。

## 内容沉淀

默认不保存。需要回顾时可选择：

```text
沉淀=本地Markdown
沉淀=本地CSV+Markdown 输出目录=~/Documents/xhs-library
沉淀=飞书文档 飞书目标=<文件夹 URL>
```

本地索引建议包含笔记 ID、标题、来源入口、干净原链接、读取时间、类型、整理深度、读取状态和覆盖度。飞书只在当次请求明确指定时执行，并为每个批次新建文档；不会追加或覆盖既有飞书文档。

写入飞书前，运行环境需要已经完成用户身份授权并具备创建文档权限。Skill 不会把失败的授权或写入描述成成功。

## 安全边界

项目不收集、索取、读取、导出或保存小红书登录信息，包括 Cookie、Token、密码、二维码登录数据、本地存储、浏览器 Profile 和扩展数据。

- 不绕过验证码、登录挑战、访问控制、限流或安全页。
- 不使用代理池、UA 轮换、签名逆向、账号池或批量后台抓取。
- 匿名解析只处理用户给出的公开单篇链接；收藏和喜欢列表必须单独授权。
- 页面正文和媒体属于用户交给当前 Agent 的内容。当前 Agent 及其模型会按照宿主服务的隐私规则处理；未经用户对具体目的地的明确授权，不会额外发送到当前 Agent 运行环境之外的 OCR、ASR、模型、文档或知识库服务。
- 图片、视频和中间文件放在单次运行目录，完成核对后清理。可用 [`cleanup-run.mjs`](./skills/read-xhs-notes/scripts/cleanup-run.mjs) 安全清理直接的 `run-...` 子目录。

单篇匿名解析不是官方 API，也不承诺永久可用。小红书页面结构变化、匿名访问限制或媒体防盗链都可能导致失败；失败时 Skill 会停止并报告原因。

## 参考资料

- 授权浏览器、登录失效和私有列表边界：[`session-and-privacy.md`](./skills/read-xhs-notes/references/session-and-privacy.md)
- 匿名单篇解析：[`anonymous-resolver.md`](./skills/read-xhs-notes/references/anonymous-resolver.md)
- 图片、视频和临时文件路由：[`media-routing.md`](./skills/read-xhs-notes/references/media-routing.md)
- 输出结构和来源标记：[`output-contract.md`](./skills/read-xhs-notes/references/output-contract.md)
- 本地/飞书沉淀：[`persistence.md`](./skills/read-xhs-notes/references/persistence.md)
- 批量验收清单：[`quality-checklist.md`](./skills/read-xhs-notes/references/quality-checklist.md)
- 自动化与合规边界：[`automation-and-compliance.md`](./skills/read-xhs-notes/references/automation-and-compliance.md)

## 本地开发与验证

```bash
npm test
.venv/bin/python /Users/Wcg/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/read-xhs-notes
```

Node.js 要求 `>=18`，测试使用 Node.js 内置测试运行器，不需要额外的第三方运行时依赖。

目录结构：

```text
skills/read-xhs-notes/
├── SKILL.md
├── agents/openai.yaml
├── references/                  # 授权、匿名解析、媒体、输出与沉淀规则
└── scripts/
    ├── anonymous-note-resolver.mjs
    ├── sanitize-note-url.mjs
    ├── order-cards.mjs
    └── cleanup-run.mjs
```

欢迎提交可复现的问题、页面变化样本和内容保真改进。请勿在 Issue、PR、日志或示例中提交 Cookie、Token、密码、浏览器 Profile、真实私人收藏内容或其他凭据。

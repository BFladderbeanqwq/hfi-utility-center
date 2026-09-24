# HFI Utility Center 前端设计记录

核验日期：2026-09-24。目标：让学生尽快完成场地预约、查询和查看使用安排，同时让管理人员清楚地处理申请。

## 参考网页与权威性

以下 10 个参考保留了此前的浏览记录与截图；本轮重新检查截图、官方奖项提取记录及两份获奖版本存档。依据是 Awwwards 官方评审记录，而不是转载的「最佳网页」榜单。SOTD（Site of the Day）与 Honorable Mention 是不同级别，下面分别标明。「公认优秀」在本文中指获得专业设计评审认可，不意味着所有人对审美达成一致。奖项属于记录中的历史版本，不能自动套用到今天更新后的官网。

| 网页                                                   | 权威性来源与版本                                                                                                                                                            | 视觉观察                                         | 在本项目中的取舍                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| [Studio Size](https://studio-size.com/)                | [Awwwards Honorable Mention，2020-04-16](https://www.awwwards.com/sites/studio-size)；另见[官方工作室档案](https://www.awwwards.com/studio-size.com/)，列有 2024-07-19 SOTD | 当前首页用紧凑无衬线标题与大面积作品形成尺度反差 | 借鉴标题与功能区的尺度层级；不使用首页视频                     |
| [Pangram Pangram Foundry](https://pangrampangram.com/) | [Awwwards SOTD，2021-11-11](https://www.awwwards.com/sites/pangram-pangram-foundry)                                                                                         | 字体本身是视觉主体，导航克制，字重对比明确       | 使用可变字体塑造工具名称；不复制其商业字体或图片               |
| [ToyFight](https://toyfight.co/)                       | [Awwwards SOTD，2016-11-09](https://www.awwwards.com/sites/toyfight)                                                                                                        | 当前页面以特殊字形、词组位置和留白形成品牌个性   | 品牌字标独立设计；不采用拖慢工具访问的入场动画                 |
| [Exat — Hot Type](https://exat.hottype.co/)            | [Awwwards SOTD，2025-04-03](https://www.awwwards.com/sites/exat-typeface)                                                                                                   | 大字、纯色和极少的界面元素构成鲜明识别           | 让功能名称本身承担视觉识别；删除原先的蓝色大卡片             |
| [Seasoned — Koto](https://seasoned.koto.studio/)       | [Awwwards SOTD，2025-03-21](https://www.awwwards.com/sites/seasoned)                                                                                                        | 字体混排与食物视觉紧密关联，内容主题决定形式     | 校园工具采用清楚的服务名称，避免把「设计感」变成无关装饰       |
| [Studio Alphonse](https://www.studioalphonse.com/)     | [Awwwards SOTD，2025-07-19](https://www.awwwards.com/sites/studio-alphonse)                                                                                                 | 紧凑的宽体标题、短句断行、安静背景               | 功能名称保持完整，窄屏缩小字号；不复制装饰线与电影式加载 |
| [RXK Studio](https://rxkstudio.com/)                   | [Awwwards SOTD，2024-05-30](https://www.awwwards.com/sites/rxk-studio)                                                                                                      | 粗体紧排、功能导航与主信息之间明确的尺寸落差     | 黑体操作区与宋体主标题形成对比，正文保持正常字距                   |
| [kurzform.](https://www.kurzform.studio/)              | [Awwwards Honorable Mention，2023-08-23](https://www.awwwards.com/sites/kurzform-r-design-brandingstudio)                                                                   | 不对称布局、侧向留白与少量按钮                   | 主入口横向展开，下方查询与看板不等分排列                       |
| [Locomotive](https://locomotive.ca/)                   | [Awwwards SOTD，2014-07-23](https://www.awwwards.com/sites/locomotive)                                                                                                      | 获奖存档中的类别导航使用背景色与空间关系组织内容 | 使用面色和间距表达分组，不增加装饰性分隔线                     |
| [Cartelle Interactive Studio](https://cartelle.nl/)    | [Awwwards SOTD，2012-10-07](https://www.awwwards.com/sites/cartelle-interactive-studio)                                                                                     | 获奖存档把工作导航、项目标题和主画面组合在一起   | 功能名称与操作相邻；查询表单直接出现在首页                     |

浏览方法：前八项检查了当前官网，另外核验其官方获奖记录。Locomotive 当前站触发访问验证，Cartelle 当前站首屏为黑色动态画面，因此这两项采用 Awwwards 保存的获奖版本截图进行视觉研究，并未声称看到了受限页面。Fine Thought 的官网未能打开，**没有计入十项**。

本地研究材料在 `output/playwright/reference-*.png`、`reference-awards.txt`、`reference-inspection*.txt`。这些是验收过程文件，已加入 Git 忽略；正式参考链接和结论保留在本文。

## 设计方案与自我审查

本轮放弃蓝色巨型卡片，采用「文字即入口」：校园场地名称直接成为可点击的大字，下面立即提供查询表单与场地看板。不增加宣传横幅、装饰编号、分隔横线、竖线、假统计或常驻动画。

```text
hfi. Utility Center                预约场地  查询预约  场地看板  管理

预约场地                         ← 宋体功能名称，可点击
教室、活动场地，按你的时间安排。                       [开始预约]

查询预约                                  场地看板
姓名、场地或预约用途                       查看各场地的使用安排
[输入关键词                 ] [查询]
查看所有即将到来的预约

公告（仅后端存在启用公告时）
```

所有内容左对齐。首页预约区不使用容器边框；查询的细边框标识输入控件，看板的淡紫背景标识整块可点击区域。预约与查询页使用同一套紫色交互状态，标题为宋体，数据与控件为黑体。审核状态仍使用有语义的成功、警告、错误颜色和文字。

自我审查：拒绝以换色保留旧的巨大卡片；删除重复的查询说明，删除主入口图标标签，删除成功页伪元素装饰。保留姓名输入标签、预约步骤、真实公告、操作状态，因为它们有明确用途。没有使用营销页常见的渐变、滚动动画或图片素材。表单控件边框和键盘焦点框承担操作意义。

## 字体系统

字体通过 Fontsource npm 包自托管，使用其随包分发的 SIL Open Font License，不依赖 Google Fonts 在线服务。中文字体按 unicode-range 分片，由浏览器按字符加载。

- **Noto Serif SC Variable**：首页预约入口和公共内页标题。宋体的笔画粗细对比带来校园出版物的气质；不将它用于输入框或密集数据。
- **Noto Sans SC Variable**：中文正文、表单和导航。字号不以装饰性小字制造层次。
- **Archivo Variable**：品牌、英文、数字。英文与中文分别利用自身字形特点，不强行把字母挤压为汉字宽度。
- 正文回退：Archivo → Noto Sans SC → PingFang SC → Microsoft YaHei → sans-serif。
- 标题回退：Noto Serif SC → Songti SC → serif。禁止伪粗体，设置 `font-synthesis: none`。

| 用途 | 字号 | 字重 / 行高 | 排版原则 |
| --- | --- | --- | --- |
| 首页预约入口 | 桌面 76–154px；移动 56–98px | 550 / 1.3 | 宋体，完整功能名称，左对齐 |
| 查询与看板标题 | 桌面 30px；移动 26px | 550 / 1.4 | 黑体，低于主入口的视觉层级 |
| 内页一级标题 | 28–42px | 650 / 1.3 | 宋体，保持页面识别一致 |
| 表单与正文 | 16–18px | 400 / 1.6 | 常规字距，可读优先 |
| 标签与状态 | 14–16px | 400–600 / 1.6 | 只提供操作信息 |

配色：背景 `#FAF9FC`、正文 `#38243D`、交互主色 `#673A70`、表面 `#FFFFFF`、辅助区域 `#EEE6F2`、次要文字 `#716477`。深色模式独立使用暗紫底与浅紫交互色；不是反转截图。

## 组件与业务范围

- Next.js App Router + React + Tailwind CSS 4 + **shadcn/ui（Radix）**。
- 使用官方 CLI 初始化 `components.json` 并安装组件源码。Button、Input、Textarea、Field、Checkbox、Calendar、Dialog、AlertDialog、Sheet、Table、Pagination、Badge 等均置于 `components/ui`，不是套用 shadcn 名称的 Astryx 包装层。
- 删除 Astryx 依赖及原 `components/astryx.tsx`。全站页面直接导入 shadcn 组件。
- 用 Radix Dialog / Sheet 的焦点管理、Esc 关闭和键盘交互替换手写弹窗；不使用 CSS 模拟模态框。
- 延续中英切换、主题偏好、预约五步流程、场地规则、审核与管理接口。
- 首页查询使用现有 `keyword` 参数，并设 `sort=sequence` 以便查询历史记录；「即将到来的预约」链接仍使用原有时间排序。
- 公告显示为非阻塞入口，用户主动打开；无有效公告时不展示空面板。
- 查询页面区分网络失败与零结果，提供重试。预约请求失败后保留表单并展示错误。

后端核验来源：[dev 分支 README](https://github.com/HFI-UC/hfi-utility-center-backend/blob/dev/README.md)、[OpenAPI](https://github.com/HFI-UC/hfi-utility-center-backend/blob/dev/openapi.yaml)。后端为 PHP / Slim / MySQL；前端保持 `/campus/list`、`/class/list`、`/room/list`、`/reservation/availability`、`/reservation/create`、`/reservation/get`、`/announcement/current`、管理认证与审核接口不变。

## 项目 skills

安装目录为 `.agents/skills/`，安装记录为 `skills-lock.json`。

- `frontend-design`：原有项目 skill，本轮读取并用于设计与自我审查。
- `shadcn`：本轮通过 `npx skills add shadcn/ui --skill shadcn --agent codex --yes` 重新安装官方 skill，使用 CLI 核实当前组件与 Button/Input 文档。
- `web-design-guidelines`：本轮新增 [Vercel 官方界面检查 skill](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines)，通过官方 skill-installer 下载后以 skills CLI 登记安装，检查标签、键盘操作、响应式和字体加载。
- `agent-browser`、`clean-refactor`、`cleanup-useeffect`、`slop-design`：复用并读取现有项目技能，分别用于浏览器验收、原位重构和状态设计。

新安装技能将在下一轮自动发现；本轮已直接读取其文档并执行。没有覆盖原先的 frontend-design 定制规则。

## 本轮验证

后端 `dev` 分支已克隆并检查 README 与 OpenAPI，核验提交 `948799cdeaa33cab7b6509efe9f4e379acf80e2e`。本轮调整呈现，不修改预约或审核的接口契约。

本轮 `npm run lint`、`npm run typecheck`、`npm run format:check` 和 `npm run build` 通过；生产构建生成 16 个页面。

浏览器检查了 1440px 桌面、390px 移动端、320px 英文深色首页、预约班级选择到场地选择、搜索关键词跳转、场地看板和登录页。查询关键词 meeting 实际生成 `?sort=sequence&keyword=meeting`；320px 首页 document scrollWidth 与 clientWidth 均为 305px（其余 15px 为浏览器滚动条），无横向溢出。

修复了窄屏步骤条被旧规则改成五行、预约表单双层内边距、班级名称被挤为逐字换行、搜索框缺少可访问名称等问题。

本轮未提交真实预约，也未使用管理员凭据执行审批；真实提交、邮件送达和管理员完整写入链路未复测。此前的验收结果不视为本轮结果。浏览器截图保存在 `output/redesign-*.png`；研究截图保留在 `output/playwright/reference-*.png`。

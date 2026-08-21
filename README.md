<p align="center">
  <strong>会话搜索开关：一个开关，让你从原有会话标题搜索出发，依据你输入的关键词与会话总结内容关键词，定位历史会话</strong>
</p>
<p align="center">
  <strong>中文</strong> · <a href="README.en.md">English</a>
</p>
<p align="center">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-263146?style=flat-square"></a>
  <img alt="Public" src="https://img.shields.io/badge/status-public-7da1de?style=flat-square">
</p>

# dsh-session-search-toggle

> **一个开关**，让你从原有会话标题搜索框出发，切换为「标题搜索」或「内容搜索」：输入关键词，按**会话标题**即时过滤，或按**会话总结/消息内容关键词**跨会话定位历史会话——不用再翻找某条对话到底在哪个会话里。
>
> 实现上直接**复用 DSH 自带的会话全文检索**，界面改动极小：侧边栏底部新增一个 **"搜索"** 入口，浮层面板里一键在 **标题 ↔ 内容** 之间切换。

无需修改 dsh 源码、无需提 PR：`dsh plugin` 命令组装 + bundle patch 装配的 cordis 客户端 + 插件宿主半。

## 它能做什么

- **标题 ↔ 内容，一个开关**：同一个搜索框，按「标题」过滤会话标题/工作目录子串，即时命中的历史会话；按「内容」则走 DSH 自带的全文索引，搜会话里的**总结内容关键词、用户问题、AI 回复**——用于"我记得某次聊过某个东西，但不记得是哪个会话"。
- **入口最小侵入**：官方侧边栏的搜索框是固定 slot、外部插件无法替换；本插件在侧边栏**底部新增独立入口**（`sidebar.footer.action`），二者并存、互不干扰，对界面改动最小。
- **内容按会话聚合**：内容搜索结果每个会话一行（会话标题 + 最强命中片段 + 命中的消息类型标签），点击即打开该会话，不刷屏逐条堆消息。
- **命中类型可辨**：内容结果贴有 **用户 / 回复** 标签，能一眼看出命中的是提问还是回答。
- **点击直达**：搜索结果点击跳转打开对应会话，定位到命中内容所在上下文（经 `sessions.open`）。

## 界面预览

```text
┌─ Sidebar ──────────────────────────────────┐
│ ▸ 会话搜索        （sidebar.footer.action）  │
│        ┌─ 搜索面板（浮层）──────────────────┐  │
│        │ [标题|内容]   [🔍 搜索会话…]       │  │
│        │ ┌─ 结果 ──────────────────────┐  │  │
│        │ │ 📄 会话标题一              │  │  │
│        │ │    命中片段…（snippet）     │  │  │
│        │ │ 📄 会话标题二 · 回复         │  │  │
│        │ │    "……（总结内容关键词）……" │  │  │
│        │ └────────────────────────────┘  │  │
│        └─────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 内容搜索如何生效

内容模式复用的是 **DSH 官方自带的全文索引**，因此：

1. **必须先激活会话内容搜索**（默认关闭）。DSH 官方 bundle 里 `session-query-sqlite` 的 `openAt` 默认是 `never`（全文索引不建）；需要在你 profile 的 `cordis.patch.yml` 或 overlay 里手动覆盖为启用，然后重启 DSH web：

   ```yaml
   - id: session-query-sqlite
     config:
       path: ':memory:'               # 或可持久化的绝对路径（重启不重建）
       openAt: first-search           # 或 startup
   ```

2. 若你的发行版在 **通用设置 → 默认搜索模式** 里提供了切换入口，可将默认搜索模式设为「内容」并勾选**激活内容搜索**；此后内容模式即为默认、开箱即搜。未开启时本插件的内容模式会给出具体配置指引，标题模式不受影响。

### ⏳ 懒加载：首次搜索要等索引

历史会话内容搜索是**懒索引**的——`openAt: first-search` 时，直到**第一次发起内容搜索**才开始建索引；每次搜索前再做**增量 reconcile**（只重建有变化的会话）。

- 大语料下，**首次**内容搜索会明显变慢，甚至短暂返回不全/暂无结果——这是后台索引仍在构建，稍等片刻、再次搜索即可正确命中。
- 索引建好之后，后续搜索很快；数据不变化时不会重复重建。

所以，如果你启用后第一次搜不到历史内容，**请稍等索引构建完成再搜**，而不是当成故障。

## 安装

```sh
# 方式一：从 npm 安装（推荐）
#   （profile 是 pnpm workspace root，add 需带 -w 参数）
dsh plugin --profile web add dsh-session-search-toggle -w

# 方式二：git 或本地路径组装
# dsh plugin --profile web add github:drscrewdriver/dsh-session-search-toggle#release-v0.1.0   # 稳定版
# dsh plugin --profile web add /absolute/path/to/dsh-session-search-toggle -w
#    （git 安装后需在 profile 的 node_modules 内现场构建：npm install --legacy-peer-deps && npm run build）

# 确认组合树包含新行
dsh web --dump-config | grep -B1 -A2 'session-search-toggle'

# 重启 dsh web —— 必做！运行中实例不热载 bundle 层
dsh web
# 或用随包脚本
bash ~/.dsh/profiles/web/node_modules/dsh-session-search-toggle/restart-dsh-web.sh
```

装完侧边栏底部出现 **"搜索"** 按钮，点击即可在标题 / 内容之间切换搜索历史会话。

## 开发

```sh
pnpm install            # 含 @deepseek-ai client 包链 + tsdown/tsc
pnpm typecheck          # tsc --noEmit
pnpm build              # tsc(lib/types) + tsdown(lib/index.mjs + lib/client.js)
```

### 工作区结构

```
src/
├── index.ts            # 宿主半（node）：/session-search-toggle/api 路由
└── client/
    └── index.ts        # 浏览器半：sidebar.footer.action 入口 + 浮层面板（标题/内容切换）
```

- **宿主半**：注册 fenced HTTP 路由 `/session-search-toggle/api`（`list-sessions` / `content-search`），浏览器信任围栏与 DSH `/api` 网关一致（loopback Host 或 trustedHosts，拒绝 cross-site）。
- **复用官方检索而非自建库**：与 dsh-history 一致，直接经 `sessionQuery` 服务读 live-preferred 语料库，不改任何官方源码、不建派生库。
- **构建链**：tsdown 复制 harness `packages/client/tsdown.client.ts` 语义（`__ModuleLoader__.load` banner、平台模块 external 表、bundle purity gate）。
- **lib/ 提交进仓库**：GitHub 直装靠已提交的构建产物运行（dsh 从 git 安装不跑 prepare），`.gitignore` 不忽略 `lib/`。

## 分支说明

| 分支 | 用途 |
|---|---|
| `master` | 稳定基线（标题 ↔ 内容切换，会话聚合） |
| `feat/type-filter-search` | 开发分支（内容类型筛选 + 索引可用性探测） |
| `release-v0.1.0` | 从已验证开发状态派生的**稳定可装版本**，含 lib/ 构建产物 |

> 本项目原名为 `dsh-switch-search`，现迁至 `dsh-session-search-toggle`（npm 包名/插件名同步更新）。旧包名仅作历史遗留，安装请使用新名。

## 与官方侧边栏搜索的关系

- 官方侧边栏的搜索框在 `sidebar.workspaces`（single slot），外部插件**无法替换**；本插件在侧边栏底部**新增独立入口** `sidebar.footer.action`，二者并存、互不干扰。
- 本插件只是**在标题搜索之外多提供一条内容检索路径**——把"在哪个会话里说过这事"从翻找变成一次关键词搜索。

## 兼容性与隐私

- 需要已安装 DeepSeek Harness 并使用 web profile；数据全部经 DSH 现成 `sessionQuery` 服务（live-preferred 语料库），**不改任何官方源码、不建派生库**。
- 浮层当前模式（标题/内容）与输入仅在浏览器会话内存中；不读取、不上传会话内容以外的数据。
- 宿主/客户端契约类型在 `src/*.ts` 本地结构声明（npm 上 dsh client 包链不完整），构建时以 harness 源码核实为准。

## License

MIT
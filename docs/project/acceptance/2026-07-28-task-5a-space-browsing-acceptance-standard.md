# Task 5A 空间回看基础构建与验收标准

日期：2026-07-28  
状态：正式构建合同与验收门槛  
适用范围：M0 Task 5.1–5.4；页面 02、04、08

## 1. 目标与职责

Task 5A 是正式小程序第一次装配产品页面。它先建立创建空间后的稳定落点和再次进入时的回看路径：

```text
02 我的记忆空间
→ 04 Ta 的空间首页
→ 08 全部记忆
```

本文件同时规定：

- Builder 应按什么顺序构建；
- 每一步允许修改什么；
- 哪些状态必须测试；
- 微信页面与视觉证据如何取得；
- Reviewer 如何反证；
- 什么情况下必须退回。

本文件不是 Task 2–4 的重新验收报告。上游只执行轻量前置检查；若接入时发现明显接口错误或需求冲突，应暂停并提供证据，不得在页面中绕过。

相关真源：

- [AI 开发协作与验收协议](../rule/2026-07-27-ai-development-collaboration-protocol.md)
- [M0 工程骨架实施计划](../../product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md)
- [M0 工程骨架与设计系统决策记录](../../product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md)
- [M0 设计系统工程执行规格](../../product/specs/2026-07-24-m0-design-system-engineering-spec.md)
- [M0 页面视觉基准](../../product/assets/m0-page-baselines/README.md)
- [Task 4 验收标准](2026-07-28-task-4-state-routing-devtools-acceptance-standard.md)

## 2. 范围边界

### 2.1 本批次负责

- 02 我的记忆空间；
- 04 Ta 的空间首页；
- 08 全部记忆；
- 空间卡片与记忆条目所需纯视图模型；
- 空间、记忆、草稿和照片失效状态的只读组合；
- 02→04→08 的真实导航与返回；
- 02、04、08 的微信标准截图和视觉复核；
- `verify:task5a`。

### 2.2 本批次不负责

- 01 首次说明、03 创建空间和 13 隐私说明；
- 05 记录入口、09 记忆详情和 12 空间设置；
- 写入记忆、编辑、删除、AI、CloudBase；
- 新建共享视觉组件；
- 修改 Task 2 组件公开接口；
- 为后续页面创建占位路由或空白页面。

### 2.3 后续入口合同

04 和 08 会显示指向后续 Task 的入口。Task 5A 只验证：

| 当前入口 | 正式目标 | 本批次证据 |
|---|---|---|
| 02 创建空间 | `/pages/space-create/index` | 点击意图和安全 URL |
| 04 留下一段 | `/pages/record-entry/index?spaceId=...` | 点击意图和安全 URL |
| 04 设置 | `/pages/space-settings/index?spaceId=...` | 点击意图和安全 URL |
| 04/08 记忆条目 | `/pages/memory-detail/index?memoryId=...` | 点击意图、来源白名单与安全 URL |

目标页未由本批次创建，不得：

- 制作“开发中”占位页；
- 使用无响应按钮；
- 把完整实体塞进 URL；
- 声称这些后续流程已经可用。

页面组件测试必须证明点击交给 NavigationAdapter；对应目标页的真实往返在所属 Task 验收。

## 3. 文件地图

### 3.1 允许修改

```text
apps/pet-memory-miniapp/
├─ package.json
├─ src/
│  ├─ pages.json
│  ├─ adapters/navigation.ts
│  ├─ pages/
│  │  ├─ spaces/index.vue
│  │  ├─ space-home/index.vue
│  │  └─ memories/index.vue
│  └─ features/memories/memory-summary.ts
└─ tests/
   ├─ unit/memory-summary.test.ts
   └─ components/
      ├─ spaces-page.test.ts
      ├─ space-home-page.test.ts
      └─ memories-page.test.ts
```

若需要修改清单外文件，Builder 必须先说明原因、影响和验证方法。不得借 Task 5A 重构 Task 2–4。

### 3.2 消费接口

- `useAppStore.bootstrapStatus`；
- `useMemoryStore.sortedSpaces`；
- `recentMemories(spaceId)`；
- `allMemories(spaceId)`；
- `draftForSpace(spaceId)`；
- `findSpace / findMemory / findAsset`；
- `NavigationAdapter`；
- `PageShell`、`PrimaryButton`、`TextAction`、`DraftNotice`、`MemoryList`、`MemoryEntry`、`MissingContentState`。

### 3.3 产生接口

`memory-summary.ts` 应向页面提供纯视图模型，不允许组件自己查询 Store：

```ts
export interface SpaceSummaryViewModel {
  id: string
  name: string
  coverUri?: string
  latestSummary: string
  dateLabel?: string
  hasMemories: boolean
}

export function buildSpaceSummary(
  space: MemorySpace,
  memories: readonly MemoryItem[],
  assets: readonly LocalAsset[],
): SpaceSummaryViewModel

export function buildMemoryEntry(
  memory: MemoryItem,
  assets: readonly LocalAsset[],
): MemoryEntryViewModel
```

等价内部命名可以调整，但字段语义、纯函数边界和 Task 2 `MemoryEntryViewModel` 必须保持一致。

## 4. 状态、证据与完成权限

### 4.1 状态

```text
not-started
→ implementing
→ self-verified
→ reviewer-accepted
```

发现问题：

```text
self-verified
→ needs-fix
→ implementing
```

Builder 不能自行标记 `reviewer-accepted`，也不能把整个 Task 5 写成完成。

### 4.2 证据

| 证据 | 内容 |
|---|---|
| `M` | 纯函数、状态、路由、组件行为、类型检查和构建 |
| `A` | 微信产物、三张页面截图、对照图和禁止项扫描 |
| `H` | 微信运行、滚动、安全区、照片裁切和整体视觉 |

### 4.3 通过定义

Task 5A 只有满足以下条件才可通过：

- 本文件全部强制门通过；
- 02、04、08 均使用正确页面模板和正式 Store 数据；
- loading、error、empty、missing、photo-expired 与完整状态不混淆；
- 02→04→08 真实可走通并正确返回；
- 后续入口只形成安全合同，没有占位页和虚假能力；
- 三张微信截图与对应基准完成对照；
- P0–P2 为 0；
- `verify:task5a`、全量测试、类型检查和生产构建通过；
- Reviewer 至少完成规定反证；
- 未提前更新 Task 5 总完成状态。

## 5. Task 5A-0：轻量前置门

本步骤不是重新验收 Task 2–4，只证明页面施工地基可用。

### 构建动作

- [ ] 运行 `npm run verify:task3`
- [ ] 运行 `npm run verify:task4`
- [ ] 运行 `npm run build:mp-weixin`
- [ ] 确认 complete 样本包含团团、豆豆、正式记忆和草稿
- [ ] 确认 DevPanel 可以切换 empty/complete
- [ ] 确认 PageShell、DraftNotice、MemoryList、MissingContentState 能在微信构建路径中引用

### 验收门

| ID | 门槛 |
|---|---|
| `T5A-M01` | Task 3/4 单一验证入口退出码为 0 |
| `T5A-M02` | 微信生产构建退出码为 0 |
| `T5A-M03` | complete/empty 样本可重复切换且 Store 状态一致 |
| `T5A-M04` | 页面所需共享组件公开接口与正式规格一致 |
| `T5A-M05` | 现有 `NavigationAdapter` 可以修改正式 spaces 路径而不改变接口 |
| `T5A-A01` | 未发现必须先改产品、Repository 或共享组件合同的阻断冲突 |

任一失败时停止页面施工，先定位上游问题；不得在页面中复制 Store、绕过 Repository 或重做组件。

## 6. Task 5A-1：视图模型纯函数

### 6.1 先写失败测试

- [ ] 创建 `tests/unit/memory-summary.test.ts`
- [ ] 写“原话优先于 AI 候选稿”测试
- [ ] 写“无正式记忆状态”测试
- [ ] 写“available 第一张资产作为缩略图”测试
- [ ] 写“expired/悬空资产不输出 URI”测试
- [ ] 写“不同空间资产不能误用”测试
- [ ] 写“不修改输入数组”测试
- [ ] 运行定向测试并确认因函数尚未存在或行为缺失而失败

### 6.2 实现动作

- [ ] 创建 `src/features/memories/memory-summary.ts`
- [ ] 只消费传入实体，不导入 Pinia、Repository、uni 或组件实例
- [ ] 使用用户 `originalText` 构造摘要
- [ ] 空原话但有照片时使用正式产品允许的中性摘要，不使用 AI 文案
- [ ] 从 `assetIds` 顺序中选择第一张 available 且 owner 正确的资产
- [ ] 日期格式化使用固定时间输入，不读取 `Date.now()`
- [ ] 返回新对象，不修改实体或数组
- [ ] 重跑定向测试

### 6.3 验收门

| ID | 机器门 |
|---|---|
| `T5A-M06` | 摘要只取 `originalText`，不以 `aiCandidateText` 替代 |
| `T5A-M07` | 纯函数不自行截断或改写原话内容 |
| `T5A-M08` | 只有 available 且归属正确的资产能产生 `thumbnailUri` |
| `T5A-M09` | 无可用照片时不保留空缩略图槽所需字段 |
| `T5A-M10` | 悬空、跨空间和 expired 资产不会输出破图 URI |
| `T5A-M11` | 输入实体与数组不被修改 |
| `T5A-M12` | 同一固定输入重复调用结果一致 |
| `T5A-M13` | 纯函数不依赖 Store、Repository、页面或 uni |
| `T5A-A02` | 测试夹具不包含真实用户内容和本机照片路径 |

### 6.4 反证

Reviewer 至少临时执行一项：

- 让摘要优先 AI 候选稿，测试必须失败；
- 让 expired 资产继续输出 URI，测试必须失败；
- 原地排序 memories，纯函数测试必须失败。

## 7. Task 5A-2：注册正式路由和 02 我的记忆空间

### 7.1 路由施工

- [ ] 在 `pages.json` 注册 `/pages/spaces/index`
- [ ] 注册 `/pages/space-home/index`
- [ ] 注册 `/pages/memories/index`
- [ ] 暂时保留 Task 1 临时首页，直到 Task 5B 的 01 可构建
- [ ] 修改 `navigation.ts`，把 spaces 路径从 `/pages/index/index` 改为 `/pages/spaces/index`
- [ ] 更新导航测试，证明 `resetTo({ page: 'spaces' })` 使用正式路径
- [ ] 运行导航定向测试

### 7.2 02 页面失败测试

- [ ] 写 bootstrap loading 不显示空状态
- [ ] 写 bootstrap error 显示重试而不是空空间
- [ ] 写 empty 显示创建主操作
- [ ] 写 with-spaces 使用 `sortedSpaces`
- [ ] 写团团完整、豆豆无记忆状态
- [ ] 写整条空间可点击
- [ ] 写空间条目没有设置、删除和更多按钮
- [ ] 写根页面无返回按钮
- [ ] 写创建入口发出 03 正式路由意图

### 7.3 页面实现

- [ ] 使用 `PageShell layout="standard-flow"`
- [ ] 根页面 `showBack=false`
- [ ] 使用顶部标题、简短说明、空间列表和创建入口的正式顺序
- [ ] 用纯视图模型准备空间条目
- [ ] 无空间时使用安静空状态，不出现首次说明文案
- [ ] loading 小于 150ms 保持画布，超过后显示初始化文案
- [ ] error 显示“暂时没有打开这里。”与重试
- [ ] 空间点击通过 NavigationAdapter 进入 04
- [ ] 不在页面内排序、查询持久化或缓存实体副本

### 7.4 验收门

| ID | 机器门 |
|---|---|
| `T5A-M14` | `pages.json` 注册 02/04/08 且路径准确 |
| `T5A-M15` | spaces 稳定目标已切换到 `/pages/spaces/index` |
| `T5A-M16` | loading、error、empty、with-spaces 四态互斥 |
| `T5A-M17` | 首次用户不因 empty 自动进入 02；该决定仍由应用首次入口控制 |
| `T5A-M18` | 页面使用 `sortedSpaces`，不按最近查看排序 |
| `T5A-M19` | 无正式记忆显示“还没有留下记忆” |
| `T5A-M20` | 有记忆显示最新用户原话与日期 |
| `T5A-M21` | 整条条目只有一个进入空间语义 |
| `T5A-M22` | 02 不显示返回操作 |
| `T5A-M23` | 创建入口只构造 03 路由，不创建占位页 |
| `T5A-A03` | 页面没有私有颜色、字号、圆角或阴影 |

## 8. Task 5A-3：04 Ta 的空间首页

### 8.1 状态测试矩阵

- [ ] bootstrap 未完成
- [ ] 路由参数缺失或非法
- [ ] ID 合法但空间不存在
- [ ] 无草稿、无正式记忆
- [ ] 有草稿、无正式记忆
- [ ] 无草稿、有 1–3 条记忆
- [ ] 有草稿、有正式记忆
- [ ] 超过 3 条时首页仍只显示最近 3 条
- [ ] 空间照片 available
- [ ] 空间照片 expired 或不存在

### 8.2 页面实现动作

- [ ] 使用 `PageShell layout="standard-flow"`
- [ ] 等待 appStore ready 后才按路由读取空间
- [ ] 参数非法时轻提示并返回 02
- [ ] 实体不存在时使用 `MissingContentState`
- [ ] 身份区显示最新空间名称和可用封面
- [ ] 有草稿时使用 `DraftNotice`
- [ ] “继续写”只存在于 DraftNotice
- [ ] 有草稿时仍显示“留下一段新的记忆”
- [ ] 无草稿时显示“留下一段”
- [ ] 最近留下使用 `MemoryList`
- [ ] 无正式记忆时不显示空分隔线或“查看全部记忆”
- [ ] 有至少一条正式记忆时显示“查看全部记忆”
- [ ] 设置、记录和详情点击只发出正式后续路由意图
- [ ] 普通返回进入 02

### 8.3 验收门

| ID | 机器门 |
|---|---|
| `T5A-M24` | bootstrap ready 前不显示 missing 或空首页 |
| `T5A-M25` | 参数非法与实体不存在采用不同处理 |
| `T5A-M26` | 页面按 ID 从 Store 读取最新空间，不使用路由对象副本 |
| `T5A-M27` | 四种草稿/记忆组合与正式矩阵一致 |
| `T5A-M28` | 首页最多显示最近 3 条正式记忆 |
| `T5A-M29` | 草稿不混入最近记忆 |
| `T5A-M30` | “继续写”只在 DraftNotice 内出现 |
| `T5A-M31` | 无记忆时不显示虚构条目、分隔线或查看全部 |
| `T5A-M32` | 封面不可用时不显示破图 |
| `T5A-M33` | 普通返回进入 02 |
| `T5A-M34` | 05/09/12 入口使用安全 URL，不传私人对象 |
| `T5A-M35` | 页面不实现快速编辑和删除 |
| `T5A-A04` | 页面结构严格对应 04 最终视觉母版 |

### 8.4 首页视觉零容忍

- DraftNotice 材质、胶带和“继续写”位置不得自行重做；
- 主按钮层级与母版一致；
- 最近记忆不存在时后续区块自然上移；
- 不复制浏览器原型 CSS；
- 不通过绝对定位贴图；
- 不添加成就、连续天数、强提醒或煽情文案。

## 9. Task 5A-4：08 全部记忆

### 9.1 失败测试

- [ ] bootstrap 等待
- [ ] 路由参数非法
- [ ] 空间不存在
- [ ] 空间存在但无正式记忆
- [ ] 两条及更多正式记忆时间倒序
- [ ] 草稿不进入列表
- [ ] 有照片左图右文
- [ ] 无照片正文占满
- [ ] expired 照片不破图
- [ ] 点击条目携带 `source=memories`
- [ ] 返回 04

### 9.2 页面实现

- [ ] 使用 `PageShell layout="standard-flow"`
- [ ] 标题区域显示空间名称和正式记忆数量
- [ ] 使用 `MemoryList`，不复制 `MemoryEntry`
- [ ] 使用原生页面纵向滚动
- [ ] 日期低强调、摘要最多两行
- [ ] 列表为空时提供返回空间操作
- [ ] 有条目时显示正式列表结束说明
- [ ] 不实现搜索、筛选、标签、日历、相册墙或瀑布流
- [ ] 返回 04 并保留由页面/平台管理的合理滚动状态

### 9.3 验收门

| ID | 机器门 |
|---|---|
| `T5A-M36` | 只显示当前空间正式记忆 |
| `T5A-M37` | 列表按时间倒序且排序不修改 Store |
| `T5A-M38` | 草稿和其他空间记忆不进入列表 |
| `T5A-M39` | 有图、无图和照片失效状态正确 |
| `T5A-M40` | 无图时不保留空缩略图槽 |
| `T5A-M41` | 整行只有一个进入详情语义 |
| `T5A-M42` | 详情来源固定为 `memories`，不传完整返回 URL |
| `T5A-M43` | empty 与 bootstrap error 不混淆 |
| `T5A-M44` | 页面没有搜索、筛选、标签、日历或瀑布流 |
| `T5A-A05` | 页面结构对应 08 基准，使用自然滚动 |

## 10. Task 5A-5：自动验证、视觉和微信闭环

### 10.1 单一验证入口

`package.json` 增加：

```text
verify:task5a
```

至少串联：

```text
memory-summary 单测
→ 02/04/08 组件测试
→ navigation 回归
→ 全量测试
→ typecheck
→ 微信生产构建
→ 页面注册与禁止项扫描
```

| ID | 机器门 |
|---|---|
| `T5A-M45` | 任一子命令失败时返回非零退出码 |
| `T5A-M46` | 四个 Task 5A 测试文件全部真实运行 |
| `T5A-M47` | 全量测试通过且无跳过用例 |
| `T5A-M48` | typecheck 通过 |
| `T5A-M49` | 微信生产构建通过 |
| `T5A-M50` | 产物包含 02/04/08 页面 |
| `T5A-M51` | 产物不包含测试、私人夹具和调试日志 |
| `T5A-M52` | 未创建 05/09/12 占位页 |
| `T5A-M53` | 无未批准依赖和共享组件接口变化 |
| `T5A-M54` | 无 `TODO / FIXME / placeholder / 以后替换` |

### 10.2 标准截图

必须取得：

```text
02-spaces.png
04-space-home.png
08-memories.png
```

条件：

- 微信开发者工具；
- `393 × 852 CSS px`；
- 团团完整样本；
- 固定日期、中文、默认字体；
- 关闭 DevPanel、键盘、性能面板和光标；
- 图片加载、异步和动画稳定；
- 04 使用最终首页母版，不使用旧原型截图。

每页形成：

1. 原始基准；
2. 实现截图；
3. 393×852 归一化副本；
4. 并排图；
5. 50% 叠层图；
6. 差异图；
7. P0–P3 结论。

### 10.3 响应式与人工门

| ID | 人工/产物门 |
|---|---|
| `T5A-A06` | 02、04、08 三张截图命名、状态和尺寸正确 |
| `T5A-A07` | 三页均有并排、叠层、差异和报告 |
| `T5A-H01` | 393px 无结构、层级和视觉偏差 |
| `T5A-H02` | 320px 无横向滚动、重叠和操作不可达 |
| `T5A-H03` | 480px 内容宽度、留白和照片比例受控 |
| `T5A-H04` | 02→04→08→04→02 在微信预览真实可走通 |
| `T5A-H05` | 04 首页在至少一台真机检查胶囊、安全区和滚动 |
| `T5A-H06` | 照片裁切、中文换行和 DraftNotice 材质人工通过 |
| `T5A-H07` | P0、P1、P2 均为 0，P3 有逐项接受记录 |

### 10.4 Reviewer 必做反证

至少抽查四项：

1. AI 候选稿被当作摘要；
2. bootstrap loading 被当作 empty；
3. 首页显示第 4 条最近记忆；
4. expired 照片继续输出 URI；
5. 08 混入草稿；
6. spaces 稳定路径仍指向临时 index；
7. 页面添加私有颜色；
8. 后续入口携带完整对象。

反证恢复后必须重跑 `verify:task5a`。

## 11. 禁止捷径

- 直接把基准图作为页面背景；
- 复制浏览器原型 CSS；
- 为贴图使用绝对定位；
- 页面直接访问 Repository 或 storage；
- 页面自行排序并修改 Store 数组；
- 复制 MemoryEntry、DraftNotice 或 MissingContentState 内部结构；
- 用截图测试替代行为测试；
- 用行为测试替代微信视觉检查；
- 隐藏错误状态使标准截图更接近；
- 创建后续页面占位符；
- 未经 Reviewer 就宣布 Task 5A 或 Task 5 完成。

## 12. Builder 开工表

```text
当前批次：Task 5A

读取文档：
-

前置门结果：
- verify:task3：
- verify:task4：
- build:mp-weixin：

规格追踪：
| 标准ID | 实现文件 | 测试/操作 | 风险 |
|---|---|---|---|

允许修改：
-

明确不修改：
-

后续入口边界：
-

需要确认的冲突：
- 无 / 具体说明
```

## 13. Builder 与 Reviewer 收口格式

Builder：

```text
Task 5A状态：self-verified

完成内容：
-

标准证据：
| 标准ID | 实现位置 | 测试/操作 | 产物 | 结果 |
|---|---|---|---|---|

命令：
- npm run verify:task5a：
- npm run test:run：
- npm run typecheck：
- npm run build:mp-weixin：

微信路径：
- 02→04→08→04→02：

视觉证据：
- 02：
- 04：
- 08：

反证：
-

后续未实现入口：
- 03 / 05 / 09 / 12

warning与未验证项：
-

建议：等待独立Reviewer
```

Reviewer：

```text
复核范围：Task 5A

复跑结果：
-

反证抽查：
| 标准ID | 错误 | 是否失败 | 恢复后结果 |
|---|---|---|---|

视觉结论：
- 02：
- 04：
- 08：

阻断问题：
- 无 / 标准ID、证据、推荐修复

非阻断问题：
-

结论：
- reviewer-accepted / needs-fix / externally-blocked
```

Task 5A 通过只允许进入 Task 5B，不允许更新整个 Task 5 为完成。

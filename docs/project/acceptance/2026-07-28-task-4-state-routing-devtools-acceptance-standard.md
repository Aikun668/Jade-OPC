# Task 4 Pinia、应用初始化、路由导航与开发工具验收标准

日期：2026-07-28  
状态：正式验收门槛  
适用范围：M0 Task 4.1–4.6

## 1. 文档职责

本文件把 Task 4 的正式规格转换为可以小批次实施、逐项取证、独立反证和明确退回的验收门。

本文件是验收标准，不是某一轮实现报告，也不验收 Task 3。Task 3 只作为已完成的上游接口提供方；除非 Task 4 接入时暴露出明显的固定接口错误或需求冲突，不在本轮重新审查其内部实现。

相关真源：

- [AI 开发协作与验收协议](../rule/2026-07-27-ai-development-collaboration-protocol.md)
- [M0 工程骨架实施计划](../../product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md)
- [M0 工程骨架与设计系统决策记录](../../product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md)
- [Task 3 领域模型、单快照与 LocalMemoryRepository 验收标准](2026-07-27-task-3-domain-repository-acceptance-standard.md)

发生冲突时，以时间更新、范围更具体且已经确认的正式规格为准。Builder 不得为了适配现有实现而降低门槛或自行改变产品、数据及固定接口。

## 2. Task 4 边界与执行性澄清

Task 4 建立：

```text
路由参数解析
→ 导航平台适配
→ 两个 Pinia Store
→ 应用 bootstrap
→ 开发场景控制
→ 仅开发态 DevPanel
```

Task 4 不负责：

- 13 个正式页面及其产品流程装配；
- 照片选择、文字记录、草稿编辑和正式保存页面；
- AI 候选稿服务实现；
- CloudBase、登录、网络请求或云端持久化；
- 新增第三个全局 Store；
- 修改 Task 2 共享组件的公开合同或视觉方向。

### 2.1 三项必要接线

只创建 Store 和组件文件不能形成闭环。Task 4 必须同时完成：

1. `src/main.ts` 注册唯一 Pinia 实例；
2. `src/App.vue` 在应用生命周期中触发一次 bootstrap，不添加 `<template>`；
3. 当前临时 `src/pages/index/index.vue` 作为仅开发态 DevPanel 宿主，Task 5 再迁移并删除临时页。

### 2.2 `entry=photo` 分层验证

`parseTextRecordRoute(query)` 只接收 query，不能知道上一页，因此验收分成两层：

- 参数层：`photo` 是合法 `entry`，照片 URI、完整对象和来源内容不得进入路由；
- 流程层：只有照片记录页的“继续讲述”可以构造 `entry=photo` 路由；该项在后续照片页集成时完成最终人工与页面测试。

Task 4 不得为了证明来源而增加私人内容、完整草稿、照片 URI 或可伪造的敏感对象参数。

### 2.3 Store 领域范围

`useMemoryStore` 管理完整快照中的：

```text
spaces
memories
drafts
assets
```

`assets` 是 Task 3 快照已有领域数据，不是新增 Store，也不得复制进 `useAppStore`。

## 3. 验收角色、状态与证据

### 3.1 角色

| 角色 | 职责 |
|---|---|
| 项目负责人 | 确认产品流程、固定接口或架构变化；完成必要的微信人工操作 |
| Codex / 规划者 | 维护正式门槛、处理冲突、执行关键里程碑验收 |
| DeepSeek Builder | 实现、自测并提交证据；不得自行宣布 `accepted` |
| 独立 Reviewer | 使用新上下文只读复核、运行反证并给出结论 |

### 3.2 状态

```text
not-started
→ implementing
→ self-verified
→ reviewer-accepted
```

发现问题时：

```text
self-verified
→ needs-fix
→ implementing
```

只有微信开发者工具本身不可用且代码、测试、构建与产物检查均通过时，相关人工门才可以登记为 `externally-blocked`。普通测试或接线失败不能使用该状态。

### 3.3 证据层

| 证据层 | 证明内容 |
|---|---|
| `M` 机器门 | 固定类型、路由解析、Store 行为、失败路径、条件编译和构建 |
| `A` 产物门 | 源码接线、开发与生产产物、依赖边界和禁止项 |
| `H` 人工门 | 开发面板可达、场景切换真实生效、生产预览无开发入口 |

### 3.4 反证要求

每个内部批次至少选择一个高风险条件：

1. 临时制造明确错误；
2. 确认对应测试、扫描或构建失败；
3. 恢复正确实现；
4. 重跑并确认通过。

不得把故意错误、调试输出、临时页面或私人内容留在仓库。

### 3.5 总通过定义

Task 4 只有同时满足以下条件才能 `reviewer-accepted`：

- Task 4.1–4.6 的全部强制门通过；
- 路由解析与实体不存在被明确区分；
- 导航适配器符合固定接口和稳定栈语义；
- 只有两个全局 Store，Repository 是唯一持久化入口；
- bootstrap 在真实应用入口完成接线，页面不会提前判断内容不存在；
- DevPanel 在开发构建真实可达，生产构建不可达且不泄漏调试信息；
- 定向测试、全量测试、类型检查和微信生产构建通过；
- 完成规定反证，不以测试数量代替行为覆盖；
- 无未批准依赖、接口、页面、产品流程或 Task 5+ 实现；
- Builder 只报告 `self-verified`，不提前修改正式完成状态。

## 4. 建议执行批次

| 批次 | 对应步骤 | 闭环产物 |
|---|---|---|
| Task 4A | 4.1 路由部分 | 路由类型、参数解析与隐私边界 |
| Task 4B | 4.1 导航部分 | NavigationAdapter 与稳定栈语义 |
| Task 4C | 4.2、4.3、4.4 | 两个 Store、完整快照提交与真实 bootstrap |
| Task 4D | 4.5 | 开发场景控制、DevPanel 与生产隔离 |
| Task 4E | 4.6 | 单一验证入口、微信产物与状态收口 |

每个批次完成后先自证再进入下一批次。批次通过不等于 Task 4 正式完成。

## 5. Task 4A：路由类型与参数解析

### 5.1 验收目标

让后续页面只接收稳定内部 ID 和白名单流程参数，并明确区分“路由参数无效”与“参数合法但实体不存在”。

### 5.2 最小返回合同

`RouteParseResult<T>` 必须是可穷尽判断的联合类型，至少能表达：

```ts
export type RouteParseResult<T> =
  | { kind: 'valid'; value: T }
  | {
      kind: 'invalid'
      reason: 'missing-param' | 'invalid-id' | 'invalid-entry'
      param: 'spaceId' | 'memoryId' | 'entry'
    }
```

内部命名可以等价调整，但不得：

- 用 `null / undefined / false` 混合表达所有失败；
- 抛出未经页面转换的技术异常；
- 在失败结果中包含私人 query 原文；
- 把实体不存在归类成路由格式错误。

### 5.3 固定解析接口门

```ts
export function parseSpaceRoute(
  query: Record<string, unknown>
): RouteParseResult<{ spaceId: string }>

export function parseMemoryRoute(
  query: Record<string, unknown>
): RouteParseResult<{ memoryId: string }>

export function parseTextRecordRoute(
  query: Record<string, unknown>
): RouteParseResult<{ spaceId: string; entry: TextRecordEntry }>
```

| ID | 机器门 |
|---|---|
| `T4A-M01` | 三个固定解析函数存在，参数和返回泛型与合同一致 |
| `T4A-M02` | 缺少必需参数返回 `missing-param`，不抛异常 |
| `T4A-M03` | 空字符串、纯空格、对象、数组和函数值被拒绝 |
| `T4A-M04` | ID 使用项目统一 ID 规则校验，不在路由模块另造第二套格式 |
| `T4A-M05` | `spaceId` 与 `memoryId` 类型不互相接受 |
| `T4A-M06` | `entry` 只接受 `daily / photo / meeting / relationship` |
| `T4A-M07` | 大小写变体、前后空格和未知 entry 不被静默修正 |
| `T4A-M08` | 合法 `entry=photo` 返回 valid，且结果只包含 `spaceId` 与 `entry` |
| `T4A-M09` | query 中额外的名称、原话、照片路径或序列化对象不会进入解析结果 |
| `T4A-M10` | URL 编码后的 JSON、数组和对象不能绕过白名单 |
| `T4A-M11` | 解析函数不读取 Store、Repository、当前页面栈或平台存储 |
| `T4A-M12` | 解析函数不判断实体是否存在；该判断必须等待 bootstrap 后由 Store 完成 |

### 5.4 来源语义门

记忆详情可使用以下非敏感来源语义：

```ts
export type MemoryDetailSource =
  | 'space-home'
  | 'memories'
  | 'new-memory'
```

| ID | 机器门 |
|---|---|
| `T4A-M13` | 来源值只允许上述三种白名单 |
| `T4A-M14` | 来源值不包含空间名、原话、照片或完整返回 URL |
| `T4A-M15` | 未知来源按安全默认行为处理，不开放任意跳转 |
| `T4A-M16` | `entry=photo` 不增加照片 URI、草稿对象或私人来源字段 |

### 5.5 产物门

| ID | 产物门 |
|---|---|
| `T4A-A01` | `src/types/routes.ts` 只承载路由类型和白名单 |
| `T4A-A02` | `src/features/routing/route-params.ts` 是纯 TypeScript 解析模块 |
| `T4A-A03` | `tests/unit/route-params.test.ts` 可独立运行 |
| `T4A-A04` | 没有第二套路由解析工具散落在页面、Store 或组件 |

### 5.6 反证抽查

Reviewer 至少执行两项：

- 临时接受未知 `entry`，白名单测试必须失败；
- 临时把对象值强制转成字符串，非法 query 测试必须失败；
- 临时在解析器中查询 Repository，纯函数边界扫描必须失败；
- 临时把实体不存在返回 `invalid-id`，分层职责测试必须失败。

### 5.7 禁止捷径

- `String(value)` 后统一接受；
- 用正则扫描源码代替真实输入输出测试；
- 在路由传递完整对象后再从中提取 ID；
- 为证明 `photo` 来源而引入照片 URI 或完整草稿；
- 在 bootstrap 完成前把 Store 暂无实体当作不存在。

### 5.8 必需证据与退出条件

Builder 提交定向测试命令、退出码、每个失败原因对应的用例名称，以及至少两项反证记录。`T4A-M01` 至 `T4A-A04` 全部通过后，Task 4A 才可进入 Reviewer 复核。

## 6. Task 4B：NavigationAdapter 与稳定页面栈

### 6.1 验收目标

把平台导航调用集中到适配器，保证普通前进、返回、替换和跨临时流程的栈归一化具有唯一语义。

### 6.2 固定接口门

```ts
export type StableDestination =
  | { page: 'spaces' }
  | { page: 'space-home'; spaceId: string }
  | { page: 'memory-detail'; memoryId: string }

export interface NavigationAdapter {
  push(url: string): Promise<void>
  back(): Promise<void>
  replace(url: string): Promise<void>
  resetTo(destination: StableDestination): Promise<void>
}
```

固定类型不得被页面私自扩展为任意对象或完整返回 URL。

### 6.3 平台映射门

| ID | 机器门 |
|---|---|
| `T4B-M01` | `push` 一对一调用 `uni.navigateTo` |
| `T4B-M02` | `back` 一对一调用 `uni.navigateBack`，普通返回不使用 reLaunch |
| `T4B-M03` | `replace` 一对一调用 `uni.redirectTo` |
| `T4B-M04` | 平台调用成功才 resolve，失败必须 reject |
| `T4B-M05` | URL 在调用前经过内部页面白名单和参数构造，不接受外部任意 scheme |
| `T4B-M06` | 导航错误不记录或输出私人 query 内容 |

### 6.4 `resetTo` 稳定栈门

固定 `memory-detail` 目标不携带 `spaceId`，因此它只用于已经从某个空间进入记录流程、当前栈中仍存在空间首页的正式保存路径。Adapter 必须保留该稳定父页面并清理中间临时页；如果前置栈不存在，应明确 reject，不得猜测空间、读取 Store 或伪造返回目标。

| ID | 机器门 |
|---|---|
| `T4B-M07` | `spaces` 归一化到空间列表根页面 |
| `T4B-M08` | `space-home` 结束 03/05/06/07 临时流程，稳定返回语义为 02 |
| `T4B-M09` | `memory-detail` 结束 05/06/07 临时流程，返回语义为对应空间首页 |
| `T4B-M10` | 栈归一化基于明确目标和当前页面栈，不连续盲调 `navigateBack` 猜测 |
| `T4B-M11` | 创建空间、正式保存、删除空间和明确放弃使用 `resetTo` |
| `T4B-M12` | 普通页面前进仍使用 `push`，普通返回仍使用 `back` |
| `T4B-M13` | 已完成或失效的表单页不会成为用户下一次返回目标 |
| `T4B-M14` | 同一目标重复调用不会无限叠加相同页面 |
| `T4B-M15` | 不使用空间名、原话、照片 URI 或完整对象构造稳定目标 |
| `T4B-M16` | `memory-detail` 前置空间首页不存在时明确失败，不退化成无法返回的单页详情 |

### 6.5 来源与局部返回边界

| ID | 机器门 |
|---|---|
| `T4B-M17` | 详情来源 `space-home / memories / new-memory` 能被保留为非敏感语义 |
| `T4B-M18` | 从全部记忆删除后可以返回 08；从首页或新建路径返回 04 |
| `T4B-M19` | NavigationAdapter 不负责关闭键盘、查看器、BottomSheet 或 ConfirmDialog |
| `T4B-M20` | 页面层消费局部覆盖层返回动作后，不调用适配器 `back` |
| `T4B-M21` | Adapter 不读取 Pinia 或 Repository 来推断私人导航目标 |

### 6.6 测试与产物门

| ID | 门槛 |
|---|---|
| `T4B-M22` | 导航测试使用可控平台适配器或 mock，不依赖真实微信页面栈 |
| `T4B-M23` | 测试检查调用顺序、参数和失败传播，不只检查方法存在 |
| `T4B-A01` | `src/adapters/navigation.ts` 是页面导航平台调用的唯一适配边界 |
| `T4B-A02` | `tests/unit/navigation.test.ts` 可单独运行 |
| `T4B-A03` | 页面和 Store 中没有散落组合 `reLaunch / redirectTo / navigateBack` |

### 6.7 反证抽查

Reviewer 至少执行两项：

- 把正式保存改成普通 `push`，临时页残留测试必须失败；
- 让 `back` 使用 `reLaunch`，普通返回映射测试必须失败；
- 让平台失败被吞掉，失败传播测试必须失败；
- 让 Adapter 直接读取 Store，职责扫描必须失败。

### 6.8 禁止捷径与退出条件

禁止通过固定多次 `navigateBack` 碰运气、禁止把返回 URL 作为任意 query、禁止在 Adapter 中复制页面业务规则。`T4B-M01` 至 `T4B-A03` 全部通过并完成反证后，Task 4B 才可 `self-verified`。

## 7. Task 4C：两个 Store 与应用 bootstrap

### 7.1 验收目标

建立唯一全局状态入口，使页面只通过 Store action 使用 Repository，并且只有在完整快照读取成功后才进入 ready 状态。

### 7.2 Pinia 接线门

| ID | 机器门 |
|---|---|
| `T4C-M01` | `src/main.ts` 创建并注册唯一 Pinia 实例 |
| `T4C-M02` | 应用运行时只有 `useAppStore` 与 `useMemoryStore` 两个全局 Store |
| `T4C-M03` | 不创建 `useUiStore`、路由 Store 或开发工具 Store |
| `T4C-M04` | Store 可通过依赖注入或明确工厂获得 `MemoryRepository`，测试不依赖全局隐式单例 |
| `T4C-M05` | `main.ts` 不创建第二个 Repository 或第二份领域状态 |

### 7.3 `useAppStore` 门

固定状态：

```ts
export type BootstrapStatus = 'idle' | 'loading' | 'ready' | 'error'
```

| ID | 机器门 |
|---|---|
| `T4C-M06` | 初始状态为 `idle` |
| `T4C-M07` | Store 只管理 bootstrap 状态、sampleMode、schemaVersion、devMode 和初始化错误分类 |
| `T4C-M08` | 不复制 spaces、memories、drafts 或 assets |
| `T4C-M09` | loading、ready、error 转换由明确 action 完成 |
| `T4C-M10` | 初始化错误分类可转换成用户可理解状态，不保存原始私人快照 |
| `T4C-M11` | `sampleMode` 和 `schemaVersion` 来源于成功快照，不由页面猜测 |
| `T4C-M12` | `devMode` 只描述开发能力状态，不成为用户业务字段或持久化内容 |

### 7.4 `useMemoryStore` 状态门

| ID | 机器门 |
|---|---|
| `T4C-M13` | 唯一领域状态为 spaces、memories、drafts、assets |
| `T4C-M14` | 能以一个完整合法快照整体替换四组状态 |
| `T4C-M15` | 不保留与快照重复的实体缓存或页面副本 |
| `T4C-M16` | Store 不直接调用 uni storage、CloudBase、网络或模型接口 |
| `T4C-M17` | Store 不生成实体 ID、时间、资产归属或可用性 |

### 7.5 Actions 一致性门

Actions 与 `MemoryRepository` 写操作一一对应：

| ID | 机器门 |
|---|---|
| `T4C-M18` | action 把领域输入原样交给 Repository，不扩充持久化字段 |
| `T4C-M19` | 每个 action 等待 Repository 成功后才替换状态 |
| `T4C-M20` | action 使用返回的完整快照整体提交，不在 Store 手工拼实体 |
| `T4C-M21` | Repository reject 时四组状态保持原状 |
| `T4C-M22` | reject 会继续传播或被明确分类，不伪装成功 |
| `T4C-M23` | 草稿转正式记忆只调用一次 `saveMemory`，不追加 `deleteDraft` |
| `T4C-M24` | resetSample 同步更新 memoryStore 领域状态和 appStore 元数据 |
| `T4C-M25` | action 不负责页面导航、Toast、确认弹窗或键盘状态 |

### 7.6 Getters 门

| ID | 机器门 |
|---|---|
| `T4C-M26` | 空间按最近新增或更新的正式记忆排序，不按最近查看排序 |
| `T4C-M27` | 某空间最近记忆只返回最多 3 条正式记忆 |
| `T4C-M28` | 某空间全部记忆按时间倒序，结果不包含草稿 |
| `T4C-M29` | 每个空间最多返回一条草稿 |
| `T4C-M30` | 能按 ID 查找空间、记忆和资产 |
| `T4C-M31` | getter 不原地排序 Store 数组，不改变领域状态 |
| `T4C-M32` | getter 返回空结果与初始化错误由 appStore 状态区分 |
| `T4C-M33` | 相同时间使用稳定、确定性的次级排序，不产生闪动 |

### 7.7 bootstrap 顺序门

固定顺序：

```text
App onLaunch
→ appStore loading
→ repository.bootstrap()
→ memoryStore 接收完整快照
→ appStore 同步 sampleMode / schemaVersion
→ appStore ready
```

| ID | 机器门 |
|---|---|
| `T4C-M34` | `App.vue` 通过应用生命周期触发 bootstrap，不包含页面 `<template>` |
| `T4C-M35` | 一次应用启动只执行一次有效 bootstrap |
| `T4C-M36` | bootstrap 成功前不进入 ready |
| `T4C-M37` | memoryStore 完整提交早于 appStore ready |
| `T4C-M38` | bootstrap reject 时进入 error，不伪装成空样本 |
| `T4C-M39` | error 时保留可重试路径，不留下半提交领域状态 |
| `T4C-M40` | 页面可依据 loading/ready/error 决定状态，不在 loading 时判断实体不存在 |
| `T4C-M41` | 重复生命周期事件不会并发发起重复 bootstrap |

### 7.8 产物门

| ID | 产物门 |
|---|---|
| `T4C-A01` | `src/stores/app.ts` 与 `src/stores/memory.ts` 职责分离 |
| `T4C-A02` | `src/main.ts`、`src/App.vue` 真实引用并接通 Store/bootstrap |
| `T4C-A03` | `tests/unit/app-store.test.ts` 和 `memory-store.test.ts` 可独立运行 |
| `T4C-A04` | 微信构建的应用入口包含 Pinia 注册和 bootstrap 代码 |

### 7.9 反证抽查

Reviewer 至少执行三项：

- 让 Store 在 Repository resolve 前更新，失败原子性测试必须失败；
- bootstrap loading 时返回空列表并判断不存在，状态分层测试必须失败；
- getter 原地 `sort`，不可变性测试必须失败；
- App 生命周期触发两次 Repository bootstrap，幂等测试必须失败；
- 在 appStore 复制 spaces，双真源扫描必须失败；
- action 直接调用 uni storage，持久化边界扫描必须失败。

### 7.10 禁止捷径与退出条件

禁止只测 Store 字段存在、禁止把 Repository mock 写成永远成功、禁止由页面手工灌入四组数组、禁止在 App.vue 添加页面视图。`T4C-M01` 至 `T4C-A04` 全部通过后，Task 4C 才可进入 Reviewer 复核。

## 8. Task 4D：开发场景控制与 DevPanel

### 8.1 验收目标

让 Builder 和 Reviewer可以稳定复现 M0 关键状态，同时保证这些能力不会进入普通用户的生产体验。

### 8.2 场景能力门

仅开发构建支持：

| ID | 机器门 |
|---|---|
| `T4D-M01` | 切换 `empty / complete` 样本并通过 Repository resetSample 生效 |
| `T4D-M02` | 重置本地体验数据后两个 Store 同步完整快照 |
| `T4D-M03` | AI mock 场景只接受 `success / insufficient / unavailable` |
| `T4D-M04` | 可显式开关保存失败模拟 |
| `T4D-M05` | 可显式开关照片失败模拟 |
| `T4D-M06` | 可显式开关权限不足模拟 |
| `T4D-M07` | 相同场景可重复选择并得到确定结果 |
| `T4D-M08` | 场景控制状态集中在 `dev-scenarios.ts`，不建立第三个 Store |
| `T4D-M09` | Task 4 只提供 AI 场景值，不提前实现 Task 8 的 AI service |

### 8.3 DevPanel 展示边界门

| ID | 机器门 |
|---|---|
| `T4D-M10` | 面板显示当前路由、必要实体 ID、schemaVersion 和场景开关 |
| `T4D-M11` | 面板不显示用户原话、AI 候选稿、照片 URI 或完整快照 |
| `T4D-M12` | 切换样本和重置动作有进行中状态，防止重复并发操作 |
| `T4D-M13` | 操作失败显示可理解开发反馈，不吞掉失败或伪装成功 |
| `T4D-M14` | DevPanel 使用 Task 2 已有组件合同，不重建同名组件或私改视觉接口 |
| `T4D-M15` | DevPanel 不成为正式页面路由 |

### 8.4 开发入口与生产隔离门

| ID | 机器门 |
|---|---|
| `T4D-M16` | 当前临时启动页在开发构建提供可发现入口 |
| `T4D-M17` | 入口和组件挂载受到编译期 DEV 条件保护 |
| `T4D-M18` | 生产条件下没有可点击、不可见占位或隐藏手势入口 |
| `T4D-M19` | 生产构建不包含 DevPanel 用户文案、场景标签和调试信息 |
| `T4D-M20` | 生产代码不能通过 query 或本地存储重新开启开发面板 |
| `T4D-M21` | Task 5 删除临时页时有明确迁移注释或计划引用，不留下永久模板页依赖 |

### 8.5 测试与人工门

| ID | 门槛 |
|---|---|
| `T4D-M22` | 组件测试真实触发开关、reset 和失败反馈，不只检查文本存在 |
| `T4D-M23` | 测试验证进行中锁和失败后的可再次操作 |
| `T4D-A01` | `src/features/developer/dev-scenarios.ts` 与 `DevPanel.vue` 职责分离 |
| `T4D-A02` | 开发构建产物包含 DevPanel，生产构建产物扫描不到其特征字符串 |
| `T4D-H01` | 微信开发者工具开发预览能打开面板并切换 empty/complete |
| `T4D-H02` | 场景切换后页面状态与 Store 一致，不需要重启工具 |
| `T4D-H03` | 微信生产预览无入口、无调试文案、无空白占位 |

### 8.6 反证抽查

Reviewer 至少执行三项：

- 去掉编译期保护，生产产物扫描必须失败；
- 只隐藏按钮但仍打包 DevPanel 文案，产物门必须失败；
- 在面板展示照片 URI，隐私测试必须失败；
- reset 后只更新一个 Store，快照一致性测试必须失败；
- 连续点击产生两次 reset，并发锁测试必须失败。

### 8.7 禁止捷径与退出条件

禁止用运行时 CSS 隐藏代替生产移除、禁止把调试入口做成正式路由、禁止记录完整快照、禁止提前实现 AI service。`T4D-M01` 至 `T4D-H03` 全部通过；若只有微信工具不可用，可登记人工门外部阻碍，但机器和产物门不得豁免。

## 9. Task 4E：总验证与交付收口

### 9.1 单一验证入口

Task 4 应建立：

```powershell
npm run verify:task4
```

至少串联：

```text
Task 4 五组定向测试
→ 全量测试
→ TypeScript 类型检查
→ 微信生产构建
→ 固定接口与禁止项扫描
→ 生产开发入口泄漏扫描
```

| ID | 机器门 |
|---|---|
| `T4E-M01` | 任一子命令失败时 `verify:task4` 返回非零退出码 |
| `T4E-M02` | 五个计划测试文件全部被实际运行 |
| `T4E-M03` | 全量测试通过，无 Task 1–3 回归 |
| `T4E-M04` | `npm run typecheck` 通过 |
| `T4E-M05` | `npm run build:mp-weixin` 通过 |
| `T4E-M06` | 重复运行结果稳定，不依赖测试顺序 |
| `T4E-M07` | warning 原样报告，不把未核对警告写成 0 |

### 9.2 固定接口与边界扫描

| ID | 机器门 |
|---|---|
| `T4E-M08` | 只有两个全局 Pinia Store |
| `T4E-M09` | Store 不直接使用 storage、CloudBase 或模型 API |
| `T4E-M10` | 页面和 Store 不散落平台导航组合 |
| `T4E-M11` | 路由结果不包含序列化对象、原话或照片 URI |
| `T4E-M12` | App.vue 无 `<template>`，main.ts 只有一个 Pinia |
| `T4E-M13` | 无未批准生产依赖和 Task 5+ 页面实现 |
| `T4E-M14` | 无 `TODO / FIXME / placeholder / 以后替换` |
| `T4E-M15` | 无临时调试日志、私人测试输入和跳过测试标记 |

### 9.3 构建产物门

| ID | 产物门 |
|---|---|
| `T4E-A01` | 微信生产构建真实包含 Pinia、bootstrap、路由和导航接线 |
| `T4E-A02` | 生产产物不包含 DevPanel 入口、文案和开发场景实现 |
| `T4E-A03` | 构建产物不包含测试文件、测试夹具或调试日志 |
| `T4E-A04` | package 与 lockfile 一致，无未说明依赖变化 |
| `T4E-A05` | 工作区没有反证残留文件、临时快照和调试页面 |

### 9.4 Reviewer 总反证

至少从以下项目抽查四项：

1. 未知 entry 被拒绝；
2. 参数合法与实体不存在保持分层；
3. 正式保存不会留下 05/06/07；
4. Repository 失败时 Store 不更新；
5. bootstrap 失败不显示空状态；
6. getter 不修改原数组；
7. 开发面板不会进入生产产物；
8. reset 后两个 Store 与快照一致。

### 9.5 文档状态门

| ID | 状态门 |
|---|---|
| `T4E-A06` | Builder 完成自证后只报告 `self-verified` |
| `T4E-A07` | 独立验收前不勾选 Task 4.1–4.6 或改写 README 总进度 |
| `T4E-A08` | Reviewer 通过后再同步实施计划、README 和必要技术状态 |
| `T4E-A09` | 若实际修改固定接口，存在项目负责人确认及正式规格链接 |

### 9.6 退出条件

`T4E-M01` 至 `T4E-A09` 全部通过，人工门完成或真实登记唯一外部阻碍，Reviewer 总反证通过且没有阻断问题后，Task 4 才可标记为 `accepted` 并进入 Task 5。

## 10. Builder 开工追踪表

```text
当前Task：Task 4
当前批次：4A / 4B / 4C / 4D / 4E

读取的正式文档：
-

规格追踪：
| 标准ID | 实现文件 | 验证方法 | 禁止项或风险 |
|---|---|---|---|

允许修改：
-

明确不修改：
-

固定接口：
-

需要确认的歧义：
- 无 / 具体问题

计划验证：
-

外部验证：
- 无 / 微信开发者工具操作
```

涉及 Store 数量、Repository 接口、页面栈、路由隐私或生产调试入口的歧义时，必须先暂停并请求确认。

## 11. Task 4 总体验收报告格式

Builder 提交：

```text
Task 4状态：self-verified

批次状态：
- 4A 路由解析：
- 4B 导航适配：
- 4C Store与bootstrap：
- 4D 开发工具：
- 4E 总验证：

证据索引：
| 标准ID | 实现位置 | 测试/操作 | 产物 | 结果 |
|---|---|---|---|---|

命令结果：
- npm run verify:task4：
- Task 4定向测试：
- npm run test:run：
- npm run typecheck：
- npm run build:mp-weixin：

关键反证：
| 标准ID | 制造的错误 | 预期失败 | 实际结果 | 恢复后结果 |
|---|---|---|---|---|

开发与生产产物对照：
-

微信人工验证：
-

真实warning：
-

尚未验证或外部阻碍：
- 无 / 具体说明

接口、依赖或规格变化：
- 无 / 已确认决策链接

建议结论：
- 等待独立Reviewer，不自行宣布accepted
```

Reviewer 提交：

```text
复核范围：
- Task 4.1–4.6

复跑结果：
-

固定接口复核：
-

反证抽查：
| 标准ID | 制造的错误 | 验证是否失败 | 恢复后结果 |
|---|---|---|---|

阻断问题：
- 无 / 标准ID、证据和推荐修复

非阻断问题：
- 无 / 标准ID、证据和建议

外部阻碍：
- 无 / 具体说明与补验方式

未获批准的变化：
- 无 / 具体说明

结论：
- reviewer-accepted / needs-fix / externally-blocked
```

## 12. 使用原则

本文件细化的是验收闭环，不是继续扩张产品规格。

| 情况 | 处理方式 |
|---|---|
| 正式要求已有，实现遗漏 | 修实现与测试 |
| 文件存在但未接入应用 | 判定未完成，补真实接线 |
| 测试未发现错误行为 | 修验证方法并增加反证 |
| 正式规格确实冲突 | 提证据与 A/B 方案，等待确认 |
| 平台限制影响稳定栈 | 提供最小复现，不自行放宽导航合同 |
| 只有状态文档过时 | 独立验收通过后同步原文档 |

不得把“Store 单测通过”“组件可以 mount”或“微信构建成功”单独当作 Task 4 完成证据。

# Task 3 领域模型、单快照与 LocalMemoryRepository 验收标准

日期：2026-07-27  
状态：正式验收门槛  
适用范围：M0 Task 3.1–3.6

## 1. 文档职责

本文件把 Task 3 的正式规格转换为可以小批次执行、逐项取证、独立复核和明确退回的验收门。

本文件是验收标准，不是实现报告，也不新增产品、数据或架构规则。Builder 和 Reviewer 不得为了让当前代码通过而降低门槛；如平台能力与正式合同冲突，应先提交复现证据和 A/B 方案，经项目负责人确认后再修改正式规格与本文件。

相关真源：

- [AI 开发协作与验收协议](../rule/2026-07-27-ai-development-collaboration-protocol.md)
- [M0 工程骨架实施计划](../../product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md)
- [M0 工程骨架与设计系统决策记录](../../product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md)
- [微信小程序工程决策](../../product/technical/2026-07-20-wechat-miniapp-engineering-decision.md)

发生冲突时，以时间更新、范围更具体且已经确认的正式规格为准；Builder 不得自行选择更容易实现的一条。

## 2. Task 3 边界

Task 3 只建立与 UI 无关的数据核心：

```text
领域类型
→ 快照校验
→ StorageAdapter
→ LocalMemoryRepository
→ 数据层测试与构建验证
```

本 Task 不负责：

- Pinia Store、应用初始化、路由或开发面板；
- 页面、组件、视觉令牌和交互；
- CloudBase、真实账号、真实云存储或数据迁移后台；
- 编辑既有记忆照片；
- M1 数据结构或未来 schema 的猜测性实现。

允许创建和修改的正式文件，以实施计划 Task 3 文件清单为准。若必须修改清单外的生产文件，应先说明原因与影响；不得以“顺手完善”为由越过 Task 4–10。

## 3. 验收角色、状态与证据

### 3.1 角色

| 角色 | 职责 |
|---|---|
| 项目负责人 | 确认数据、接口或架构变化；决定是否接受规格调整 |
| Codex / 规划者 | 维护固定合同和关键里程碑验收 |
| DeepSeek Builder | 实现、自测、提交证据；不得自行宣布 `accepted` |
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

Task 3 是纯数据层任务，正常情况下不存在必须依赖 HBuilderX 或真机的外部阻碍。普通代码错误、测试失败、构建失败和环境未配置不得标记为 `externally-blocked`。

### 3.3 证据层

| 证据层 | 证明内容 |
|---|---|
| `M` 机器门 | 类型、接口、不变量、失败路径、原子性、构建与禁止项 |
| `A` 产物门 | 源码职责、构建产物、依赖边界和文件清单 |
| `H` 人工门 | 只读检查职责边界与证据真实性；Task 3 无视觉人工门 |

### 3.4 反证要求

每个内部批次至少选择一个高风险条件进行反证：

1. 临时制造一个明确错误；
2. 确认对应测试或扫描失败；
3. 恢复正确实现；
4. 重跑并确认通过。

反证不得把故意错误、临时脚本、调试输出或私人数据留在仓库。

### 3.5 总通过定义

Task 3 只有同时满足以下条件才能 `reviewer-accepted`：

- Task 3.1–3.6 的强制门全部通过；
- 固定领域类型与 `MemoryRepository` 接口没有漂移；
- 快照不变量、单草稿、照片生命周期、删除范围和失败原子性均有行为测试；
- 至少完成本文规定的关键反证；
- 数据层不依赖 Vue、Pinia、页面或组件；
- 没有新增未批准依赖和 Task 4+ 实现；
- 测试、类型检查和微信生产构建均成功；
- 没有 `TODO / FIXME / 以后替换 / placeholder` 或伪完成状态；
- Builder 只报告 `self-verified`，README 和总进度在独立验收前不提前改为完成。

## 4. 建议执行批次

为控制上下文和返工范围，Task 3 按以下小闭环实施：

| 批次 | 对应步骤 | 闭环产物 |
|---|---|---|
| Task 3A | 3.1–3.2 | 快照校验、版本保护、会话资产失效 |
| Task 3B | 3.3 | Repository 行为失败测试、确定性夹具 |
| Task 3C | 3.4 | StorageAdapter 与唯一 uni storage 边界 |
| Task 3D | 3.5 | LocalMemoryRepository、原子写入和删除范围 |
| Task 3E | 3.6 | 数据层总验证、构建、禁止项和状态收口 |

每个批次完成后先自证，再进入下一批次。批次通过不等于 Task 3 已正式完成。

## 5. Task 3A：快照校验与版本保护

### 5.1 验收目标

建立无平台依赖的纯函数边界，能够区分空值、合法快照、未来版本和非法数据，并在新会话中只降级 `session-only` 资产。

### 5.2 固定接口门

以下合同必须存在且语义一致：

```ts
export type SnapshotReadResult =
  | { kind: 'valid'; snapshot: MemorySnapshot }
  | { kind: 'empty' }
  | { kind: 'unsupported-version'; version: number }
  | { kind: 'invalid'; reason: string }

export function validateSnapshot(value: unknown): SnapshotReadResult
export function expireSessionAssets(snapshot: MemorySnapshot): MemorySnapshot
```

| ID | 机器门 |
|---|---|
| `T3A-M01` | `null` 或无已存快照返回 `kind: 'empty'`，不伪造为读取成功 |
| `T3A-M02` | `schemaVersion: 1` 且全部字段合法时返回 `kind: 'valid'` |
| `T3A-M03` | 大于当前版本的数值返回 `unsupported-version` 并保留真实版本号 |
| `T3A-M04` | 未来版本不得被转换成空样本、不得触发覆盖写入 |
| `T3A-M05` | 非对象、字段缺失、数组字段类型错误返回 `invalid` |
| `T3A-M06` | `spaces / memories / drafts / assets` 各集合内部的重复 ID 被拒绝 |
| `T3A-M07` | 记忆或草稿引用不存在的 `spaceId` 被拒绝 |
| `T3A-M08` | 同一空间出现两条草稿被拒绝 |
| `T3A-M09` | `assetIds` 的悬空引用、重复引用或错误归属被拒绝 |
| `T3A-M10` | 非法 `entry`、资产持久化状态、可用状态和 owner 类型被拒绝 |
| `T3A-M11` | `expireSessionAssets` 只把 `session-only` 资产转为 `expired` |
| `T3A-M12` | `bundled` 资产保持可用；其他实体内容不被改写 |
| `T3A-M13` | 校验和失效函数不修改传入对象 |
| `T3A-M14` | `snapshot-validation.ts` 不导入或调用 `uni`、Vue、Pinia、页面和组件 |

### 5.3 测试先行门

| ID | 机器门 |
|---|---|
| `T3A-M15` | 实现前的失败记录能证明测试因缺少校验能力而失败，而不是环境故障 |
| `T3A-M16` | 测试直接调用函数并检查返回结构，不只搜索源码字符串 |
| `T3A-M17` | 每种结果分支至少有一个正向样例；高风险非法分支有独立反例 |

### 5.4 产物门

| ID | 产物门 |
|---|---|
| `T3A-A01` | `src/repositories/snapshot-validation.ts` 存在且职责单一 |
| `T3A-A02` | `tests/unit/snapshot-validation.test.ts` 存在且可单独运行 |
| `T3A-A03` | 测试夹具不包含真实用户文本、真实照片路径或身份信息 |

### 5.5 反证抽查

Reviewer 至少执行两项：

- 临时让未来版本走空样本分支，测试必须失败；
- 临时允许同一空间两条草稿，测试必须失败；
- 临时让 `expireSessionAssets` 同时失效 `bundled` 资产，测试必须失败；
- 临时原地修改输入快照，纯函数性测试必须失败。

### 5.6 禁止捷径

- 只判断 `schemaVersion`，不检查实体和引用关系；
- 通过 `JSON.stringify` 是否成功代替领域校验；
- 遇到未知版本直接返回空样本；
- 校验失败时自动修复并覆盖原始数据；
- 在测试里复制另一套校验器，再用它验证生产校验器。

### 5.7 必需证据与退出条件

Builder 必须提交单测命令、退出码、测试用例名称以及至少一个失败前后记录。`T3A-M01` 至 `T3A-A03` 全部通过且反证成立后，Task 3A 才可进入 Reviewer 复核。

## 6. Task 3B：领域合同、夹具与 Repository 失败测试

### 6.1 验收目标

先锁定 Task 3 的领域实体、写入输入、Repository 输出和完整行为测试，使实现不能通过临时改接口逃避正式规则。

### 6.2 固定领域类型门

以下名称和语义不得漂移：

- `SampleMode`
- `RecordEntry`
- `AssetPersistence`
- `MemorySpace`
- `LocalAsset`
- `MemoryItem`
- `MemoryDraft`
- `MemorySnapshot`
- `NewSessionAssetInput`
- `MemoryAssetInput`
- `CreateSpaceInput`
- `UpdateSpaceInput`
- `SaveMemoryInput`
- `UpdateMemoryInput`
- `SaveDraftInput`
- `RepositoryWriteResult<T>`
- `MemoryRepository`

| ID | 机器门 |
|---|---|
| `T3B-M01` | `MemorySnapshot.schemaVersion` 固定为字面量 `1` |
| `T3B-M32` | `MemorySnapshot.hasCompletedOnboarding` 是必需布尔字段 |
| `T3B-M02` | `SaveMemoryInput.sourceDraftId` 固定为 `string \| null`，不是可选字段 |
| `T3B-M03` | 调用方输入不包含实体 ID、系统时间、owner、availability 或 persistence |
| `T3B-M04` | 新照片输入只有 `uri`，调用方不能声明为 `bundled` |
| `T3B-M05` | `UpdateMemoryInput` 只能修改原话或 AI 候选稿，不能修改照片 |
| `T3B-M06` | 所有写方法返回实体与完整成功快照，或按正式接口返回完整快照 |
| `T3B-M07` | `MemoryRepository` 方法名、参数和返回类型与跨任务接口完全一致 |
| `T3B-M08` | 类型文件不导入 Vue、Pinia、`uni` 或持久化实现 |

### 6.3 确定性测试基础门

| ID | 机器门 |
|---|---|
| `T3B-M09` | Repository 测试使用可控 `Clock`，不依赖真实当前时间 |
| `T3B-M10` | Repository 测试使用可控 `IdFactory`，不依赖随机碰运气 |
| `T3B-M11` | 内存 StorageAdapter 能记录 `get / set / remove` 并可注入写入失败 |
| `T3B-M12` | 每个测试隔离状态，不依赖执行顺序或前一个测试遗留 |
| `T3B-M13` | 失败测试针对缺少行为而失败，不因导入路径、语法或环境错误失败 |

### 6.4 样本夹具门

| ID | 机器门 |
|---|---|
| `T3B-M14` | 空样本满足合法 `MemorySnapshot` 且不伪造用户业务数据 |
| `T3B-M15` | 完整样本包含团团与豆豆两个空间 |
| `T3B-M16` | 完整样本覆盖有图、有草稿、无图和无记忆状态 |
| `T3B-M17` | 样本 ID、引用和资产归属全部通过正式快照校验 |
| `T3B-M18` | 样本照片只使用已批准的打包资源，不引用用户本机绝对路径 |

### 6.5 Repository 行为测试门

在实现 `LocalMemoryRepository` 前，失败测试至少覆盖：

| ID | 必测行为 |
|---|---|
| `T3B-M19` | 首次 bootstrap 建立并写入空样本 |
| `T3B-M33` | `completeOnboarding()` 原子写入 true、失败不改状态且重复调用幂等 |
| `T3B-M20` | 创建、修改、删除空间 |
| `T3B-M21` | 保存、修改、删除正式记忆 |
| `T3B-M22` | 同空间保存草稿执行 upsert，不产生第二条 |
| `T3B-M23` | 删除草稿只删除该草稿独占资产 |
| `T3B-M24` | 删除记忆只删除该记忆独占资产 |
| `T3B-M25` | 删除空间级联清理该空间的记忆、草稿和资产 |
| `T3B-M26` | 写入失败时内存快照保持原状 |
| `T3B-M27` | `resetSample('complete')` 返回合法完整样本 |
| `T3B-M34` | empty 样本首次状态为 false，complete 样本为 true |
| `T3B-M28` | 非空原话或至少一张照片的保存下限 |
| `T3B-M29` | 单条记忆最多 9 张照片 |
| `T3B-M30` | existing 资产必须属于当前空间或来源草稿 |
| `T3B-M31` | 草稿转正式记忆的创建、转移、删草稿为一次原子结果 |

### 6.6 产物门

| ID | 产物门 |
|---|---|
| `T3B-A01` | `src/types/domain.ts` 和 `src/types/repository.ts` 职责清楚 |
| `T3B-A02` | 空样本与完整样本分别位于已计划 fixture 文件 |
| `T3B-A03` | `tests/unit/local-memory-repository.test.ts` 可单独执行 |
| `T3B-A04` | 未新增与正式合同重复的第二套领域类型 |

### 6.7 反证抽查

Reviewer 至少执行两项：

- 把 `sourceDraftId` 临时改成可选字段，类型或合同检查必须失败；
- 移除写入失败后的内存保护，原子性测试必须失败；
- 允许同空间追加第二条草稿，单草稿测试必须失败；
- 把测试 Clock 换成真实时间，确定性检查或重复运行必须暴露问题。

### 6.8 禁止捷径与退出条件

禁止只做 TypeScript 编译检查、只断言数组长度、只检查方法存在，或在测试中直接改 Repository 私有状态。所有固定合同和失败行为必须有真实调用证据。

`T3B-M01` 至 `T3B-A04` 全部成立，失败测试失败原因正确后，Task 3B 才可进入实现批次。

## 7. Task 3C：StorageAdapter 与平台边界

### 7.1 验收目标

把平台存储调用压缩到唯一适配器，使 Repository 可在单元测试中完全脱离微信和 uni-app 运行时。

### 7.2 固定接口门

```ts
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}
```

| ID | 机器门 |
|---|---|
| `T3C-M01` | 接口方法、参数、泛型和 Promise 返回类型与正式计划一致 |
| `T3C-M02` | `UniStorageAdapter` 正确映射 `uni.getStorage / setStorage / removeStorage` |
| `T3C-M03` | 平台失败会 reject，不得吞错后伪装成功 |
| `T3C-M04` | 空键与无数据能按合同返回 `null`，不把平台响应对象泄漏给 Repository |
| `T3C-M05` | 除 `UniStorageAdapter` 外，Task 3 生产代码不直接调用 uni storage |
| `T3C-M06` | Repository 测试不要求微信开发者工具或全局 `uni` 对象 |

### 7.3 产物门

| ID | 产物门 |
|---|---|
| `T3C-A01` | `src/adapters/storage.ts` 只声明平台无关合同 |
| `T3C-A02` | `src/adapters/uni-storage.ts` 是 Task 3 唯一 uni storage 边界 |
| `T3C-A03` | 未引入第三方持久化依赖或额外业务 Storage 键 |

### 7.4 反证抽查

- 临时让 `set` 吞掉平台异常，错误传播测试必须失败；
- 临时在 Repository 直接调用 `uni.setStorage`，禁止项扫描必须失败。

### 7.5 禁止捷径与退出条件

禁止在 Repository 内判断测试环境并切换存储、禁止用全局变量替代依赖注入、禁止把业务校验塞进 StorageAdapter。

`T3C-M01` 至 `T3C-A03` 全部通过并完成一项反证后，Task 3C 才可 `self-verified`。

## 8. Task 3D：LocalMemoryRepository 与原子写入

### 8.1 验收目标

以单一版本化快照实现全部 M0 Repository 写操作，并保证任何失败都不会留下“存储失败但内存已成功”或“只完成一半”的状态。

### 8.2 单快照与 bootstrap 门

| ID | 机器门 |
|---|---|
| `T3D-M01` | 固定键为 `pet-memory:m0:snapshot` |
| `T3D-M02` | 业务数据不拆分到多个 Storage 键 |
| `T3D-M03` | 首次 bootstrap 写入合法空样本并返回其快照 |
| `T3D-M50` | 首次空样本使用 `hasCompletedOnboarding: false` |
| `T3D-M04` | 合法已存快照读取后执行会话资产失效，再建立内存状态 |
| `T3D-M05` | 未来 schema 返回明确失败，不覆盖原存储 |
| `T3D-M06` | 非法快照不被静默当成空样本覆盖；处理方式可追踪且不泄露私人内容 |
| `T3D-M07` | 重复 bootstrap 不意外追加样本实体或改变稳定打包资产 |
| `T3D-M51` | 旧 v1 缺字段按空间是否存在归一化；已有空间且 false 时修正 true，并保持所有业务数据 |

### 8.3 通用写入管线门

每个写操作必须遵循：

```text
读取当前内存快照
→ 创建不可变候选快照
→ 校验候选快照
→ StorageAdapter 写入成功
→ 替换 Repository 内存快照
→ 返回成功实体与完整快照
```

| ID | 机器门 |
|---|---|
| `T3D-M08` | 候选快照不原地修改当前内存快照 |
| `T3D-M09` | 候选快照必须经过正式校验后才写入 |
| `T3D-M10` | StorageAdapter 成功前不替换内存快照 |
| `T3D-M11` | 写入 reject 后内存快照和持久化旧值均保持不变 |
| `T3D-M12` | 返回快照与已提交状态一致，不返回旧对象或半成品 |
| `T3D-M13` | 调用方修改返回对象不能绕过 Repository 改变内部状态 |
| `T3D-M14` | ID 与 `createdAt / updatedAt` 由注入的 IdFactory 和 Clock 生成 |

### 8.4 空间操作门

| ID | 机器门 |
|---|---|
| `T3D-M15` | 创建空间生成 ID 和时间，新封面固定创建为 `session-only` |
| `T3D-M16` | 更新空间支持保留、移除和替换封面，且不影响记忆照片 |
| `T3D-M17` | 删除空间级联删除其记忆、草稿及所有归属资产 |
| `T3D-M18` | 操作不存在的空间返回明确失败，不产生新实体或部分写入 |

### 8.5 草稿操作门

| ID | 机器门 |
|---|---|
| `T3D-M19` | `saveDraft` 按 `spaceId` upsert 唯一草稿 |
| `T3D-M20` | upsert 保持合理的创建时间并更新修改时间 |
| `T3D-M21` | 新照片固定为 `session-only`，顺序与输入一致 |
| `T3D-M22` | existing 资产所有权和来源不合法时整次写入失败 |
| `T3D-M23` | 删除草稿清理其独占资产，不删除空间封面或正式记忆资产 |
| `T3D-M24` | 不存在或跨空间的草稿引用不会被误删 |

### 8.6 正式记忆操作门

| ID | 机器门 |
|---|---|
| `T3D-M25` | 原话为空且无照片时拒绝保存 |
| `T3D-M26` | 超过 9 张照片时拒绝保存 |
| `T3D-M27` | 资产顺序与用户输入顺序一致 |
| `T3D-M28` | 新资产归属为新记忆，existing 资产归属转换经过所有权校验 |
| `T3D-M29` | `updateMemory` 只修改指定原话或 AI 候选稿，并正确更新时间 |
| `T3D-M30` | `updateMemory` 不提供修改照片的隐藏通路 |
| `T3D-M31` | 删除记忆只清理其独占资产，不影响空间或其他记忆 |
| `T3D-M32` | 不存在的 memory ID 不得导致无关写入 |

### 8.7 草稿转正式记忆原子门

当 `sourceDraftId` 非空时，单次 `saveMemory` 必须同时完成：

```text
创建正式记忆
→ 将来源草稿资产转为正式记忆归属
→ 删除来源草稿
→ 校验单草稿不变量
→ 写入一次完整快照
```

| ID | 机器门 |
|---|---|
| `T3D-M33` | 来源草稿必须存在且属于输入 `spaceId` |
| `T3D-M34` | 草稿资产与新增资产合并后仍遵守顺序和 9 张上限 |
| `T3D-M35` | 成功后正式记忆存在、来源草稿不存在、资产 owner 全部正确 |
| `T3D-M36` | StorageAdapter 只提交一个候选快照，不先存记忆再删草稿 |
| `T3D-M37` | 任一校验失败时记忆、草稿和资产三者全部保持原状 |
| `T3D-M38` | StorageAdapter 写入失败时三者全部保持原状 |
| `T3D-M39` | Store 无需也不能通过两次 Repository 调用模拟该原子操作 |

### 8.8 样本重置门

| ID | 机器门 |
|---|---|
| `T3D-M40` | `resetSample('empty')` 提交合法空样本 |
| `T3D-M41` | `resetSample('complete')` 提交合法完整样本 |
| `T3D-M42` | 返回的 `sampleMode` 与请求一致 |
| `T3D-M43` | 重置也遵守“先写入成功、后替换内存” |
| `T3D-M44` | empty 重置写入 false，complete 重置写入 true |

### 8.9 首次说明状态写入门

| ID | 机器门 |
|---|---|
| `T3D-M45` | `completeOnboarding()` 只把 false 改为 true，不修改空间、记忆、草稿和资产 |
| `T3D-M46` | StorageAdapter 成功后才替换内存快照 |
| `T3D-M47` | 写入失败时字段和全部业务数据保持原状 |
| `T3D-M48` | 已为 true 时重复调用保持幂等，不产生数据漂移 |
| `T3D-M49` | 归一化和错误信息不输出完整快照或私人内容 |

### 8.10 产物与人工边界门

| ID | 门槛 |
|---|---|
| `T3D-A01` | `src/repositories/memory-repository.ts` 只承载稳定接口，不混入页面逻辑 |
| `T3D-A02` | `src/repositories/local-memory-repository.ts` 不导入 Vue、Pinia、页面或组件 |
| `T3D-A03` | 没有 CloudBase、账号、网络请求或真实 AI 实现 |
| `T3D-H01` | Reviewer 只读检查删除和原子写入代码路径，确认测试确实经过生产方法 |
| `T3D-H02` | Reviewer 检查错误与日志不包含用户原话、照片 URI 或完整快照 |

### 8.11 反证抽查

Reviewer 至少执行三项：

- 在 StorageAdapter 写入前替换内存快照，失败原子性测试必须失败；
- 将草稿删除拆成第二次写入，单次提交检查必须失败；
- 删除记忆时误删空间封面，删除范围测试必须失败；
- 跳过 existing 资产所有权校验，跨空间资产测试必须失败；
- 返回 Repository 内部对象引用，防御性复制测试必须失败；
- 允许第 10 张照片，数量边界测试必须失败。

### 8.12 禁止捷径

- Store 或页面组合两次写入弥补 Repository 原子性缺失；
- catch 后吞掉持久化错误并返回成功；
- 测试直接写私有快照来制造“成功结果”；
- 用浅拷贝假装不可变，但嵌套数组仍可污染旧状态；
- 为通过测试放宽固定类型或删除失败分支；
- 把会话临时照片描述为永久可靠数据；
- 在错误日志打印完整快照或私人内容。

### 8.13 必需证据与退出条件

Builder 必须提交：

- 每个公开方法对应的行为测试索引；
- 写入失败前后快照相等的证据；
- 草稿转正式记忆只调用一次 `set` 的证据；
- 删除范围测试；
- 至少三项反证记录。

`T3D-M01` 至 `T3D-H02` 全部通过后，Task 3D 才可进入总验证。

## 9. Task 3E：数据层总验证与交付收口

### 9.1 前置门

| ID | 机器门 |
|---|---|
| `T3E-M01` | Task 3A–3D 均已 `self-verified` |
| `T3E-M02` | 所有计划文件均存在，没有同职责重复实现 |
| `T3E-M03` | 固定接口对照正式计划无增删、改名或语义漂移 |

### 9.2 单一验证入口

Task 3 应建立：

```powershell
npm run verify:task3
```

该命令至少串联：

```text
Task 3 定向单测
→ TypeScript 类型检查
→ 微信生产构建
→ 固定接口和禁止项扫描
```

| ID | 机器门 |
|---|---|
| `T3E-M04` | 任一子命令失败时 `verify:task3` 返回非零退出码 |
| `T3E-M05` | 定向运行两份 Task 3 单测全部通过 |
| `T3E-M06` | 全量 `npm run test:run` 通过，无 Task 1–2 回归 |
| `T3E-M07` | `npm run typecheck` 通过 |
| `T3E-M08` | `npm run build:mp-weixin` 通过 |
| `T3E-M09` | 实际 warning 原样报告，不把 warning 数量写成未经验证的 0 |
| `T3E-M10` | 重复运行 Task 3 测试结果稳定，不依赖时间、随机或顺序 |

### 9.3 边界与禁止项扫描

| ID | 机器门 |
|---|---|
| `T3E-M11` | Task 3 数据层不存在 Vue、Pinia、页面或组件依赖 |
| `T3E-M12` | 只有 `UniStorageAdapter` 直接使用 uni storage API |
| `T3E-M13` | 生产代码中只有固定快照键，无第二套业务存储键 |
| `T3E-M14` | 无 `TODO / FIXME / placeholder / 以后替换` |
| `T3E-M15` | 无调试日志、完整快照输出和真实私人测试内容 |
| `T3E-M16` | 无未批准依赖、CloudBase 或 Task 4+ 实现 |
| `T3E-M17` | 没有为了通过测试而跳过、过滤或仅运行部分用例 |

### 9.4 产物门

| ID | 产物门 |
|---|---|
| `T3E-A01` | 微信生产构建真实包含 Task 3 代码，或有明确的入口引用链证明它可被后续 Store 使用 |
| `T3E-A02` | 构建目录中无测试夹具、测试日志和临时调试文件泄漏 |
| `T3E-A03` | package 与 lockfile 一致，没有无说明依赖变化 |
| `T3E-A04` | 工作区没有本轮产生的临时反证文件和失败快照 |

### 9.5 文档状态门

| ID | 状态门 |
|---|---|
| `T3E-A05` | Builder 自证后只报告 `self-verified` |
| `T3E-A06` | 独立验收前不把 Task 3、README 总进度或下一阶段写成正式完成 |
| `T3E-A07` | Reviewer 通过后再同步 Task 3.1–3.6 复选框和总计数 |
| `T3E-A08` | 若出现获批的接口或架构变化，先同步正式规格，再更新验收标准 |

### 9.6 Reviewer 总反证

Reviewer 至少从以下高风险项中抽查四项：

1. 未来 schema 不被覆盖；
2. 同空间第二条草稿被拒绝；
3. 写入失败不修改内存快照；
4. 草稿转正式记忆为单次提交；
5. 删除范围不越界；
6. existing 资产不能跨空间窃取；
7. 返回值不能污染 Repository 内部状态；
8. 第 10 张照片被拒绝。

### 9.7 退出条件

`T3E-M01` 至 `T3E-A08` 全部通过，Reviewer 总反证通过且无阻断问题后，Task 3 才可标记为 `accepted` 并允许进入 Task 4。

## 10. Builder 开工追踪表

Builder 在编码前提交：

```text
当前Task：Task 3
当前批次：3A / 3B / 3C / 3D / 3E

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
```

存在影响固定接口、数据语义、删除范围、照片生命周期或架构边界的歧义时，必须先暂停并请求确认。

## 11. Task 3 总体验收报告格式

Builder 提交：

```text
Task 3状态：self-verified

批次状态：
- 3A 快照校验：
- 3B 合同与失败测试：
- 3C 存储适配器：
- 3D Repository与原子写入：
- 3E 总验证：

证据索引：
| 标准ID | 实现位置 | 测试/操作 | 结果 |
|---|---|---|---|

命令结果：
- npm run verify:task3：
- Task 3定向测试：
- npm run test:run：
- npm run typecheck：
- npm run build:mp-weixin：

关键反证：
| 标准ID | 制造的错误 | 预期失败 | 实际结果 | 恢复后结果 |
|---|---|---|---|---|

写入失败与原子性证据：
-

删除范围证据：
-

真实warning：
-

尚未验证：
- 无 / 具体说明

接口、依赖或规格变化：
- 无 / 已确认决策链接

建议结论：
- 等待独立Reviewer，不自行宣布accepted
```

Reviewer 提交：

```text
复核范围：
- Task 3.1–3.6

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

未获批准的变化：
- 无 / 具体说明

结论：
- reviewer-accepted / needs-fix
```

## 12. 使用原则

本文件的作用是让 Task 3 形成小闭环，不是继续无限扩写产品规格。

遇到失败时先分类：

| 情况 | 处理方式 |
|---|---|
| 正式合同已定义，实现遗漏 | 修代码和测试 |
| 测试未能发现错误实现 | 修验证方法和反证 |
| 正式规格确实缺失 | 提方案并等待确认 |
| 平台能力与合同冲突 | 提复现证据和 A/B 方案 |
| 只有状态文档过时 | 验收通过后同步原文档 |

不得把 Builder 的普通执行错误自动解释为“规格还不够细”，也不得用更多测试数量代替对高风险不变量的真实覆盖。

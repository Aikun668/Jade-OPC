# My-OPC 文档索引

## 交付阶段命名

现行文档统一使用以下阶段名称，避免“首版”“首批”和“第一阶段”指向不同范围：

| 阶段 | 名称 | 范围 |
|---|---|---|
| `M0` | 本地 Mock 骨架 | 本地匿名会话、可替换 mock、本地文字数据、受控 AI mock 与交互验收；不接真实 CloudBase、真实 AI 或云端照片 |
| `M1` | CloudBase Private Alpha | 邀请制私密测试版；接入微信身份、CloudBase 私密读写、云端照片、真实 AI、删除与导出 |
| `M2` | 后续验证能力 | 在 M1 真实反馈之后再决定的提醒、分享、纪念创作与其他扩展 |

“长期产品原则”不表示某项能力属于 `M0` 或 `M1`；具体交付范围始终以 MVP、工程决策和当前规格为准。

## 产品基础

长期有效的产品定位、业务规则与场景定义位于 [product/foundation](product/foundation/)。

- [核心说明书](product/foundation/2026-07-15-pet-memory-core-design.md)
- [核心业务规则](product/foundation/2026-07-16-pet-memory-core-business-rules.md)
- [场景地图](product/foundation/2026-07-16-pet-memory-scenario-map.md)
- [用户场景业务逻辑](product/foundation/2026-07-16-pet-memory-user-scenarios.md)

## 正式 MVP

`M1` 在进入技术实施前，应以 [正式 MVP 决策书](product/mvp/2026-07-20-formal-mvp-decision.md) 作为范围与边界基线。

执行计划位于 [product/plans](product/plans/)。

当前的 [M0 工程骨架实施计划](product/plans/2026-07-23-m0-engineering-skeleton-implementation-plan.md) 已完成 Task 1–10 的计划编写、Task 2 专项规格确认和 2026-07-26 开工前审计。CLI 目录、Node 支持周期、Repository 写入类型与原子性、共享组件归属、页面文件影响、导航与返回栈、HBuilderX / 微信开发者工具预览分级和最终视觉验收均已同步。Task 1 CLI 基线已通过（1.1–1.6 完成，typecheck/test/build 均通过），S 阶段模拟器验证待微信开发者工具就绪（1.7 外部阻塞）；Task 2 self-verified（2.1–2.9 全部通过，197 tests，9 个修复批次完成，13 组件进入微信构建路径，归一化脚本真实运行，0 warnings，typecheck/build 全部通过，等待独立复核）。Task 3–10 尚未实施。总计：15 已执行，1 外部阻塞，55 未执行。

[M0 设计原型与视觉基准计划](product/plans/2026-07-23-m0-design-prototype-and-visual-baseline-plan.md) 已完成独立设计原型、13 张标准页面图和浏览器视觉 QA。用户已确认最终空间首页图片，并将其设为唯一视觉母版；其余 12 张页面图继续以浏览器原型截图为准。页面图位于 [M0 页面视觉基准](product/assets/m0-page-baselines/README.md)。Task 2 专项规格确认并完成代码实施（tokens/globals/13 组件/visual regression script），197 测试通过，self-verified。

## 工程决策

[微信小程序工程决策](product/technical/2026-07-20-wechat-miniapp-engineering-decision.md) 已锁定 `uni-app + Vue 3 + HBuilderX` 与腾讯云 CloudBase 的职责边界。后续工程与页面实现必须遵守该文档。

## 项目执行与复盘

[Task 1 工程执行复盘](project/retrospectives/2026-07-26-task-1-execution-retrospective.md) 记录工程骨架实施中暴露的执行与收口问题，并约束后续 Builder 如何划清 Task 边界、验证真实工具链、同步文档状态和报告完成结论。

## 项目验收标准

[Task 2 设计系统与核心展示组件验收标准](project/acceptance/2026-07-27-task-2-design-system-acceptance-standard.md) 与 [Task 3 领域模型、单快照与 LocalMemoryRepository 验收标准](project/acceptance/2026-07-27-task-3-domain-repository-acceptance-standard.md) 将正式规格转换为 Builder 自证、独立 Reviewer 反证和小批次收口所使用的验收门；它们不替代产品规格和实施计划。

## 进行中的页面与设计决策

[M0 工程骨架与设计系统决策记录](product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md) 汇总当前已确认的页面范围、草稿规则、AI mock、视觉、按钮和照片细节；未确认项仍按“先提案、后确认、再落档”的顺序处理。

[M0 设计系统工程执行规格](product/specs/2026-07-24-m0-design-system-engineering-spec.md) 已完整定义并确认视觉真源、统一测量坐标、全局设计令牌、页面布局算法、核心组件施工合同、状态矩阵、照片展示、草稿材质、13 页装配与视觉回归验收。它现在是 Task 2 的唯一工程真源；规格完成不表示代码已经实施。

## 历史验证记录

可点击验证原型的设计说明与实施计划保存在 [archive/prototype-validation](archive/prototype-validation/)。对应的可运行原型、测试、截图和参考素材保存在仓库根目录的 [archive/prototype-validation](../archive/prototype-validation/)。

历史内容可供回溯，但不应成为正式产品的实现目录或新增规则来源。

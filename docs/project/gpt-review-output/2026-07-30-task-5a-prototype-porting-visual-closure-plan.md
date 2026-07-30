# Task 5A 浏览器原型移植与视觉闭环临时实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. 本项目当前不授权自动创建 Git 提交；除非用户另行确认，执行者只修改、验证和报告，不提交、不推送。

**Goal:** 以已通过用户观感确认的浏览器设计原型和正式页面基准为输入，修复 Task 5A 的 02、04、08 三个微信小程序页面，建立一条可复用但暂不固化为 Skill 的“原型移植 → 微信实装 → 视觉校准 → 独立验收”闭环。

**Architecture:** 正式页面基准图负责最终视觉裁决，设计系统规格和令牌负责工程边界，浏览器原型 JSX/CSS/资产负责提供结构与比例参考，小程序现有 Store、Repository、NavigationAdapter 和页面状态机继续负责真实业务行为。Builder 负责确定性移植和平台适配，逻辑 Reviewer 负责行为与工程反证，有视觉能力的 Codex/用户负责页面截图校准和最终视觉通过。

**Tech Stack:** React/TypeScript 浏览器参考原型、Vue 3、uni-app、TypeScript、Pinia、SCSS/WXSS、Vitest、微信开发者工具、PNG 视觉基准。

## Global Constraints

- 本计划是 Task 5A 修复期的临时实施计划，不替代产品规格、Task 2 设计系统规格、Task 5A 验收标准或已确认视觉基准。
- 本轮只处理 02“我的记忆空间”、04“Ta 的空间首页”、08“全部记忆”及其直接依赖的共享视觉基础。
- Task 5B 和后续页面只记录“后续沿用本方法”，不在本计划内提前施工或改变页面所有权。
- 不新增生产依赖，不更换 Vue、uni-app、Pinia、Repository 或 NavigationAdapter。
- 不复制浏览器原型的 React 状态、模拟路由、设备外框、状态栏、键盘运行时或 Mock 数据访问方式。
- 不复制浏览器专用的通配符、标签、ID、属性选择器，也不把未经验证的 `clip-path`、伪元素或 px 值直接写入 WXSS。
- 页面和组件不得直接访问 storage 或 Repository，既有调用方向保持“页面 → Store → Repository”。
- 不修改 Task 2 共享组件的公开 Props、Events、Slots；确需修正内部样式时，必须有回归测试并保持公开合同不变。
- 设计令牌继续是颜色、字号、间距、圆角、阴影和动画的工程真源；不得为了贴图在页面中散落私有视觉常量。
- 微信开发者工具真实截图是视觉验收证据；浏览器截图、组件快照和 CLI 构建不能替代微信视觉检查。
- 未经用户明确授权，不创建 Git commit，不推送远程，不创建 PR。

---

## 1. 为什么需要本计划

Task 5A 当前已经证明：

```text
逻辑、类型和 CLI 构建可以通过
≠
微信页面已经达到已确认视觉
```

现有失败不是“规格没有写”，而是以下执行链没有闭合：

1. Builder 主要根据文字合同重新推导页面，没有充分复用已经验证过的浏览器原型结构；
2. 无视觉能力 Reviewer 能检查节点和文件，却不能独立裁决留白、密度、层级和整体观感；
3. `verify:task5a` 的视觉证据路径错误，证据目录缺失时只 `SKIP`，不会阻止通过；
4. 样本快照引用照片 URI，但对应 bundled 文件不存在；
5. 微信 `<button>` 的默认边框和文本对齐泄漏到返回、更多、列表条目和低强调操作；
6. Builder 修复了 `error → ready` 等确定性问题，但没有完成“截图 → 对照 → 调整 → 再截图”的视觉循环。

本计划的目标不是让 Builder 获得视觉判断能力，而是改变输入、分工和退出条件，使不同能力的角色各司其职。

## 2. 事实来源层级

发生视觉或实现冲突时，严格按以下顺序裁决：

### 2.1 第一优先级：最终确认的页面基准

```text
docs/product/assets/m0-page-baselines/02-spaces.png
docs/product/assets/m0-page-baselines/04-space-home.png
docs/product/assets/m0-page-baselines/08-memories.png
```

04 同时以以下高分辨率母版为唯一视觉真源：

```text
docs/product/assets/2026-07-23-space-home-visual-master-v0.1.png
```

基准图负责裁决：

- 最终布局和视觉层级；
- 页面密度和留白；
- 照片所占视觉重量；
- 主操作和低强调操作的关系；
- 04 草稿纸、胶带、撕边、“继续写”位置和主按钮布局。

### 2.2 第二优先级：正式设计系统与任务合同

```text
docs/product/specs/2026-07-24-m0-design-system-engineering-spec.md
docs/product/specs/2026-07-21-initial-engineering-skeleton-and-design-system-decisions.md
docs/project/acceptance/2026-07-28-task-5a-space-browsing-acceptance-standard.md
apps/pet-memory-miniapp/src/styles/tokens.scss
```

它们负责裁决：

- 组件公开接口；
- 颜色、字号、间距、圆角和动效令牌；
- 页面状态和失败行为；
- 照片失效、加载和资源边界；
- 微信截图、响应式和真机门。

### 2.3 第三优先级：浏览器原型参考代码

```text
apps/pet-memory-design-prototype/src/Prototype.tsx
apps/pet-memory-design-prototype/src/prototype.css
apps/pet-memory-design-prototype/public/assets/pet-memory/
```

原型负责提供：

- 页面和局部组件的稳定结构；
- 内容顺序；
- 图片、正文、箭头之间的关系；
- 平面列表而非卡片列表的表达；
- 已经验证过的相对间距、比例和文本对齐；
- 原型样本照片。

原型不自动成为正式产品代码。

### 2.4 第四优先级：Builder 自行推导

只有前三层没有答案，且不涉及新的产品、视觉、数据或架构决策时，Builder 才能做低风险内部实现选择。任何会改变最终观感的选择必须交给视觉负责人确认。

## 3. 04 首页特殊例外

04 不允许把旧浏览器原型 CSS 当作最终视觉答案。

可以参考：

- `SpaceHomeScreen` 的内容顺序；
- 身份区由照片和名称构成；
- 草稿位于身份区之后；
- 主操作位于草稿之后；
- “最近留下”使用平面记忆行；
- “查看全部记忆”是低强调操作；
- 现有页面交互目标和组件拆分。

不能直接照抄：

- `.draft-notice` 的伪元素、`clip-path` 和浏览器纸张效果；
- `.home-primary-action { width: 56% }`；
- 旧原型的纸张高度、胶带位置和撕边；
- 旧原型中与最终母版不一致的局部间距和比例。

04 的草稿材质和主操作必须以 `04-space-home.png`、高分辨率母版和 Task 2 已确认令牌为准。

## 4. 角色分工与权限

### 4.1 Builder

Builder 负责：

- 阅读本计划和对应原型源代码；
- 建立源代码到小程序文件的映射；
- 补齐 bundled 样本资产；
- 处理 Vue/WXSS 平台适配；
- 修正共享组件内部的微信按钮 reset；
- 保持 Store、Repository、NavigationAdapter 和页面状态逻辑；
- 编写能够失败的资源、结构和行为测试；
- 运行自动验证；
- 取得微信截图并提交证据；
- 只报告 `self-verified`。

Builder 不负责：

- 自行重新设计页面；
- 判断“整体已经好看”；
- 改变已确认视觉方向；
- 用自己的实现反向修改基准；
- 省略截图循环；
- 宣布 `visual-accepted` 或 `reviewer-accepted`。

### 4.2 逻辑 Reviewer

逻辑 Reviewer 负责：

- 数据、状态、路由和错误恢复反证；
- 检查实现是否使用现有架构；
- 检查原型映射是否完整；
- 检查浏览器不兼容 CSS 没有直接进入 WXSS；
- 检查图片文件、URI 和构建产物一致；
- 检查证据数量、尺寸、状态和生成来源；
- 检查自动验证没有 `SKIP` 视觉门；
- 只对逻辑与工程结果给出结论。

逻辑 Reviewer 不拥有最终视觉通过权。

### 4.3 视觉负责人（Codex/用户）

视觉负责人负责：

- 对照基准和真实微信截图；
- 判断层级、留白、密度、照片比例和按钮重量；
- 先校准 04 黄金页面；
- 标记每轮最主要的 3–5 个视觉偏差；
- 必要时直接修正关键视觉样式；
- 只有视觉负责人可以给出 `visual-accepted`。

### 4.4 最终状态

Task 5A 只有同时具备：

```text
Builder: self-verified
逻辑 Reviewer: logic-accepted
视觉负责人: visual-accepted
```

才能进入：

```text
Task 5A: reviewer-accepted
```

任何单项缺失都不得开始 Task 5B 正式施工。

## 5. 页面映射总表

| 页面 | 最终视觉真源 | 原型结构源 | 原型样式源 | 小程序目标 |
|---|---|---|---|---|
| 02 我的记忆空间 | `02-spaces.png` | `Prototype.tsx` 的 `SpacesScreen` | `.spaces-intro`、`.space-list`、`.space-item`、`.space-placeholder` | `src/pages/spaces/index.vue` |
| 04 Ta 的空间首页 | `04-space-home.png` 与高分辨率母版 | `SpaceHomeScreen`、`DraftNotice`、`MemoryRow` | `.pet-identity`、`.memory-row`；草稿和主按钮仅辅助理解 | `src/pages/space-home/index.vue`、`DraftNotice.vue`、`MemoryEntry.vue` |
| 08 全部记忆 | `08-memories.png` | `MemoriesScreen`、`MemoryRow` | `.archive-heading`、`.memory-row`、`.archive-end` | `src/pages/memories/index.vue`、`MemoryList.vue`、`MemoryEntry.vue` |

## 6. 固定视觉结构

### 6.1 02 我的记忆空间

必须保持：

```text
自定义导航：居中“我的记忆空间” + 右侧无外框加号
→ 一句低强调说明
→ 顶部分割线
→ 团团平面条目：照片 | 名称/摘要/日期 | 箭头
→ 条目分割线
→ 豆豆平面条目：带“豆”的占位图 | 名称/空说明 | 箭头
→ 底部分割线
→ 低强调“再为一位 Ta 创建空间”
```

禁止：

- 条目外出现圆角矩形卡片；
- 团团图片缺失或请求不存在的 URI；
- 豆豆占位只显示无内容的淡色方块；
- 正文居中；
- 加号和底部创建操作显示微信默认按钮边框；
- 用大号主按钮替代低强调创建入口。

### 6.2 04 Ta 的空间首页

必须保持：

```text
自定义导航：返回 | 页面标题 | 无外框更多操作
→ 横向身份区：团团照片 + 团团名称
→ 最终母版草稿纸
→ 与母版一致的橄榄主操作
→ 分割线与“最近留下”
→ 平面记忆行：缩略图 | 摘要/日期 | 箭头
→ 低强调“查看全部记忆”
```

禁止：

- 因照片文件不存在而只留下孤立的大标题；
- 把记忆行渲染成居中卡片；
- 让返回、更多、继续写或查看全部记忆出现微信默认按钮框；
- 直接复制旧原型的草稿 `clip-path`；
- 用旧原型的 `56%` 主按钮宽度覆盖最终母版；
- 修改 DraftNotice 的公开事件或页面导航合同。

### 6.3 08 全部记忆

必须保持：

```text
自定义导航：返回 | 全部记忆
→ 内容头：左侧“团团” + 右侧“2 段记忆”
→ 内容头下分割线
→ 两条平面记忆行，照片与正文左对齐
→ 固定结束文案
```

禁止：

- 把内容头写成纵向居中；
- 把每条记忆写成有外框卡片；
- 让按钮默认 `text-align: center` 泄漏到正文；
- 缺失缩略图；
- 混入草稿或 AI 候选稿；
- 把结束文案变成操作按钮。

## 7. 文件地图

### 7.1 主要参考文件

```text
apps/pet-memory-design-prototype/
├─ src/Prototype.tsx
├─ src/prototype.css
├─ docs/visual-source.md
└─ public/assets/pet-memory/
   ├─ tuantuan-portrait.png
   ├─ tuantuan-window.png
   └─ tuantuan-sleeping.png
```

### 7.2 预期修改文件

```text
apps/pet-memory-miniapp/
├─ src/
│  ├─ components/
│  │  ├─ PageShell.vue
│  │  ├─ PrimaryButton.vue
│  │  ├─ TextAction.vue
│  │  ├─ DraftNotice.vue
│  │  ├─ MemoryEntry.vue
│  │  └─ MemoryList.vue
│  ├─ fixtures/complete-snapshot.ts
│  └─ pages/
│     ├─ spaces/index.vue
│     ├─ space-home/index.vue
│     └─ memories/index.vue
├─ static/fixtures/
├─ tests/
│  ├─ components/
│  │  ├─ spaces-page.test.ts
│  │  ├─ space-home-page.test.ts
│  │  └─ memories-page.test.ts
│  └─ unit/
├─ scripts/verify-task5a.mjs
└─ package.json
```

只有实际阻碍本计划的文件才允许修改。不要借本轮进行 Task 2 全量重构。

### 7.3 视觉证据目录

正式使用仓库根目录下的：

```text
docs/project/gpt-review-output/task5a-evidence/
```

不得使用错误位置：

```text
apps/pet-memory-miniapp/docs/project/gpt-review-output/task5a-evidence/
```

证据目录最终必须包含：

```text
02-spaces-implementation.png
02-spaces-side-by-side.png
02-spaces-overlay.png
02-spaces-diff.png
04-space-home-implementation.png
04-space-home-side-by-side.png
04-space-home-overlay.png
04-space-home-diff.png
08-memories-implementation.png
08-memories-side-by-side.png
08-memories-overlay.png
08-memories-diff.png
report.md
```

## 8. 执行批次

### Task 1：冻结状态并建立移植追踪表

**Files:**

- Create: `docs/project/gpt-review-output/task5a-evidence/report.md`
- Read: `docs/project/gpt-review-output/2026-07-29-task-5a-review-needs-fix.md`
- Read: 本计划第 2–7 节列出的真源与映射

**Produces:**

- 一张逐页追踪表；
- 当前截图状态；
- 资源、结构、样式、行为和证据的责任归属；
- 明确的未验证项。

- [ ] **Step 1: 在报告中记录当前状态**

固定写入：

```text
Task 5A 状态：needs-fix
Task 5B：冻结
当前自动验证：不能证明视觉通过
当前视觉证据：不完整
最终视觉负责人：Codex/用户
```

- [ ] **Step 2: 建立逐页映射表**

每页至少包含：

```text
页面
基准文件
原型 JSX 段
原型 CSS 段
小程序目标文件
允许参考内容
禁止复制内容
当前最大偏差
负责人
状态
```

- [ ] **Step 3: 记录工作区已有修改**

运行：

```powershell
git status --short
```

将与本轮有关和无关的修改分开记录。不得覆盖无关用户改动。

- [ ] **Step 4: Reviewer 检查追踪表**

PASS 条件：

- 三个页面都有映射；
- 04 特殊规则单独列出；
- 没有把原型代码声明成第一视觉真源；
- 没有开始 Task 5B。

### Task 2：补齐并验证 bundled 样本照片

**Files:**

- Source: `apps/pet-memory-design-prototype/public/assets/pet-memory/*.png`
- Create: `apps/pet-memory-miniapp/static/fixtures/`
- Modify: `apps/pet-memory-miniapp/src/fixtures/complete-snapshot.ts`
- Modify: `apps/pet-memory-miniapp/scripts/verify-task5a.mjs`
- Test: `apps/pet-memory-miniapp/tests/unit/local-memory-repository.test.ts`
- Test: Task 5A 页面组件测试

**Consumes:**

- 原型已批准的团团照片；
- `MemorySnapshot.assets` 现有合同。

**Produces:**

- 微信构建可访问的 bundled 资源；
- 快照 URI 与实际文件一致；
- 构建后资源存在性硬门。

- [ ] **Step 1: 写资源存在性失败测试**

测试必须逐项验证完整样本的每个：

```ts
persistence === 'bundled' && availability === 'available'
```

资源都能映射到 `static/` 下的真实文件。

- [ ] **Step 2: 运行测试并确认当前失败**

预期原因：

```text
/static/fixtures/tuantu-cover.*
/static/fixtures/tuantu-photo1.*
/static/fixtures/tuantu-photo2.*
/static/fixtures/tuantu-draft.*
```

至少一项不存在。

- [ ] **Step 3: 建立明确的资源映射**

资源必须来自现有原型资产，不从网络下载，不使用真实私人照片。映射记录在 `report.md`：

```text
原型源文件
目标文件
使用场景
目标 URI
尺寸
SHA-256
```

如果一张原型照片需要用于多个 Mock 场景，可以复用 URI；不得复制多份相同文件伪装成不同资产。

- [ ] **Step 4: 更新快照 URI**

只更新 URI 和必要的测试夹具，不改变空间、记忆、草稿和资产归属合同。

- [ ] **Step 5: 验证源码资源**

运行定向测试，预期全部 PASS。

- [ ] **Step 6: 构建并验证产物资源**

运行：

```powershell
npm run build:mp-weixin
```

然后逐项检查 `dist/build/mp-weixin/static/fixtures/` 中的文件。

PASS 条件：

- 源码和产物文件都存在；
- 路径大小写一致；
- 图片可解码；
- 02、04、08 不请求不存在的 URI。

### Task 3：建立微信按钮视觉 reset

**Files:**

- Modify only as needed:
  - `src/components/PageShell.vue`
  - `src/components/PrimaryButton.vue`
  - `src/components/TextAction.vue`
  - `src/components/DraftNotice.vue`
  - `src/components/MemoryEntry.vue`
  - `src/pages/spaces/index.vue`
- Test: existing Task 2 and Task 5A component tests

**Produces:**

- 返回、更多、加号、列表条目和低强调操作没有微信默认外框；
- 文本对齐不依赖平台默认值；
- 不引入组件 WXSS 禁止选择器。

- [ ] **Step 1: 写失败测试或产物扫描**

至少证明：

- 所有交互按钮拥有自己的 class；
- 列表按钮显式左对齐；
- class 级伪元素 reset 存在；
- 不依赖 `button` 标签选择器；
- 不生成 ID 或属性选择器。

- [ ] **Step 2: 运行测试确认能够暴露当前问题**

当前至少应暴露：

- `MemoryEntry` 没有显式 `text-align: left`；
- 多个 button class 没有消除微信默认 `::after`；
- 低强调操作在真实微信截图中出现外框。

- [ ] **Step 3: 实施最小内部样式修正**

要求：

- 只使用组件 class；
- `border`、`background`、`padding`、`line-height`、`text-align` 明确；
- class 级 `::after` 清除微信默认边框；
- 不使用全局 `button` 标签选择器；
- 不修改公开 Props/Events/Slots。

- [ ] **Step 4: 运行 Task 2 与 Task 5A 定向测试**

PASS 条件：

- 公开合同不变；
- 事件只发出一次；
- Task 2 组件回归通过；
- 产物没有新增禁止选择器。

- [ ] **Step 5: 微信现场检查**

检查：

```text
02：右上加号、空间条目、底部创建
04：返回、更多、继续写、查看全部
08：返回、两条记忆
```

任何可见矩形默认边框都视为失败。

### Task 4：校准 04 黄金页面

**Files:**

- Modify: `src/pages/space-home/index.vue`
- Modify as needed: `src/components/DraftNotice.vue`
- Modify as needed: `src/components/MemoryEntry.vue`
- Modify as needed: `src/components/MemoryList.vue`
- Test: `tests/components/space-home-page.test.ts`
- Evidence: `docs/project/gpt-review-output/task5a-evidence/04-*`

**Consumes:**

- 04 最终母版；
- `SpaceHomeScreen` 的内容顺序；
- 已修复的图片资源和按钮基础；
- 现有 Store、路由和页面状态。

**Produces:**

- 第一张达到 `visual-accepted` 的黄金页面；
- 后续 02/08 共用的列表和按钮视觉基础。

- [ ] **Step 1: 先写结构失败测试**

测试固定顺序：

```text
identity
draft
primary action
recent heading
memory list
view all
```

并验证照片、草稿、最近记忆和导航使用真实 view model，而不是页面硬编码。

- [ ] **Step 2: 记录母版分区**

在 `report.md` 中按以下区域记录：

```text
A 自定义导航
B 身份区
C 草稿纸
D 主操作
E 最近留下标题
F 记忆行
G 查看全部
```

每区写：

- 目标位置和关系；
- 当前截图偏差；
- 原型可参考部分；
- 最终母版覆盖部分。

- [ ] **Step 3: 修正身份区**

PASS 条件：

- 照片真实加载；
- 图片与名称横向组成一个身份区；
- 导航标题和内容身份区不产生无照片的重复大标题感；
- 图片尺寸使用已确认令牌；
- 320/393/480 宽度均不挤压胶囊或正文。

- [ ] **Step 4: 校准 DraftNotice**

PASS 条件：

- 使用正式 PNG 材质；
- 纸张、胶带、撕边和阴影以最终母版为准；
- 加载失败有低成本降级；
- “继续写”完整可点击；
- 不复制旧浏览器 `clip-path`；
- 不出现微信默认按钮框。

- [ ] **Step 5: 校准主操作**

PASS 条件：

- 宽度、位置、上下留白和视觉重量与最终母版一致；
- 仍使用 `PrimaryButton`；
- 不在页面中新增私有颜色或字号；
- 不采用旧原型固定 `56%` 作为未经验证的答案。

- [ ] **Step 6: 校准最近记忆**

PASS 条件：

- 缩略图存在；
- 摘要和日期左对齐；
- 箭头在右；
- 使用平面分割线，不出现卡片框；
- 低强调“查看全部记忆”不抢主操作。

- [ ] **Step 7: 取得第一张微信截图**

条件：

```text
393 × 852 CSS px
complete / ready
团团样本
DevPanel、键盘、光标和性能面板关闭
图片加载与动画稳定
```

- [ ] **Step 8: 生成 04 比较产物**

生成：

```text
04-space-home-side-by-side.png
04-space-home-overlay.png
04-space-home-diff.png
```

- [ ] **Step 9: 视觉负责人给出一轮最多 5 项偏差**

每项必须包含：

```text
区域
现状
目标
修正方向
责任人
优先级
```

- [ ] **Step 10: 循环修正直到 04 visual-accepted**

不得在 04 通过前同时大改 02 和 08。每轮必须替换实现截图并重新生成比较图。

### Task 5：按原型结构移植 02

**Files:**

- Modify: `src/pages/spaces/index.vue`
- Modify as needed: shared button/list primitives already calibrated by Task 4
- Test: `tests/components/spaces-page.test.ts`
- Evidence: `docs/project/gpt-review-output/task5a-evidence/02-*`

**Produces:**

- 平面空间列表；
- 团团真实照片；
- 豆豆有字符的正式占位；
- 与 04 一致的按钮、分割线和文字层级。

- [ ] **Step 1: 写结构测试**

必须验证：

- 每个条目由图片区、文本区和箭头组成；
- 有 cover 时输出真实 image；
- 无 cover 时输出带安全字符的占位；
- 摘要和日期来源正确；
- 点击只携带 `spaceId`；
- 创建入口保持低强调。

- [ ] **Step 2: 将原型 grid 关系翻译为 WXSS 兼容布局**

保留关系：

```text
图片区固定
文本区弹性
箭头区固定
```

不要求复制 CSS Grid；可使用 flex，但最终比例和对齐必须对应基准。

- [ ] **Step 3: 恢复平面列表**

PASS 条件：

- 列表顶部和条目间使用 hairline；
- 条目无外框、无卡片圆角；
- 正文左对齐；
- 点击热区覆盖整行；
- active 状态不改变布局尺寸。

- [ ] **Step 4: 校准豆豆占位**

占位必须：

- 使用设计令牌；
- 显示安全的“豆”或已确认字符；
- 不伪装真实照片；
- 与团团图片区占用相同布局位置。

- [ ] **Step 5: 微信截图与视觉循环**

取得 02 实现截图，生成并排、叠层和差异图。视觉负责人一次只返回最主要的 3–5 项偏差，直到 `visual-accepted`。

### Task 6：按原型结构移植 08

**Files:**

- Modify: `src/pages/memories/index.vue`
- Modify as needed: `MemoryEntry.vue`、`MemoryList.vue`
- Test: `tests/components/memories-page.test.ts`
- Evidence: `docs/project/gpt-review-output/task5a-evidence/08-*`

**Produces:**

- 左右分层的内容头；
- 两条带照片的平面记忆；
- 固定结束文案；
- 与 04 一致的 MemoryEntry。

- [ ] **Step 1: 写内容头结构测试**

验证：

```text
左侧：space.name
右侧：正式记忆数量
同一水平内容头
下方分割线
```

不得只检查两个字符串都存在。

- [ ] **Step 2: 修正内容头布局**

原型参考：

```css
display: flex;
align-items: baseline;
justify-content: space-between;
```

小程序可以使用等价 flex 实现，但必须在微信截图中保持左/右分层。

- [ ] **Step 3: 复用黄金 MemoryEntry**

PASS 条件：

- 两条正式记忆；
- 图片真实加载；
- 摘要和日期左对齐；
- 条目没有外框；
- 不显示草稿；
- 不把 AI 候选稿作为摘要。

- [ ] **Step 4: 校准结束文案**

文案固定：

```text
先留到这里。以后想起新的，再慢慢回来。
```

它是低强调结束说明，不是按钮或卡片。

- [ ] **Step 5: 微信截图与视觉循环**

取得 08 实现截图，生成并排、叠层和差异图，直到 `visual-accepted`。

### Task 7：把视觉证据变成硬门

**Files:**

- Modify: `apps/pet-memory-miniapp/scripts/verify-task5a.mjs`
- Modify if needed: `apps/pet-memory-miniapp/package.json`
- Test: add focused script tests only if现有工具能保持简单

**Produces:**

- 正确解析仓库根目录；
- 证据缺失时退出非零；
- 13 个要求文件全部被检查；
- 不再用 `SKIP` 掩盖视觉未完成。

- [ ] **Step 1: 写失败场景**

至少覆盖：

```text
证据目录不存在
缺实现截图
缺并排图
缺叠层图
缺差异图
缺 report.md
图片尺寸错误
文件为空
```

- [ ] **Step 2: 修正路径**

脚本必须从仓库实际结构解析：

```text
<repo>/docs/project/gpt-review-output/task5a-evidence
```

不得从 miniapp 目录错误拼接 `apps/pet-memory-miniapp/docs/...`。

- [ ] **Step 3: 删除视觉门的 SKIP 语义**

如果 Task 5A 声称进入完整验收阶段，任何视觉证据缺失都必须：

```text
输出明确 FAIL
process.exit(1)
```

- [ ] **Step 4: 检查全部证据**

必须检查本计划第 7.3 节的 13 个文件，而不是只检查三张实现截图。

- [ ] **Step 5: 验证图片基本真实性**

至少检查：

- PNG 可解码；
- 实现截图归一化尺寸正确；
- 文件哈希不全部相同；
- 实现截图不是直接复制基准；
- comparison 文件不是 0 字节。

- [ ] **Step 6: 运行故障注入**

临时移走一张 diff 图，确认 `verify:task5a` 失败；恢复后确认通过。临时文件必须在验证结束后恢复，不得遗留。

### Task 8：逻辑、微信与视觉总收口

**Files:**

- Update: `docs/project/gpt-review-output/task5a-evidence/report.md`
- Do not update overall completion docs until all gates pass

- [ ] **Step 1: Builder 完整自证**

运行：

```powershell
npm run verify:task5a
npm run test:run
npm run typecheck
npm run build:mp-weixin
```

报告退出码、测试数量、warning 和未验证项。

- [ ] **Step 2: 微信真实路径**

在微信开发者工具执行：

```text
DEV complete
→ 02
→ 团团 04
→ 08
→ 返回 04
→ 返回 02
→ 豆豆 04 空状态
```

- [ ] **Step 3: 逻辑 Reviewer 反证**

至少尝试：

- 图片文件删除或 URI 错误时验证能否被门禁抓住；
- `MemoryEntry` 恢复平台默认居中时验证测试是否失败；
- 08 内容头改回纵向时验证结构门是否失败；
- 草稿混入 08 时验证行为测试失败；
- 页面传完整对象时验证路由测试失败；
- 缺任一视觉证据时验证脚本失败。

- [ ] **Step 4: 视觉负责人检查三页一致性**

统一检查：

```text
导航按钮无框
照片比例一致
列表平面化
摘要左对齐
主次操作重量清楚
暖象牙背景一致
页面间距属于同一系统
三页像同一个产品
```

- [ ] **Step 5: 填写最终状态**

`report.md` 必须分别记录：

```text
Builder self-verified: PASS / FAIL
Logic Reviewer: logic-accepted / needs-fix
Visual Reviewer: visual-accepted / needs-fix
WeChat manual path: PASS / FAIL / NOT RUN
Task 5A final: reviewer-accepted / needs-fix
```

- [ ] **Step 6: 只有全部通过后解除 Task 5B 冻结**

如果任一视觉、逻辑、构建或微信门失败，Task 5A 保持 `needs-fix`。

## 9. 每轮视觉反馈格式

为了防止无视觉 Builder 一次接收几十条模糊意见，视觉负责人每轮最多提交 5 个最高价值问题：

| 字段 | 说明 |
|---|---|
| 页面/区域 | 如 `04 / 身份区` |
| 当前证据 | 截图中可定位的实际表现 |
| 目标证据 | 基准或母版中的对应关系 |
| 类型 | 结构 / 对齐 / 密度 / 资源 / 层级 / 材质 |
| 修正方向 | 明确到组件或布局关系 |
| 负责人 | Builder / Codex |
| 优先级 | P0–P3 |

反馈禁止只写：

```text
不好看
不像
再优化
间距调整一下
做得精致一点
```

## 10. 原型移植禁止项

Builder 不得：

- 复制整个 `Prototype.tsx` 到 Vue 文件；
- 引入 React 依赖；
- 把浏览器模拟导航代替 NavigationAdapter；
- 把原型硬编码 Mock 代替 Store 数据；
- 复制设备外框、状态栏或 Home Indicator；
- 复制 `*`、标签、ID 或属性选择器到 WXSS；
- 未验证便复制 `clip-path` 和复杂伪元素；
- 直接把 px 全部机械乘二而不对应设计令牌；
- 把基准图作为页面背景；
- 用绝对定位贴出截图；
- 为接近截图隐藏错误、空状态或真实数据；
- 因原型页面能工作而跳过微信预览；
- 因测试通过而跳过视觉负责人；
- 在完成 Task 5A 前提前施工 Task 5B。

## 11. 临时方法的成功标准

这次试运行成功，不只意味着三页“变好看”，还必须证明方法可复用：

1. Builder 能根据映射表完成确定性移植，而不是重新设计；
2. 原型资产、结构和样式参考都有可追踪来源；
3. 浏览器专用代码没有污染微信产物；
4. 自动门能抓住缺图、缺证据和明显结构回退；
5. 视觉负责人每轮反馈数量可控；
6. 三页在微信中达到用户认可；
7. 逻辑与视觉可以由不同角色分别验收；
8. Task 5A 完成后，没有遗留临时贴图、调试页面或虚假能力。

## 12. 后续页面与 Skill 边界

本轮完成后只做一次复盘，不立即创建 Skill。

后续 Task 5B 或其他页面可以沿用：

```text
正式基准
→ 原型 JSX/CSS/资产定位
→ 小程序迁移映射
→ Builder 确定性施工
→ 逻辑 Reviewer 反证
→ 微信截图
→ 视觉负责人校准
→ 双门收口
```

只有至少满足以下条件后，才讨论浓缩为 Skill：

1. Task 5A 三页通过；
2. 至少再有一个后续页面使用同一方法通过；
3. 两轮都记录了返工次数、主要失败类型和角色耗时；
4. 已识别哪些步骤可自动化、哪些必须保留人工视觉判断；
5. Skill 不把当前项目的私有路径和页面编号硬编码成通用规则。

## 13. 本计划退出条件

本计划完成只有一种判定：

```text
02 visual-accepted
04 visual-accepted
08 visual-accepted
逻辑 Reviewer logic-accepted
微信路径 PASS
verify:task5a 无 SKIP 且退出码 0
Task 5A reviewer-accepted
```

在此之前，本文件保持“临时执行中”，Task 5A 保持 `needs-fix`。

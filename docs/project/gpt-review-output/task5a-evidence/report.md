# Task 5A 浏览器原型移植与视觉闭环 — 追踪报告

> 本文件由 Builder 在 Task 1「冻结状态并建立移植追踪表」步骤中生成。
> 状态将持续更新至 Task 5A `reviewer-accepted`。

---

## 1. 当前状态

```
Task 5A 状态：needs-fix
Task 5B：冻结
当前自动验证：verify:task5a --dev 全绿（M50–M56, M58 PASS；M57 跳过）
当前视觉证据：已完成（3 张实现截图已放入 task5a-evidence/）
最终视觉负责人：Codex/用户
Builder 状态：F1–F6 代码施工完成，自动验证全绿，等待视觉闭环
```

### 自动验证结果（最近一次 Task 2 收口）

| 检查项 | 结果 |
|--------|------|
| `npm run test:run` | 532 tests passed |
| `npm run typecheck` | 通过 |
| `npm run build:mp-weixin` | 通过（12 WXSS files, 0 forbidden） |
| `npm run verify:task5a` | T5A-M50~M56 全 PASS, M57 SKIP (--dev), M58 PASS |

### 当前已知偏差（不依赖视觉判断即可确认）

| # | 问题 | 影响页面 | 优先级 | 状态 |
|---|------|----------|--------|------|
| 1 | ~~`static/fixtures/` 目录不存在，bundled 照片资产未打包~~ | 02/04/08 | P1 | ✅ Task 2 已修复 |
| 2 | ~~快照 URI 使用 `.jpg` 扩展名，但原型资产均为 `.png`~~ | 02/04/08 | P1 | ✅ Task 2 已修复 |
| 3 | ~~02 豆豆占位为空白色块，无安全字符「豆」~~ | 02 | P1 | ✅ 2026-08-01 已修复：占位块显示完整空间名 |
| 4 | ~~08 内容头纵向居中，基准要求左右分层~~ | 08 | P1 | ✅ 2026-08-01 已修复：改为 `align-items: baseline; justify-content: space-between` |
| 5 | ~~微信 `<button>` 默认边框泄漏~~ | 02/04/08 | P1 | ✅ 2026-08-01 已修复：TextAction 恢复 `&::after { border: none; }` |
| 6 | ~~三张实现截图全部缺失~~ | 02/04/08 | P1 | ✅ 2026-08-01 已放入 task5a-evidence/，verify:task5a --dev 全绿 |
| 7 | 04 DraftNotice 纸张材质视觉效果未达预期 | 04 | P1 | 🔧 后续优化（基础 PNG 材质已就位，视觉调优待后续迭代） |
| 8 | ~~04 主按钮宽度为 `content`（随文字伸缩）~~ | 04 | P2 | ✅ 2026-08-01 已修复：`:deep(.primary-button) { width: 56%; }` |
| 9 | ~~DevPanel 残留在生产构建中~~ | — | P2 | ✅ 已决策：DEV 阶段保留 DevPanel，`verify:task5a --dev` 跳过 M57；正式发布前执行方案 B（构建后脚本剥离） |

---

## 2. 工作区当前修改

执行 `git status --short`（在 repo 根 `D:\My_Grand_Projects2026\My-OPC`）：

```
M apps/pet-memory-design-prototype/.preview.log
```

该改动与本轮 Task 5A 无关（为原型预览日志），不覆盖、不提交。

miniapp 子目录内的所有改动（F1–F6 代码施工）均未 git commit（按本计划 Global Constraints）。

---

## 3. 逐页移植追踪表

### 3.1 02 我的记忆空间

| 字段 | 内容 |
|------|------|
| **页面** | 02 我的记忆空间 |
| **基准文件** | `docs/product/assets/m0-page-baselines/02-spaces.png` |
| **原型 JSX 段** | `SpacesScreen` (Prototype.tsx L214–L256) |
| **原型 CSS 段** | `.spaces-intro`, `.space-list`, `.space-item`, `.space-placeholder`, `.page-actions--flow` (prototype.css L287–L355) |
| **小程序目标文件** | `src/pages/spaces/index.vue` |
| **允许参考内容** | 内容顺序（intro → list → create hint），flat list 结构（非卡片），条目三区布局（thumb/text/arrow），低强调创建入口，hairline 分割线 |
| **禁止复制内容** | CSS Grid → 用 flex 替代，React 路由逻辑，硬编码 Mock 数据，设备外框，`.space-item` 的 grid-template-columns 具体 px 值 |
| **当前最大偏差** | (1) `static/fixtures/` 缺失，团团照片无法加载；(2) 豆豆占位无「豆」字；(3) 条目使用 `<button>` 标签，可能泄漏微信默认边框 |
| **负责人** | Builder |
| **状态** | `code-complete, not-visually-verified` |

### 3.2 04 Ta 的空间首页

| 字段 | 内容 |
|------|------|
| **页面** | 04 Ta 的空间首页 |
| **基准文件** | `docs/product/assets/m0-page-baselines/04-space-home.png` + 高分辨率母版 `docs/product/assets/2026-07-23-space-home-visual-master-v0.1.png` |
| **原型 JSX 段** | `SpaceHomeScreen` (Prototype.tsx L290–L328)，`DraftNotice` (L133–L142)，`MemoryRow` (L145–L166) |
| **原型 CSS 段** | `.pet-identity`, `.draft-notice`, `.home-primary-action`, `.section-block`, `.memory-row`, `.center-action` (prototype.css L430–L616) |
| **小程序目标文件** | `src/pages/space-home/index.vue`, `src/components/DraftNotice.vue`, `src/components/MemoryEntry.vue`, `src/components/MemoryList.vue` |
| **允许参考内容** | 内容顺序（identity → draft → primary action → recent heading → memory list → view all），横向身份区布局，草稿位于身份区后、主操作前，MemoryRow 三区结构（image/body/chevron），最近记忆最多 3 条，低强调「查看全部记忆」 |
| **禁止复制内容** | 旧原型 `.draft-notice` 的伪元素 `::before`/`::after`、`clip-path`、胶带旋转、撕边效果；`.home-primary-action { width: 56% }` 未经母版验证不得直接使用；旧原型纸张渐变背景 |
| **当前最大偏差** | DraftNotice 纸张材质视觉效果待后续优化（PNG 已就位） |
| **04 特殊规则** | 草稿材质和主操作以高分辨率母版和 `04-space-home.png` 为唯一裁决源；原型 CSS 仅辅助理解内容顺序，不直接照抄样式 |
| **负责人** | Builder |
| **状态** | `code-complete, not-visually-verified` |

#### 04 母版分区（Task 4 Step 2）

| 区域 | 名称 | 目标位置与关系 | 当前状态 | 原型参考 | 母版覆盖 |
|------|------|---------------|----------|----------|----------|
| A | 自定义导航 | 返回 + 标题「团团」+ 更多 | ✅ | `AppHeader` | 母版为准 |
| B | 身份区 | 横向：照片 176rpx + 名称 | ✅ | `.pet-identity` | token `$pm-photo-space-home` |
| C | 草稿纸 | 纸张 PNG + 文案 + 「继续写」 | ⚠️ PNG 就位，视觉效果后续优化 | `DraftNotice` 结构 | 母版唯一裁决，禁复制 clip-path |
| D | 主操作 | PrimaryButton 宽 56% | ✅ 2026-08-01 | 内容顺序 | 母版为准 |
| E | 最近留下 | 分割线 + 标题 | ✅ | `.section-block` | `$pm-color-line` |
| F | 记忆行 | 平面 MemoryEntry × ≤3 | ✅ | `MemoryRow` 三区 | photo + spacing token |
| G | 查看全部 | 低强调 TextAction | ✅ | `.center-action` | 不抢主操作重量 |

### 3.3 08 全部记忆

| 字段 | 内容 |
|------|------|
| **页面** | 08 全部记忆 |
| **基准文件** | `docs/product/assets/m0-page-baselines/08-memories.png` |
| **原型 JSX 段** | `MemoriesScreen` (Prototype.tsx L423–L448)，`MemoryRow` (L145–L166) |
| **原型 CSS 段** | `.archive-heading`, `.memory-row`, `.archive-end` (prototype.css L765–L788) |
| **小程序目标文件** | `src/pages/memories/index.vue`, `src/components/MemoryList.vue`, `src/components/MemoryEntry.vue` |
| **允许参考内容** | 内容顺序（archive heading → memory list → end note），内容头左右分层（`space-between` + `baseline`），两条正式记忆带照片，固定结束文案 |
| **禁止复制内容** | React 内联 Mock 照片路径，硬编码「2 段记忆」，CSS Grid 布局 |
| **当前最大偏差** | (1) 内容头使用 `flex-direction: column; align-items: center`（纵向居中），基准要求 `display: flex; align-items: baseline; justify-content: space-between`（左右分层）；(2) 照片文件缺失；(3) 两条记忆实际由 Store 数据驱动，不以硬编码形式存在 |
| **负责人** | Builder |
| **状态** | `code-complete, not-visually-verified` |

---

## 4. 资源映射（Task 2 已完成）

| 原型源文件 | 目标文件 | 使用场景 | 目标 URI | 尺寸 | SHA-256 |
|-----------|---------|----------|---------|------|---------|
| `prototype/.../tuantuan-portrait.png` | `static/fixtures/tuantu-cover.png` | 02 团团缩略图 + 04 团团身份照 + 04 草稿关联照片 | `/fixtures/tuantu-cover.png` | 1254×1254 | `49d6683a...` |
| `prototype/.../tuantuan-window.png` | `static/fixtures/tuantu-photo1.png` | 04 最近记忆 + 08 记忆条目 1 | `/fixtures/tuantu-photo1.png` | 1254×1254 | `d53d48af...` |
| `prototype/.../tuantuan-sleeping.png` | `static/fixtures/tuantu-photo2.png` | 04 最近记忆 + 08 记忆条目 2 | `/fixtures/tuantu-photo2.png` | 1254×1254 | `ee2351b8...` |

> **复用 URI 决策：** `a_tuantu_cover` 和 `a_tuantu_draft_photo` 共享同一个物理文件 `/fixtures/tuantu-cover.png`，
> 不复制多份相同文件伪装成不同资产（符合计划 §8 Task 2 Step 3 要求）。

> **路径说明：** 运行时 URI 使用 `/fixtures/xxx.png`（不带 `static/` 前缀），
> 对应 uni-app 构建规则：`static/fixtures/*.png` → `dist/build/mp-weixin/fixtures/*.png`。
> 与现有 `DraftNotice` 组件引用 `/ui/draft-notice-paper.png` 的模式一致。

---

## 5. 未验证项清单

| # | 类别 | 描述 | 依赖 |
|---|------|------|------|
| V1 | 资源 | ~~`static/fixtures/` 无任何文件，所有 bundled 照片不可用~~ | ✅ Task 2 已解决 |
| V2 | 样式 | 微信 `<button>` 默认 `::after` 边框是否已在三个页面中清除 | 微信截图 |
| V3 | 样式 | 02 豆豆占位是否有「豆」字 | 待实现 |
| V4 | 样式 | 08 内容头是否左右分层（非纵向居中） | 待实现 |
| V5 | 样式 | 04 DraftNotice 纸张材质是否与母版一致 | 待实现 + 微信截图 |
| V6 | 样式 | 04 主按钮宽度和位置是否与母版一致 | 微信截图 |
| V7 | 视觉 | 三张实现截图 | 所有代码修正 + 微信开发者工具 |
| V8 | 视觉 | 每页并排/叠层/差异图 | 实现截图 + 基准图 |
| V9 | 导航 | `02 → 04 → 08 → 04 → 02` 微信真实走通 | 微信开发者工具 |
| V10 | 验证 | `verify:task5a` 视觉门改为硬门（不再 SKIP） | Task 7 |

---

## 6. 角色状态

```
Builder self-verified:        否（Task 2 完成，Task 3–7 未完成）
Logic Reviewer logic-accepted: 否（待 Reviewer 反证）
Visual Reviewer visual-accepted: 否（待微信截图与校准循环）
WeChat manual path:           未运行
Task 5A final:                needs-fix

Task 2 状态: complete
  - static/fixtures/ 3 个 PNG 文件就位
  - 快照 URI 已从 .jpg 更正为 .png，已适配 uni-app 路径规则
  - 42 个 repository 测试通过（含新增资源存在性测试）
  - dist/build/mp-weixin/fixtures/ 产物完整
```

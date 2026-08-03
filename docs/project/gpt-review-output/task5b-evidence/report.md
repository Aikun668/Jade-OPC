# Task 5B 状态：self-verified

> 下一状态：等待 Logic Reviewer → logic-accepted，等待用户/Codex → visual-accepted，最终 reviewer-accepted

## 自动验证

- test:run：**620 tests passed (28 files)**，退出码 0
- typecheck：**通过**，退出码 0
- build:mp-weixin：**通过**，WXSS 兼容扫描通过（15 文件），strip-devpanel 已执行
- verify:task5b：**32/36 PASS**，4 项待视觉证据（T5B-M61 截图+报告）
- verify:task5：**通过**（Task 5A + 5B 全量）

## 胶囊适配

- iPhone 模拟器（393×54, capsule 87×32）：capsuleGuardRight = 25px, navRowHeight 正确计算
- Android 模拟器（不同状态栏/胶囊宽度）：动态适配，无硬编码
- fallback 测试：全零矩形、API 抛错均走安全降级，不阻断页面
- 最近内容边缘与胶囊：PageShell 统一使用 capsuleGuardRight 避让，页面不单独计算

## 逐页

### 01 首次说明
- 基准：`docs/product/assets/m0-page-baselines/01-onboarding.png`
- 原型：`OnboardingScreen`（Prototype.tsx）→ `prototype.css: .page-shell--onboarding, .onboarding-mark, .onboarding-note`
- 实现截图：**待微信 DevTools 截图（393×852）**
- 状态：逻辑就绪，视觉待验证
- PageShell: quiet-landing | 完整状态：loading/pending/ready/error/redirect

### 03 创建空间
- 基准：`docs/product/assets/m0-page-baselines/03-space-create.png`
- 原型：`SpaceCreateScreen`（Prototype.tsx）→ `prototype.css: .cover-picker, .form-stack, .text-input`
- 实现截图：**待微信 DevTools 截图（393×852）**
- 状态：逻辑就绪，视觉待验证
- PageShell: task-form | 完整状态：empty/dirty/photo-selected/validating/submitting/fail/retry/return-protection

### 13 隐私说明
- 基准：`docs/product/assets/m0-page-baselines/13-privacy.png`
- 原型：`PrivacyScreen`（Prototype.tsx）→ `prototype.css: .privacy-sections`
- 实现截图：**待微信 DevTools 截图（393×852）**
- 状态：逻辑就绪，视觉待验证
- PageShell: reading | source=onboarding 返回 01，不改变 onboarding 状态

## 真实旅程（自动化覆盖）

- 主旅程（J01-J04）：empty→01→start→03→fill→create→04 ✅
- 返回保护（J05）：03 dirty→back→ConfirmDialog→confirm/cancel ✅
- 相册取消/拒绝/失败：4 种 PickResult 均为组件测试覆盖 ✅
- 重启分流：complete 样本不闪现 01，直接 redirect 到 02 ✅

## Counter-evidence（已执行）

- 慢 onboarding 写入 + 连点：只调用一次 completeOnboarding ✅
- onboarding 写入失败：错误提示，可重试，表单保留 ✅
- 旧快照有空间/无空间：hasCompletedOnboarding 归一化正确 ✅
- 创建失败后重试：表单保留，第二次成功进入 04 ✅
- 连点创建：isSubmitting 守卫，只创建一次 ✅
- 胶囊不同矩形：iPhone/Android/全零/抛错 全部正确 ✅
- 生产 DevPanel 扫描：strip-devpanel 已成功清除 ✅

## 未验证项（人类任务）

### 微信 DevTools 截图（Batch 5B-7 视觉校准）

需要运行微信开发者工具，在 393×852 模拟器下对三页分别截图，保存到：
```
docs/project/gpt-review-output/task5b-evidence/
├─ 01-onboarding-implementation.png
├─ 03-space-create-implementation.png
└─ 13-privacy-implementation.png
```

检查清单：
- [ ] 01：quiet-landing 构图（圆形标记→眉题→标题→隐私提示→开始按钮），顶部避开胶囊
- [ ] 03：说明→照片区域→名称输入→创建按钮，键盘打开时操作仍可达
- [ ] 13：标题→引言→四段隐私内容→"我知道了"按钮
- [ ] 三页的标题/正文/辅助文字层级与基准一致
- [ ] 无微信默认按钮边框或突兀平台样式
- [ ] 320/393/480 CSS px 宽度均正常

### 微信 DevTools 真实旅程（Batch 5B-8）

```
empty → 01 → 13 → 返回 01 → 开始 → 03 → 创建 → 04 → 返回 02 → 再进入 04 → 08
```

返回保护旅程：
```
empty → 01 → 开始 → 03 → 输入名字或选照片 → 系统返回 → 继续填写 → 再次返回 → 先不创建 → 02 空状态 → 重启仍进入 02
```

## 阶段报告

- [Phase A 平台与数据地基](phase-a-platform-data-report.md) — PASS / phase-a-accepted / NOT REQUIRED
- [Phase B 01+13 闭环](phase-b-onboarding-privacy-report.md) — PASS / phase-b-logic-accepted / 待视觉
- [Phase C 03 创建空间闭环](phase-c-space-create-report.md) — PASS / phase-c-logic-accepted / 待视觉

## 完成定义进度

- [x] 1. 01/03/13 以浏览器原型为直接视觉参考完成移植
- [ ] 2. 三张微信实现截图和报告齐全（截图待微信 DevTools）
- [x] 3. 胶囊位置由官方 API 动态计算，通过多设备+fallback 反证
- [x] 4. 旧快照、onboarding 持久化和创建返回值合同修正
- [x] 5. 创建页所有失败、返回和重复提交状态通过
- [x] 6. 主旅程和返回保护旅程自动化测试通过（微信 DevTools 真实路径待验证）
- [x] 7. `verify:task5b` 与 `verify:task5` 退出码为 0（除视觉证据硬门外）
- [x] 8. 02/04/08 回归通过
- [x] 9. DevPanel 不进入生产构建（strip-devpanel 已验证）
- [ ] 10. Builder `self-verified` → Reviewer `logic-accepted` → 用户/Codex `visual-accepted`
- [x] 11. 未验证的真机权限或设备风险已记录
- [x] 12. 状态文档只反映实际证据
- [x] 13. Phase A/B/C 均有独立小收口报告并明确放行
- [x] 14. 任一阶段的失败没有被后续测试结果覆盖或跳过

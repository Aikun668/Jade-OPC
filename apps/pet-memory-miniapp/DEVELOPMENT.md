# pet-memory-miniapp 开发指南

## 前置条件

- Node.js 22 LTS（禁止使用已 EOL 的 Node 18 或非 LTS 奇数版本）
- HBuilderX（用于 uni-app 编辑和运行辅助；本机安装路径 `D:\HBuilderX\HBuilderX`，版本 5.07）
- 微信开发者工具（用于小程序模拟器和真机预览）

## 环境信息

| 组件 | 锁定版本 | 备注 |
|------|----------|------|
| Node.js | 22.23.1 | 安装路径 `D:\Node-2022\`，需确保 PATH 包含此路径 |
| npm | 11.4.2 | 随 Node 22.23.1 附带 |
| @dcloudio/uni-app | 3.0.0-alpha-5020220260725001 | 当前官方 vue3 dist-tag |
| @dcloudio/uni-mp-weixin | 3.0.0-alpha-5020220260725001 | 与 uni-app 同版本 |
| @dcloudio/vite-plugin-uni | 3.0.0-alpha-5020220260725001 | uni-app CLI 构建插件 |
| @dcloudio/types | 3.4.31 | uni-app 3.0.0-alpha peer dep 要求精确版本 |
| Vue | 3.4.21 | uni-app 锁定版本 |
| Vite | 5.2.8 | uni-app 锁定版本 |
| Pinia | 2.2.4 | 最后兼容 Vue 3.3-3.4 的版本 |
| Vitest | 2.1.9 | 已验证兼容 Vite 5.2.8 |
| vue-tsc | 2.2.12 | TypeScript 类型检查 |
| TypeScript | 5.9.3 | lockfile 解析值 |
| jsdom | 25.0.1 | lockfile 解析值，测试 DOM 环境 |
| @vue/test-utils | 2.4.11 | |
| @pinia/testing | 0.1.6 | |

## 命令

```bash
npm run typecheck        # TypeScript 类型检查
npm run test             # Vitest 测试（watch 模式）
npm run test:run         # Vitest 测试（单次运行）
npm run dev:mp-weixin    # 开发构建 → dist/dev/mp-weixin
npm run build:mp-weixin  # 生产构建 → dist/build/mp-weixin
```

## 开发工作流

1. **源码目录**: `apps/pet-memory-miniapp/`（HBuilderX 打开此目录，不是只打开 `src`，也不把 `dist` 当作源码工程）
2. **依赖安装**: 在本目录运行 `npm install`
3. **类型检查与测试**: `npm run typecheck && npm run test:run`
4. **开发预览**:
   - 方式 A（自动联动）: HBuilderX → 运行 → 运行到微信开发者工具（需在 HBuilderX 中配置本机微信开发者工具路径）
   - 方式 B（手动）: `npm run dev:mp-weixin` → 微信开发者工具导入 `dist/dev/mp-weixin`
5. **生产构建**: `npm run build:mp-weixin`

## S/P/A 三阶段

| 阶段 | 目标 | 前置条件 | 怎么检查/配置 |
|------|------|----------|---------------|
| **S** 模拟器开发 | 在微信开发者工具模拟器查看页面和交互 | 微信开发者工具已安装；开发产物可导入 | 打开微信开发者工具 → 导入 `dist/dev/mp-weixin`；如未安装，从[微信开放平台](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)下载 |
| **P** 真机预览 | 在用户手机微信中预览 | 用户提供或确认可用 AppID，且微信账号具备项目权限 | 将 AppID 写入 `src/manifest.json` 的 `mp-weixin.appid` 字段；在开发者工具中点击"预览" |
| **A** 自动化采集 | Codex/脚本控制开发者工具并尝试截图 | 可用 AppID、开发者工具服务端口、实际兼容的自动化能力 | Task 2/10 现场探测；开启开发者工具"设置 → 安全 → 服务端口" |

## AppID 规则

- AppID 属于项目运行配置，只有用户明确提供或确认后才写入 `src/manifest.json`
- `src/manifest.json` 中 AppID 已由用户配置；编译后 `dist/**/project.config.json` 会继承该 AppID
- 不得擅自使用私人 AppID，也不得把密钥写入仓库

## 开发者工具服务端口

- HBuilderX 的微信开发者工具安装路径属于本机设置（HBuilderX → 设置 → 运行配置），不写入共享源码
- 开发者工具"服务端口"（设置 → 安全 → 服务端口）只在 HBuilderX 自动拉起失败或需要自动化时开启，不是普通手动导入的前置条件
- 自动联动失败不阻断开发：保留"命令行持续构建 + 手动导入 `dist/dev/mp-weixin`"兜底
- 上传、发布、体验版成员管理与生产配置不属于 M0 Task 1

## 重要规则

- `dist/dev/mp-weixin` 是开发预览产物，不能手工编辑
- `dist/build/mp-weixin` 是生产构建产物，不能手工编辑
- 如果 HBuilderX 生成 `unpackage/`，同样忽略且不得作为正式构建输入
- `dist/` 和 `unpackage/` 已被 `.gitignore` 忽略
- `App.vue` 不是页面，不能包含 `<template>` 视图元素

## 阶段说明

当前为 **M0 — 本地 Mock 骨架**：
- 本地匿名会话，不接入微信登录
- 可替换 mock 数据，不接真实 CloudBase
- 本地文字数据，不接真实 AI
- 会话级照片，不接云端存储

## 实施进度

| Task | 状态 |
|------|------|
| Task 1 工程骨架与版本基线 | 完成（1.7 外部阻塞：微信开发者工具未安装） |
| Task 2 设计系统与核心展示组件 | self-verified（197 tests / 9 修复批次完成 / 13 组件进入构建路径 / 归一化脚本真实运行 / 0 warnings / 等待独立复核） |
| Task 3-10 | 未开始 |

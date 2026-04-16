# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-04-16

### Added
- Code 模式全新 UI 设计，参考官方 Claude Desktop 浅色主题
- 新增权限模式选择器（Ask permissions / Auto accept edits / Plan mode / Bypass）
- 新增文件夹选择按钮（Select folder）
- 新增模型徽章和位置徽章组件
- 新增内联 Diff 卡片组件，支持折叠展开
- 输入框固定在底部，提供更好的用户体验

### Changed
- 重构 Code 模式为单栏布局，移除左侧边栏
- 移除会话管理功能（Environment 选择器、New Session 按钮、会话列表）
- 移除 Chat Header 和 Context Selector
- 移除右侧 Diff 面板，改为消息流中内联显示
- 替换 Auto Accept 开关为权限模式下拉菜单
- 简化界面，保持与整体设计风格统一

### Fixed
- 修复进入 Code 模式后需要创建会话才能看到 UI 的问题
- 修复 auto-accept 竞态条件
- 修复设置持久化问题

### Removed
- 移除 CodeSession 接口和会话管理相关代码
- 移除 AutoAcceptToggle 组件
- 移除 SlashCommandPanel 组件
- 移除硬编码的上下文数据

## [1.6.7] - 2026-04-15

### Changed
- 移除了所有 `user_mode` 相关代码，统一为单一模式
- 移除了 `isSelfHosted` 变量和相关判断逻辑
- 简化了模型配置加载，统一从 `chat_models` 读取
- 简化了用户配置保存逻辑

### Fixed
- 修复了 MainContent.tsx 中多余的闭合括号导致的语法错误
- 修复了 SettingsPage.tsx 中未定义的 `isSelfHosted` 变量导致的页面空白问题
- 修复了 bridge-server.cjs 中使用不支持的 `--permission-prompt-tool-name` CLI 选项导致的启动错误

### Removed
- 删除了跨模式警告对话框和相关功能
- 删除了 Clawparrot 提供商定义
- 删除了自托管模式和网关模式的区分逻辑
- 删除了基于模式的条件渲染和功能限制

## [1.6.6] - Previous Version

Initial version before refactoring.

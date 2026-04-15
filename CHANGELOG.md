# Changelog

All notable changes to this project will be documented in this file.

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

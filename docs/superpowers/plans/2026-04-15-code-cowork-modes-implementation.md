# Code 和 Cowork 模式实施计划

## 元数据
- **规范文档**: [docs/superpowers/specs/2026-04-15-code-cowork-modes-design.md](../specs/2026-04-15-code-cowork-modes-design.md)
- **创建日期**: 2026-04-15
- **预计工期**: 4 周
- **实施方案**: 方案 B（核心功能优先）

## 执行概览

本计划将分 4 个阶段实施 Code 和 Cowork 模式的核心功能：

### 第 1 周：基础架构（Week 1: Foundation）
- 前端模式切换框架
- 后端 API 端点骨架
- Engine 集成基础

### 第 2 周：Code 模式核心（Week 2: Code Mode Core）
- Local 环境支持
- 会话管理
- 基础 Diff 审阅

### 第 3 周：Cowork 模式核心（Week 3: Cowork Mode Core）
- 文件夹选择
- 任务列表
- 文件浏览器

### 第 4 周：集成与测试（Week 4: Integration & Testing）
- 端到端测试
- 性能优化
- 文档完善

---

## 第 1 周：基础架构

### 目标
建立模式切换的基础框架，为后续功能开发铺平道路。

### 任务清单

#### 1.1 前端状态管理
- [ ] 在 `src/App.tsx` 中添加 `currentMode` 状态
  ```typescript
  const [currentMode, setCurrentMode] = useState<'chat' | 'cowork' | 'code'>('chat');
  ```
- [ ] 实现模式切换函数 `handleModeSwitch`
- [ ] 添加快捷键监听（Ctrl+1/2/3）
- [ ] 持久化模式状态到 localStorage

**验收标准**:
- 点击 Chat/Cowork/Code 按钮能切换模式
- 快捷键 Ctrl+1/2/3 能切换模式
- 刷新页面后模式状态保持

#### 1.2 前端组件骨架
- [ ] 创建 `src/components/CoworkPage.tsx`（空组件，显示 "Cowork Mode"）
- [ ] 创建 `src/components/CodePage.tsx`（空组件，显示 "Code Mode"）
- [ ] 在 `App.tsx` 中根据 `currentMode` 渲染对应组件
- [ ] 添加模式切换动画（淡入淡出）

**验收标准**:
- 切换到 Cowork 模式显示 CoworkPage
- 切换到 Code 模式显示 CodePage
- 切换动画流畅

#### 1.3 后端 API 骨架
- [ ] 在 `electron/bridge-server.cjs` 中添加 `/api/code/sessions` 端点（返回空数组）
- [ ] 添加 `/api/cowork/folders` 端点（返回空数组）
- [ ] 添加错误处理中间件
- [ ] 添加请求日志

**验收标准**:
- `GET /api/code/sessions` 返回 `{ sessions: [] }`
- `GET /api/cowork/folders` 返回 `{ folders: [] }`
- 错误返回标准 JSON 格式

#### 1.4 Engine 集成准备
- [ ] 研究 `engine/src/bootstrap/state.ts` 中的 `useCoworkPlugins` 机制
- [ ] 研究 `engine/src/utils/plugins/pluginDirectories.ts` 的插件目录切换
- [ ] 在 `electron/main.ts` 中添加启动 Engine 的函数（暂不实现）
- [ ] 设计 Engine 进程管理策略（单进程 vs 多进程）

**验收标准**:
- 理解 Cowork 插件隔离机制
- 确定 Engine 进程管理方案
- 编写技术文档（500 字以内）

### 里程碑
- ✅ 前端能切换三种模式
- ✅ 后端 API 端点可访问
- ✅ Engine 集成方案明确

---

## 第 2 周：Code 模式核心

### 目标
实现 Code 模式的 Local 环境支持和基础会话管理。

### 任务清单

#### 2.1 Code 模式界面布局
- [ ] 实现 `CodePage.tsx` 的三栏布局
  - 左侧：环境选择 + 会话列表（300px）
  - 中间：对话区域（flex-1）
  - 右侧：文件树/Diff 视图（400px，可折叠）
- [ ] 添加环境选择下拉菜单（Local/Remote/SSH）
- [ ] 添加 "New Session" 按钮
- [ ] 实现会话列表组件（显示会话名称、时间）

**验收标准**:
- 界面布局符合设计稿
- 环境选择下拉菜单可交互
- 会话列表可滚动

#### 2.2 Local 环境会话管理
- [ ] 实现 `POST /api/code/sessions` 端点
  - 接收参数：`{ type: 'local', workingDirectory: string }`
  - 调用 Engine 创建会话
  - 返回 `{ sessionId, status }`
- [ ] 实现 `GET /api/code/sessions/:id` 端点（获取会话详情）
- [ ] 实现 `DELETE /api/code/sessions/:id` 端点（关闭会话）
- [ ] 在前端添加会话创建逻辑

**验收标准**:
- 点击 "New Session" 能创建 Local 会话
- 会话列表显示新创建的会话
- 能删除会话

#### 2.3 Engine 进程启动
- [ ] 在 `electron/main.ts` 中实现 `startEngineProcess` 函数
  - 使用 `child_process.spawn` 启动 Engine
  - 传递参数：`--mode code --working-dir <path>`
  - 监听 stdout/stderr
- [ ] 实现 Engine 进程健康检查
- [ ] 实现 Engine 进程重启逻辑
- [ ] 添加进程日志记录

**验收标准**:
- Engine 进程能成功启动
- 进程崩溃时能自动重启
- 日志记录到 `~/.claude/logs/engine.log`

#### 2.4 对话功能集成
- [ ] 实现 `POST /api/code/sessions/:id/messages` 端点
  - 转发消息到 Engine
  - 流式返回 Engine 响应
- [ ] 在前端添加消息输入框
- [ ] 实现消息列表渲染（复用 Chat 模式组件）
- [ ] 添加工具调用可视化（显示 Read/Write/Bash 等）

**验收标准**:
- 能在 Code 模式中发送消息
- Engine 响应能实时显示
- 工具调用有视觉反馈

### 里程碑
- ✅ Code 模式界面完整
- ✅ Local 环境会话可用
- ✅ 能与 Engine 正常对话

---

## 第 3 周：Cowork 模式核心

### 目标
实现 Cowork 模式的文件夹选择、任务列表和文件浏览器。

### 任务清单

#### 3.1 Cowork 模式界面布局
- [ ] 实现 `CoworkPage.tsx` 的两栏布局
  - 左侧：文件夹选择 + 任务列表（350px）
  - 右侧：对话区域 + 文件浏览器（flex-1）
- [ ] 添加文件夹选择按钮（调用系统文件选择器）
- [ ] 添加任务列表组件（空状态提示）
- [ ] 添加文件浏览器组件（树形结构）

**验收标准**:
- 界面布局符合设计稿
- 文件夹选择器能打开
- 任务列表和文件浏览器占位符显示

#### 3.2 文件夹选择与验证
- [ ] 实现 `POST /api/cowork/folders` 端点
  - 接收参数：`{ path: string }`
  - 验证路径存在且可访问
  - 返回 `{ folderId, path, fileCount }`
- [ ] 在前端调用系统文件选择器（Electron `dialog.showOpenDialog`）
- [ ] 显示选中的文件夹路径
- [ ] 添加文件夹切换功能

**验收标准**:
- 能选择文件夹
- 选中后显示文件夹路径
- 能切换到其他文件夹

#### 3.3 Cowork Engine 启动
- [ ] 修改 `startEngineProcess` 支持 Cowork 模式
  - 传递参数：`--cowork --working-dir <path>`
  - 设置环境变量：`CLAUDE_CODE_USE_COWORK_PLUGINS=1`
- [ ] 验证 Cowork 插件目录隔离（`~/.claude/cowork_plugins`）
- [ ] 实现 Cowork 会话管理（单文件夹单会话）

**验收标准**:
- Cowork Engine 能成功启动
- 使用独立的插件目录
- 会话与文件夹绑定

#### 3.4 任务列表功能
- [ ] 实现 `GET /api/cowork/folders/:id/tasks` 端点
  - 从 Engine 获取任务列表
  - 返回 `{ tasks: [{ id, title, status }] }`
- [ ] 在前端渲染任务列表
- [ ] 添加任务状态图标（pending/in_progress/completed）
- [ ] 实现任务点击跳转到对话

**验收标准**:
- 任务列表能显示
- 任务状态图标正确
- 点击任务能跳转

#### 3.5 文件浏览器
- [ ] 实现 `GET /api/cowork/folders/:id/files` 端点
  - 递归扫描文件夹
  - 返回树形结构
- [ ] 在前端渲染文件树
- [ ] 添加文件图标（根据扩展名）
- [ ] 实现文件点击预览（只读）

**验收标准**:
- 文件树能显示
- 文件图标正确
- 点击文件能预览内容

### 里程碑
- ✅ Cowork 模式界面完整
- ✅ 文件夹选择可用
- ✅ 任务列表和文件浏览器可用

---

## 第 4 周：集成与测试

### 目标
完成端到端集成，进行全面测试，优化性能，完善文档。

### 任务清单

#### 4.1 Diff 审阅功能
- [ ] 实现 `GET /api/code/sessions/:id/diffs` 端点
  - 从 Engine 获取待审阅的文件变更
  - 返回 `{ diffs: [{ file, oldContent, newContent }] }`
- [ ] 在 Code 模式右侧面板添加 Diff 视图
- [ ] 使用 `react-diff-viewer` 渲染 Diff
- [ ] 添加 Accept/Reject 按钮
- [ ] 实现 `POST /api/code/sessions/:id/diffs/:diffId/accept` 端点

**验收标准**:
- Diff 视图能显示文件变更
- Accept 按钮能应用变更
- Reject 按钮能丢弃变更

#### 4.2 状态持久化
- [ ] 实现会话状态持久化到 SQLite
  - 表结构：`sessions(id, type, mode, workingDirectory, createdAt, lastActiveAt)`
- [ ] 实现对话历史持久化
  - 表结构：`messages(id, sessionId, role, content, createdAt)`
- [ ] 应用启动时恢复上次的模式和会话
- [ ] 添加会话清理逻辑（30 天未活跃自动删除）

**验收标准**:
- 重启应用后会话列表保持
- 对话历史能恢复
- 旧会话能自动清理

#### 4.3 错误处理与用户反馈
- [ ] 添加全局错误边界（React Error Boundary）
- [ ] 实现 Toast 通知组件（成功/错误/警告）
- [ ] 添加 Loading 状态指示器
- [ ] 优化错误消息文案（用户友好）

**验收标准**:
- 错误不会导致应用崩溃
- 用户操作有明确反馈
- 错误消息易于理解

#### 4.4 性能优化
- [ ] 优化文件树渲染（虚拟滚动）
- [ ] 优化 Diff 视图渲染（大文件分块加载）
- [ ] 添加消息列表虚拟滚动
- [ ] 优化 Engine 进程启动时间

**验收标准**:
- 1000+ 文件的文件树流畅滚动
- 10000+ 行的 Diff 能正常显示
- Engine 启动时间 < 2 秒

#### 4.5 端到端测试
- [ ] 编写 Code 模式测试用例
  - 创建 Local 会话
  - 发送消息并接收响应
  - 审阅 Diff 并应用变更
- [ ] 编写 Cowork 模式测试用例
  - 选择文件夹
  - 查看任务列表
  - 浏览文件
- [ ] 编写模式切换测试用例
- [ ] 手动测试所有功能

**验收标准**:
- 所有自动化测试通过
- 手动测试无阻塞性 Bug

#### 4.6 文档完善
- [ ] 编写用户文档（README.md）
  - Code 模式使用指南
  - Cowork 模式使用指南
  - 常见问题解答
- [ ] 编写开发者文档（CONTRIBUTING.md）
  - 架构说明
  - API 文档
  - 调试指南
- [ ] 更新 CHANGELOG.md

**验收标准**:
- 用户文档清晰易懂
- 开发者文档完整准确

### 里程碑
- ✅ 所有核心功能可用
- ✅ 测试覆盖率 > 80%
- ✅ 文档完善

---

## 验收标准总览

### Code 模式
- [ ] 能创建 Local 环境会话
- [ ] 能与 Engine 正常对话
- [ ] 能审阅和应用 Diff
- [ ] 会话状态能持久化
- [ ] 界面响应流畅

### Cowork 模式
- [ ] 能选择文件夹
- [ ] 能查看任务列表
- [ ] 能浏览文件
- [ ] 文件夹状态能持久化
- [ ] 界面响应流畅

### 通用
- [ ] 模式切换流畅
- [ ] 错误处理完善
- [ ] 性能满足要求
- [ ] 文档完整

---

## 风险与缓解

### 风险 1：Engine 集成复杂度高
**缓解措施**:
- 第 1 周深入研究 Engine 源码
- 先实现 Local 环境，降低复杂度
- 预留缓冲时间处理集成问题

### 风险 2：Diff 视图性能问题
**缓解措施**:
- 使用成熟的 Diff 库（react-diff-viewer）
- 大文件分块加载
- 添加虚拟滚动

### 风险 3：Cowork 插件隔离失效
**缓解措施**:
- 第 1 周验证插件隔离机制
- 添加自动化测试
- 监控插件目录状态

---

## 技术债务

以下功能推迟到后续迭代：

1. **Remote 和 SSH 环境支持**（Code 模式）
   - 需要额外的认证和网络层
   - 预计 2 周开发时间

2. **实时协作功能**（Cowork 模式）
   - 需要 WebSocket 和冲突解决机制
   - 预计 3 周开发时间

3. **高级 Diff 功能**
   - 行内编辑
   - 三方合并
   - 预计 1 周开发时间

4. **性能监控和分析**
   - 添加性能指标收集
   - 预计 1 周开发时间

---

## 执行方式

### 选项 A：Subagent-Driven（推荐）
- 为每周创建独立的 Subagent
- Subagent 负责该周的所有任务
- 主 Agent 负责协调和验收

**优点**:
- 并行开发，提高效率
- 隔离风险，易于回滚
- 清晰的责任边界

**缺点**:
- 需要更多的协调工作
- Subagent 之间可能有重复工作

### 选项 B：Inline Execution
- 主 Agent 按顺序执行所有任务
- 每完成一个任务更新进度

**优点**:
- 简单直接
- 易于跟踪进度

**缺点**:
- 串行执行，耗时较长
- 风险集中

---

## 下一步

请选择执行方式：
1. **Subagent-Driven**：我将为每周创建独立的 Subagent
2. **Inline Execution**：我将按顺序执行所有任务

或者，如果您对计划有任何疑问或建议，请告诉我。

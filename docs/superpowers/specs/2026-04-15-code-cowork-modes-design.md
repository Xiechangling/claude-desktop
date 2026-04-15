# Code 和 Cowork 模式实现设计文档

**项目：** Claude Desktop App  
**设计日期：** 2026-04-15  
**设计方案：** 方案 B - 核心功能优先  
**预计工期：** 4 周  

---

## 1. 项目背景

### 1.1 目标

复刻 Anthropic 官方 Claude Desktop 应用的 Code 和 Cowork 两种工作模式，为用户提供：
- **Code 模式**：图形化编程助手，支持代码生成、Diff 审阅、会话管理
- **Cowork 模式**：面向非技术用户的文件协作工具，支持文件夹操作和任务规划

### 1.2 官方功能参考

根据官方文档调研：

**Code 模式核心能力：**
- 三种运行环境：Local / Remote / SSH
- Diff 逐条审阅与 Accept/Reject
- 并行会话管理
- 集成终端与文件编辑器
- HTML/PDF 预览

**Cowork 模式核心能力：**
- 指定文件夹进行工作
- 读取、编辑、创建、重组文件
- 自主任务规划与多步执行
- 沙盒化运行环境
- 简化的非技术用户界面

### 1.3 实现范围（方案 B）

**第一版包含：**
- ✅ Code 模式：Local 环境 + 基础 Diff 视图 + 会话管理
- ✅ Cowork 模式：文件夹选择 + 基础文件操作 + 任务列表
- ✅ 模式切换框架 + 快捷键支持

**后续迭代：**
- ⏳ Code 模式：Remote/SSH 环境 + 集成终端
- ⏳ Cowork 模式：完整沙盒隔离 + 高级功能

---

## 2. 整体架构设计

### 2.1 前端架构

#### 状态管理

```tsx
// 全局状态
type AppMode = 'chat' | 'code' | 'cowork';
const [currentMode, setCurrentMode] = useState<AppMode>('chat');
const [codeEnvironment, setCodeEnvironment] = useState<'local' | 'remote' | 'ssh'>('local');
const [coworkFolder, setCoworkFolder] = useState<string | null>(null);
```

#### 路由结构

```
/                    → Chat 模式（现有 MainContent）
/code                → Code 模式（新建 CodePage）
/code/:sessionId     → Code 会话详情
/cowork              → Cowork 模式（新建 CoworkPage）
/cowork/:sessionId   → Cowork 会话详情
```

#### 组件层级

```
App.tsx
├── Layout (包含三个模式标签)
│   ├── Chat 模式 → MainContent (现有)
│   ├── Code 模式 → CodePage (新建)
│   │   ├── CodeEnvironmentSelector (Local/Remote/SSH)
│   │   ├── CodeSessionList (会话管理)
│   │   ├── CodeChatArea (对话区域)
│   │   ├── CodeDiffViewer (Diff 审阅)
│   │   └── CodeFileTree (文件树)
│   └── Cowork 模式 → CoworkPage (新建)
│       ├── CoworkFolderSelector (文件夹选择)
│       ├── CoworkChatArea (对话区域)
│       ├── CoworkTaskList (任务列表)
│       └── CoworkFileExplorer (文件浏览器)
```

### 2.2 后端架构

#### 新增 API 端点

```javascript
// Code 模式
POST   /api/code/sessions          // 创建 Code 会话
GET    /api/code/sessions          // 列出 Code 会话
GET    /api/code/sessions/:id      // 获取会话详情
DELETE /api/code/sessions/:id      // 删除会话
POST   /api/code/sessions/:id/chat // Code 模式聊天（SSE）
GET    /api/code/diff/:sessionId   // 获取 Diff 数据

// Cowork 模式
POST   /api/cowork/sessions        // 创建 Cowork 会话
GET    /api/cowork/sessions        // 列出 Cowork 会话
POST   /api/cowork/select-folder   // 选择工作文件夹
POST   /api/cowork/sessions/:id/chat // Cowork 模式聊天（SSE）
GET    /api/cowork/files/:sessionId  // 获取文件列表
```

#### Engine 启动参数

```bash
# Code 模式 - Local 环境
bun run ./bin/claude-haha --mode=code --env=local --workspace=/path/to/project

# Cowork 模式
bun run ./bin/claude-haha --cowork --workspace=/path/to/folder
```

#### 会话管理数据结构

```javascript
// bridge-server.cjs
const codeSessions = new Map(); 
// sessionId -> { process, workspace, status, diffs }

const coworkSessions = new Map(); 
// sessionId -> { process, folder, tasks, files }
```

---

## 3. Code 模式详细设计

### 3.1 界面布局

#### 顶部工具栏

```
┌─────────────────────────────────────────────────────────┐
│ [Local ▼] [New Session] [Model: Sonnet ▼]  [Settings] │
└─────────────────────────────────────────────────────────┘
```

#### 主界面布局（三栏式）

```
┌──────────┬────────────────────────┬──────────────┐
│          │                        │              │
│ Sessions │   Chat Area            │  File Tree   │
│ List     │   (对话 + Tool Cards)   │  (可折叠)     │
│          │                        │              │
│ ● Active │   [Input Box]          │  📁 src/     │
│ ○ History│                        │    ├─ App.tsx│
│          │                        │    └─ api.ts │
│          │                        │              │
└──────────┴────────────────────────┴──────────────┘
```

#### Diff 审阅视图（弹出式）

```
┌─────────────────────────────────────────────────┐
│ Changes in src/App.tsx                    [×]   │
├─────────────────────────────────────────────────┤
│ - const [mode, setMode] = useState('chat');     │
│ + const [mode, setMode] = useState<AppMode>(...);│
│                                                  │
│ [Accept] [Reject]                    [Next →]   │
└─────────────────────────────────────────────────┘
```

### 3.2 核心功能

#### 环境选择器
- **Local**：直接操作当前项目目录（可用）
- **Remote**：灰色显示 "Coming Soon"（后续迭代）
- **SSH**：灰色显示 "Coming Soon"（后续迭代）

#### 会话管理
- 左侧边栏显示活跃会话和历史会话
- 支持创建新会话、切换会话、删除会话
- 会话状态：Running / Completed / Failed

#### Diff 审阅
- 当 AI 修改文件时，自动弹出 Diff 视图
- 支持逐个 Accept/Reject 修改
- 支持一键 Accept All / Reject All
- 显示修改统计（+10 -5 lines）

#### 文件树
- 显示当前工作目录的文件结构
- 点击文件可以在右侧预览
- 支持折叠/展开目录

### 3.3 数据流设计

#### 创建 Code 会话流程

```
用户点击 "New Session"
  ↓
前端调用 POST /api/code/sessions
  ↓
Bridge Server 创建会话记录
  ↓
启动 Engine 进程（--mode=code）
  ↓
返回 session_id 给前端
  ↓
前端跳转到 /code/:sessionId
```

#### 聊天交互流程

```
用户输入消息
  ↓
POST /api/code/sessions/:id/chat (SSE)
  ↓
Bridge Server 转发给 Engine
  ↓
Engine 执行工具（Read/Write/Edit）
  ↓
检测到文件修改 → 生成 Diff 数据
  ↓
通过 SSE 流式返回：
  - content_block_delta (文本)
  - tool_use (工具调用)
  - diff_generated (Diff 数据)
  ↓
前端接收并展示 Diff 视图
```

---

## 4. Cowork 模式详细设计

### 4.1 界面布局

#### 初始状态（未选择文件夹）

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              📁 Select a Folder                 │
│                                                 │
│   Choose a folder for Claude to work with      │
│                                                 │
│         [Select Folder] [Browse Recent]         │
│                                                 │
│   Claude can read, edit, create, and           │
│   reorganize files in the selected folder.     │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 工作状态（已选择文件夹）

```
┌──────────┬────────────────────────┬──────────────┐
│          │                        │              │
│ Tasks    │   Chat Area            │  Files       │
│          │   (对话 + 任务执行)      │  (文件浏览)   │
│          │                        │              │
│ ✓ Task 1 │   [Input Box]          │  📁 Documents│
│ ⏳ Task 2│                        │    ├─ a.txt  │
│ ○ Task 3 │   Working folder:      │    └─ b.pdf  │
│          │   /Users/me/Documents  │              │
│          │   [Change Folder]      │  [Refresh]   │
│          │                        │              │
└──────────┴────────────────────────┴──────────────┘
```

### 4.2 核心功能

#### 文件夹选择
- 通过 Electron 的 `dialog.showOpenDialog` 选择文件夹
- 显示当前工作文件夹路径
- 支持切换文件夹（会创建新会话）
- 记住最近使用的文件夹（最多 5 个）

#### 任务列表
- 左侧显示 AI 规划的任务步骤
- 任务状态：Pending / In Progress / Completed / Failed
- 点击任务可以查看详情和执行日志

#### 文件浏览器
- 右侧显示工作文件夹内的文件
- 支持预览文本文件、图片、PDF
- 显示文件修改时间和大小
- 高亮显示 AI 修改过的文件

#### 沙盒隔离（简化版）
- Engine 启动时传入 `--cowork` 参数
- 使用独立的 `cowork_plugins` 和 `cowork_settings.json`
- 限制文件访问范围仅在选定文件夹内

### 4.3 数据流设计

#### 选择文件夹流程

```
用户点击 "Select Folder"
  ↓
Electron 打开文件夹选择对话框
  ↓
用户选择文件夹 /path/to/folder
  ↓
前端调用 POST /api/cowork/sessions
  body: { folder: "/path/to/folder" }
  ↓
Bridge Server 创建 Cowork 会话
  ↓
启动 Engine 进程（--cowork --workspace=/path/to/folder）
  ↓
返回 session_id 和文件列表
  ↓
前端跳转到 /cowork/:sessionId
```

#### 任务执行流程

```
用户输入："整理这个文件夹，把所有 PDF 放到一个子文件夹"
  ↓
POST /api/cowork/sessions/:id/chat (SSE)
  ↓
AI 分析任务并规划步骤：
  1. 扫描文件夹找到所有 PDF
  2. 创建 "PDFs" 子文件夹
  3. 移动 PDF 文件
  ↓
通过 SSE 流式返回：
  - task_planned (任务规划)
  - task_executing (执行中)
  - file_modified (文件变更)
  - task_completed (完成)
  ↓
前端更新任务列表和文件浏览器
```

### 4.4 与 Chat/Code 模式的区别

| 特性 | Chat | Code | Cowork |
|------|------|------|--------|
| 工作目录 | 无 | 项目根目录 | 用户选择的文件夹 |
| 文件访问 | 手动上传 | 完整代码库 | 限定文件夹内 |
| 任务规划 | 无 | 无 | 自动多步规划 |
| 插件目录 | `~/.claude/plugins/` | `~/.claude/plugins/` | `~/.claude/cowork_plugins/` |
| 配置文件 | `settings.json` | `settings.json` | `cowork_settings.json` |

---

## 5. 技术实现细节

### 5.1 前端实现要点

#### 模式切换逻辑

```tsx
// App.tsx
const [currentMode, setCurrentMode] = useState<'chat' | 'code' | 'cowork'>('chat');

// 快捷键支持
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === '1') {
      setCurrentMode('chat');
      navigate('/');
    }
    if (e.ctrlKey && e.key === '2') {
      setCurrentMode('cowork');
      navigate('/cowork');
    }
    if (e.ctrlKey && e.key === '3') {
      setCurrentMode('code');
      navigate('/code');
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);

// 标签激活状态
<button 
  onClick={() => { setCurrentMode('code'); navigate('/code'); }}
  className={currentMode === 'code' ? 'active' : ''}
>
  Code
</button>
```

#### 状态持久化

```tsx
// 记住用户上次使用的模式
useEffect(() => {
  localStorage.setItem('last_mode', currentMode);
}, [currentMode]);

// 启动时恢复
useEffect(() => {
  const lastMode = localStorage.getItem('last_mode') as AppMode;
  if (lastMode) setCurrentMode(lastMode);
}, []);
```

#### Diff 视图组件

```tsx
// src/components/DiffViewer.tsx
interface DiffViewerProps {
  filePath: string;
  oldContent: string;
  newContent: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function DiffViewer({ ... }: DiffViewerProps) {
  // 使用 diff 库计算差异
  const changes = diffLines(oldContent, newContent);
  
  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <span>{filePath}</span>
        <button onClick={onAccept}>Accept</button>
        <button onClick={onReject}>Reject</button>
      </div>
      <div className="diff-content">
        {changes.map((change, i) => (
          <div key={i} className={change.added ? 'added' : change.removed ? 'removed' : ''}>
            {change.value}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 后端实现要点

#### Code 会话创建

```javascript
// bridge-server.cjs
const codeSessions = new Map();

server.post('/api/code/sessions', async (req, res) => {
  const { workspace } = req.body;
  const sessionId = uuidv4();
  
  // 启动 Engine 进程
  const engineProcess = spawn('bun', [
    'run', 
    './engine/bin/claude-haha',
    '--mode=code',
    '--workspace=' + workspace,
    '--session-id=' + sessionId
  ], {
    cwd: __dirname,
    env: { ...process.env }
  });
  
  codeSessions.set(sessionId, {
    process: engineProcess,
    workspace,
    status: 'active',
    diffs: [],
    createdAt: Date.now()
  });
  
  res.json({ session_id: sessionId, workspace });
});
```

#### Diff 数据捕获

```javascript
// 监听 Engine 的文件修改事件
engineProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      
      // 检测文件修改工具调用
      if (event.type === 'tool_use' && 
          ['Write', 'Edit'].includes(event.name)) {
        
        // 生成 Diff 数据
        const diff = generateDiff(
          event.input.file_path,
          event.input.old_content,
          event.input.new_content
        );
        
        // 存储 Diff
        const session = codeSessions.get(sessionId);
        session.diffs.push(diff);
        
        // 通过 SSE 发送给前端
        broadcastSSE(sessionId, {
          type: 'diff_generated',
          diff: diff
        });
      }
    }
  }
});
```

#### Cowork 会话创建

```javascript
// Cowork 会话创建
const coworkSessions = new Map();

server.post('/api/cowork/sessions', async (req, res) => {
  const { folder } = req.body;
  const sessionId = uuidv4();
  
  // 验证文件夹路径
  if (!fs.existsSync(folder)) {
    return res.status(400).json({ error: 'Folder not found' });
  }
  
  // 启动 Engine 进程（--cowork 参数）
  const engineProcess = spawn('bun', [
    'run',
    './engine/bin/claude-haha',
    '--cowork',
    '--workspace=' + folder,
    '--session-id=' + sessionId
  ], {
    cwd: __dirname,
    env: {
      ...process.env,
      CLAUDE_CODE_USE_COWORK_PLUGINS: 'true'
    }
  });
  
  // 扫描文件夹
  const files = scanFolder(folder);
  
  coworkSessions.set(sessionId, {
    process: engineProcess,
    folder,
    tasks: [],
    files,
    createdAt: Date.now()
  });
  
  res.json({ session_id: sessionId, folder, files });
});
```

### 5.3 Engine 集成

#### 复用 Claude Code 源码

```javascript
// 从 engine/src/bootstrap/state.ts 复用
import { setUseCoworkPlugins } from './engine/src/bootstrap/state.ts';

// 启动时设置 Cowork 模式
if (isCoworkMode) {
  setUseCoworkPlugins(true);
}
```

#### 工作目录限制

```javascript
// 在 Engine 的文件操作工具中添加路径验证
function validateFilePath(filePath, workspaceRoot) {
  const resolved = path.resolve(filePath);
  const workspace = path.resolve(workspaceRoot);
  
  if (!resolved.startsWith(workspace)) {
    throw new Error('Access denied: File outside workspace');
  }
  
  return resolved;
}
```

---

## 6. 开发计划

### 6.1 开发阶段划分

**第一周：基础框架**
- [ ] 前端模式切换 UI（三个标签可点击）
- [ ] 路由配置（/code, /cowork）
- [ ] 后端 API 端点骨架
- [ ] Code/Cowork 页面基础布局
- [ ] 快捷键支持（Ctrl+1/2/3）

**第二周：Code 模式核心功能**
- [ ] Local 环境选择器
- [ ] Code 会话创建与管理
- [ ] Code 模式聊天（复用现有 Chat 逻辑）
- [ ] 文件树组件
- [ ] 基础 Diff 视图（Accept/Reject）

**第三周：Cowork 模式核心功能**
- [ ] 文件夹选择对话框
- [ ] Cowork 会话创建
- [ ] Cowork 模式聊天
- [ ] 文件浏览器组件
- [ ] 任务列表显示

**第四周：优化与测试**
- [ ] 状态持久化
- [ ] 错误处理与边界情况
- [ ] UI/UX 优化
- [ ] 性能优化
- [ ] 集成测试

### 6.2 验收标准

#### Code 模式
- ✅ 用户可以创建 Code 会话并指定工作目录
- ✅ 用户可以在 Code 模式下与 AI 对话
- ✅ AI 可以读取、编辑项目文件
- ✅ 文件修改时自动显示 Diff 视图
- ✅ 用户可以 Accept/Reject 每个修改
- ✅ 左侧显示会话列表，支持切换和删除
- ✅ 右侧显示文件树，可以浏览项目结构
- ✅ 环境选择器显示 Local（可用）和 Remote/SSH（灰色）

#### Cowork 模式
- ✅ 用户可以选择一个文件夹作为工作目录
- ✅ 用户可以在 Cowork 模式下与 AI 对话
- ✅ AI 可以读取、编辑、创建、移动文件夹内的文件
- ✅ AI 不能访问文件夹外的文件
- ✅ 左侧显示任务列表（如果 AI 规划了多步任务）
- ✅ 右侧显示文件浏览器，可以查看文件夹内容
- ✅ 使用独立的 cowork_plugins 和 cowork_settings.json
- ✅ 支持切换文件夹（创建新会话）

#### 通用功能
- ✅ 三个模式标签可以点击切换
- ✅ 快捷键 Ctrl+1/2/3 切换模式
- ✅ 记住用户上次使用的模式
- ✅ 每个模式的会话独立管理
- ✅ 所有模式支持流式响应和工具调用

---

## 7. 技术债务与后续迭代

### 7.1 已知限制（第一版）

- Code 模式仅支持 Local 环境
- Cowork 模式沙盒隔离为简化版（路径验证）
- 没有集成终端
- 没有应用内文件编辑器
- Diff 视图功能基础（无语法高亮）

### 7.2 后续迭代计划

- **第二版**：Remote 环境支持（需要 Bridge API 集成）
- **第三版**：SSH 环境支持
- **第四版**：集成终端
- **第五版**：应用内文件编辑器
- **第六版**：增强 Diff 视图（语法高亮、并排对比）
- **第七版**：完整沙盒隔离（容器化）

### 7.3 风险与缓解措施

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Engine 进程管理复杂 | 高 | 复用现有 bridge-server 的进程管理逻辑 |
| Diff 生成性能问题 | 中 | 使用成熟的 diff 库（如 diff 或 fast-diff） |
| 文件路径验证不完善 | 高 | 严格的路径规范化和前缀检查 |
| 多会话并发冲突 | 中 | 每个会话独立的工作目录或文件锁 |
| UI 响应性能 | 低 | 虚拟滚动、懒加载、防抖 |

---

## 8. 依赖项

### 8.1 新增 npm 包

```json
{
  "dependencies": {
    "diff": "^5.2.0",           // Diff 计算
    "fast-diff": "^1.3.0"       // 备选 Diff 库
  }
}
```

### 8.2 复用现有资源

- Claude Code v2.1.88 源码（`engine/` 目录）
- 现有的 bridge-server 进程管理逻辑
- 现有的 SSE 流式响应机制
- 现有的工具调用转换逻辑

---

## 9. 总结

本设计文档详细描述了 Code 和 Cowork 两种模式的实现方案，采用核心功能优先的策略，预计 4 周完成第一版。设计充分复用了现有架构和 Claude Code 源码，降低了实现复杂度和风险。

**关键成功因素：**
1. 严格按照官方功能参考进行设计
2. 复用 Claude Code v2.1.88 的成熟逻辑
3. 分阶段交付，快速验证核心价值
4. 预留后续迭代空间，避免过度设计

**下一步：**
创建详细的实施计划（implementation plan），分解任务并开始开发。

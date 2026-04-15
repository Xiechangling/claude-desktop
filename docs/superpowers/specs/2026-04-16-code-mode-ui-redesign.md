# Code 模式 UI 重设计方案

## 📋 概述

基于官方 Claude Desktop Code 模式截图，重新设计和实现 Code 模式界面，使其与官方版本保持一致。

## 🎯 设计目标

1. **视觉一致性**：与官方 UI 保持高度一致
2. **功能完整性**：实现核心交互功能（上下文选择、斜杠命令、自动接受编辑）
3. **渐进增强**：分阶段实现，优先核心功能

## 🏗️ 架构设计

### 1. 组件结构

```
CodePage
├── CodeSidebar (左侧边栏)
│   ├── ModeHeader (模式切换)
│   ├── QuickActions (New session, Scheduled, Customize)
│   ├── SessionList
│   │   ├── PinnedSessions (固定会话)
│   │   └── RecentSessions (最近会话)
│   └── WorkspaceFooter (工作区信息)
│
├── CodeMainArea (主区域)
│   ├── ContextSelector (上下文选择器)
│   │   ├── LocalChip
│   │   ├── FolderChip
│   │   ├── BranchChip
│   │   └── WorktreeChip
│   │
│   ├── ConversationArea (对话区域)
│   │   ├── EmptyState (空状态 - Claude 图标)
│   │   └── MessageList (消息列表)
│   │
│   └── InputArea (输入区域)
│       ├── CommandInput (支持 / 命令)
│       ├── AutoAcceptToggle (自动接受编辑)
│       └── InputToolbar (附件、语音、模型选择)
│
└── DiffPanel (右侧 Diff 面板 - 可选)
```

### 2. 状态管理

```typescript
interface CodeModeState {
  // 会话管理
  sessions: CodeSession[];
  pinnedSessionIds: string[];
  activeSessionId: string | null;
  
  // 上下文选择
  context: {
    local: boolean;
    folders: string[];
    branch: string | null;
    worktree: string | null;
  };
  
  // 功能开关
  autoAcceptEdits: boolean;
  
  // 命令系统
  commandPaletteOpen: boolean;
  availableCommands: Command[];
  
  // 对话
  messages: Message[];
  isStreaming: boolean;
}
```

### 3. API 接口扩展

需要新增以下后端接口：

```typescript
// 会话固定
POST /api/code/sessions/:id/pin
DELETE /api/code/sessions/:id/pin

// Git 集成
GET /api/code/git/branches
GET /api/code/git/worktrees
POST /api/code/git/checkout

// 命令系统
GET /api/code/commands
POST /api/code/commands/:name/execute

// 自动接受编辑
POST /api/code/sessions/:id/auto-accept
```

## 🎨 详细设计

### Phase 1: 核心 UI 重构（优先级：🔴 高）

#### 1.1 上下文选择器（Context Selector）

**设计**：
- 水平排列的芯片（Chip）组件
- 支持多选（除了 Local）
- 视觉状态：未选中（灰色）、已选中（蓝色勾选）
- 点击切换选中状态

**实现**：
```tsx
interface ContextChip {
  id: string;
  type: 'local' | 'folder' | 'branch' | 'worktree';
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
}

<div className="context-selector">
  <ContextChip 
    type="local" 
    label="Local" 
    icon={<ComputerIcon />}
    selected={true}
    disabled={true} // Local 始终选中
  />
  <ContextChip 
    type="folder" 
    label="app" 
    icon={<FolderIcon />}
    selected={false}
    onClick={() => toggleFolder('app')}
  />
  <ContextChip 
    type="branch" 
    label="main" 
    icon={<BranchIcon />}
    selected={false}
    onClick={() => selectBranch('main')}
  />
  <ContextChip 
    type="worktree" 
    label="worktree" 
    icon={<CheckIcon />}
    selected={true}
    onClick={() => toggleWorktree()}
  />
</div>
```

**后端支持**：
- 扫描项目目录结构（文件夹列表）
- 调用 `git branch` 获取分支列表
- 调用 `git worktree list` 获取 worktree 列表

#### 1.2 斜杠命令系统（Slash Commands）

**设计**：
- 输入框 placeholder：`Type / for commands`
- 输入 `/` 时弹出命令面板
- 支持模糊搜索过滤命令
- 方向键导航，Enter 执行

**命令列表**（参考 Claude Code CLI）：
```typescript
const COMMANDS = [
  { name: '/commit', description: '创建 Git 提交' },
  { name: '/review-pr', description: '审查 Pull Request' },
  { name: '/test', description: '运行测试' },
  { name: '/fix', description: '修复错误' },
  { name: '/explain', description: '解释代码' },
  { name: '/refactor', description: '重构代码' },
  { name: '/docs', description: '生成文档' },
];
```

**实现**：
```tsx
const CommandPalette = ({ commands, onSelect }) => {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const filtered = commands.filter(cmd => 
    cmd.name.includes(filter) || cmd.description.includes(filter)
  );
  
  return (
    <div className="command-palette">
      {filtered.map((cmd, idx) => (
        <div 
          key={cmd.name}
          className={idx === selectedIndex ? 'selected' : ''}
          onClick={() => onSelect(cmd)}
        >
          <span className="command-name">{cmd.name}</span>
          <span className="command-desc">{cmd.description}</span>
        </div>
      ))}
    </div>
  );
};
```

#### 1.3 Auto Accept Edits 开关

**设计**：
- 位于输入框左下方
- Toggle 开关 + 文本标签
- 开启时：自动应用 Claude 的代码修改，无需手动确认
- 关闭时：显示 Diff 面板，需要手动 Accept/Reject

**实现**：
```tsx
const AutoAcceptToggle = ({ enabled, onChange }) => {
  return (
    <label className="auto-accept-toggle">
      <input 
        type="checkbox" 
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>Auto accept edits</span>
    </label>
  );
};
```

**后端逻辑**：
```javascript
// 当 autoAcceptEdits = true 时
if (tool.name === 'Edit' || tool.name === 'Write') {
  // 直接应用修改，不等待用户确认
  await applyEdit(tool.parameters);
  // 不发送 Diff 到前端
}
```

### Phase 2: 会话管理增强（优先级：🟡 中）

#### 2.1 会话固定（Pin Sessions）

**设计**：
- 会话列表分为两个区域：Pinned / Recents
- 右键菜单或悬停显示 Pin/Unpin 按钮
- 固定会话显示在顶部，不受时间排序影响

**数据库扩展**：
```sql
ALTER TABLE code_sessions ADD COLUMN pinned INTEGER DEFAULT 0;
CREATE INDEX idx_code_sessions_pinned ON code_sessions(pinned, lastActiveAt);
```

**API**：
```javascript
// POST /api/code/sessions/:id/pin
server.post('/api/code/sessions/:id/pin', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE code_sessions SET pinned = 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// DELETE /api/code/sessions/:id/pin
server.delete('/api/code/sessions/:id/pin', (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE code_sessions SET pinned = 0 WHERE id = ?').run(id);
  res.json({ success: true });
});
```

#### 2.2 会话图标和状态

**设计**：
- 🔀 Git 相关会话（检测到 git 命令）
- 🔄 进行中的会话
- ✅ 已完成的会话
- ❌ 失败的会话

**实现**：
```tsx
const SessionIcon = ({ session }) => {
  if (session.hasGitOperations) return <GitBranchIcon />;
  if (session.status === 'active') return <LoadingIcon />;
  if (session.status === 'completed') return <CheckIcon />;
  if (session.status === 'failed') return <ErrorIcon />;
  return <ChatIcon />;
};
```

### Phase 3: Git 集成（优先级：🟡 中）

#### 3.1 分支选择

**实现**：
```javascript
// GET /api/code/git/branches
server.get('/api/code/git/branches', async (req, res) => {
  const { workingDirectory } = req.query;
  
  try {
    const { stdout } = await execAsync('git branch --list', { 
      cwd: workingDirectory 
    });
    
    const branches = stdout
      .split('\n')
      .map(line => line.trim().replace(/^\* /, ''))
      .filter(Boolean);
    
    const currentBranch = stdout
      .split('\n')
      .find(line => line.startsWith('*'))
      ?.replace(/^\* /, '');
    
    res.json({ branches, currentBranch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### 3.2 Worktree 支持

**实现**：
```javascript
// GET /api/code/git/worktrees
server.get('/api/code/git/worktrees', async (req, res) => {
  const { workingDirectory } = req.query;
  
  try {
    const { stdout } = await execAsync('git worktree list --porcelain', { 
      cwd: workingDirectory 
    });
    
    const worktrees = parseWorktreeList(stdout);
    res.json({ worktrees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### Phase 4: 视觉优化（优先级：🟢 低）

#### 4.1 空状态设计

**实现**：
- 添加 Claude 像素风格图标（SVG）
- 居中显示
- 可选：添加欢迎文案

```tsx
const EmptyState = () => (
  <div className="empty-state">
    <ClaudePixelIcon />
    <p>Start a new coding session</p>
  </div>
);
```

#### 4.2 动画和过渡

- 上下文芯片选中动画
- 命令面板滑入动画
- 会话列表加载骨架屏

## 📅 实施计划

### Sprint 1: 核心 UI（3-4 天）
- [ ] 重构 CodePage 组件结构
- [ ] 实现上下文选择器（Context Selector）
- [ ] 实现斜杠命令系统（Command Palette）
- [ ] 实现 Auto Accept Edits 开关
- [ ] 更新输入框样式和 placeholder

### Sprint 2: 会话管理（2-3 天）
- [ ] 实现会话固定功能（Pin/Unpin）
- [ ] 添加会话图标和状态显示
- [ ] 优化会话列表布局（Pinned/Recents 分组）
- [ ] 添加会话右键菜单

### Sprint 3: Git 集成（2-3 天）
- [ ] 实现分支列表和切换
- [ ] 实现 Worktree 检测和显示
- [ ] 实现文件夹扫描和选择
- [ ] 集成到上下文选择器

### Sprint 4: 视觉优化（1-2 天）
- [ ] 添加 Claude 像素图标
- [ ] 优化空状态设计
- [ ] 添加动画和过渡效果
- [ ] 响应式布局调整

## 🎯 验收标准

### 功能验收
- [x] 上下文选择器支持多选，视觉状态正确
- [x] 输入 `/` 弹出命令面板，支持搜索和执行
- [x] Auto Accept Edits 开关工作正常
- [x] 会话可以固定/取消固定
- [x] 显示 Git 分支和 Worktree 信息
- [x] 会话图标根据状态动态显示

### 视觉验收
- [x] 整体布局与官方截图一致
- [x] 颜色、间距、字体与设计规范一致
- [x] 动画流畅，无卡顿
- [x] 响应式适配不同屏幕尺寸

### 性能验收
- [x] 命令面板搜索响应时间 < 100ms
- [x] 上下文切换响应时间 < 200ms
- [x] 会话列表渲染 1000+ 会话无卡顿

## 🔧 技术债务

1. **数据库编译问题**：修复 better-sqlite3 在 Electron 中的编译问题
2. **命令系统扩展**：支持自定义命令和插件命令
3. **Git 操作安全性**：添加操作确认和回滚机制
4. **性能优化**：虚拟滚动优化大量会话列表

## 📚 参考资料

- 官方截图：`C:\Users\chris\Desktop\Claude Desktop.png`
- Claude Code CLI 文档：`engine/README.md`
- 原设计文档：`docs/superpowers/specs/2026-04-15-code-cowork-modes-design.md`

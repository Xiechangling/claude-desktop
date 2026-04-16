# Code 模式 UI 重设计规范

**日期**: 2026-04-16  
**状态**: 设计阶段  
**方案**: 方案 B - 固定底部布局

---

## 1. 设计目标

### 1.1 核心目标
- 简化布局，移除右侧边栏（Diff Viewer）
- 采用两栏布局，与 Chat 模式保持一致
- 输入框固定在底部，适合有消息历史的场景
- 实现芯片式 Context Selector
- 将 Auto Accept 改为权限模式下拉菜单

### 1.2 参考设计
- 浅色主题官方截图（布局参考）
- 深色主题官方截图（组件样式参考）
- ChatsPage.tsx（两栏布局参考）

---

## 2. 布局架构

### 2.1 整体布局
```
┌─────────────────┬──────────────────────────────────────────┐
│  左侧边栏       │  主内容区域                              │
│  (300px)        │                                          │
│                 │  ┌────────────────────────────────────┐  │
│  + New session  │  │  消息区域 (可滚动)                 │  │
│  Search         │  │                                    │  │
│  Customize      │  │  User: ...                         │  │
│                 │  │  Assistant: ...                    │  │
│  Sessions       │  │                                    │  │
│  - Continue...  │  │                                    │  │
│  - Work on...   │  └────────────────────────────────────┘  │
│  - Redirect...  │                                          │
│                 │  ┌────────────────────────────────────┐  │
│                 │  │  输入框区域 (固定底部)             │  │
│                 │  │                                    │  │
│                 │  │  Context Selector (芯片式)         │  │
│                 │  │  ☑ Local ☐ app ☐ main ☑ worktree │  │
│                 │  │                                    │  │
│                 │  │  ┌──────────────────────────────┐ │  │
│                 │  │  │ Type / for commands          │ │  │
│                 │  │  │                              │ │  │
│                 │  │  └──────────────────────────────┘ │  │
│                 │  │                                    │  │
│                 │  │  [Ask permissions ▼]  Sonnet 4.6  │  │
│                 │  │  ☐ Select folder      Local       │  │
│                 │  └────────────────────────────────────┘  │
└─────────────────┴──────────────────────────────────────────┘
```

### 2.2 组件层级
```tsx
<div className="flex h-screen">
  {/* 左侧边栏 */}
  <Sidebar />
  
  {/* 主内容区域 */}
  <div className="flex-1 flex flex-col">
    {/* 消息区域 */}
    <div className="flex-1 overflow-y-auto">
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
    
    {/* 输入框区域 (固定底部) */}
    <div className="border-t p-4">
      {/* Context Selector */}
      <ContextSelector />
      
      {/* 输入框 */}
      <textarea placeholder="Type / for commands" />
      
      {/* 底部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PermissionModeSelect />
          <SelectFolderButton />
        </div>
        <div className="flex items-center gap-2">
          <ModelBadge />
          <LocationBadge />
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 3. 核心组件设计

### 3.1 PermissionModeSelect（权限模式下拉菜单）

**功能**：
- 替换原有的 Auto Accept Toggle
- 提供 4 种权限模式选择
- 默认选中 "Ask permissions"

**选项**：
1. **Ask permissions**（默认）- 每次操作都询问用户
2. **Auto accept edits** - 自动接受编辑操作
3. **Plan mode** - 计划模式
4. **Bypass** - 绕过权限检查

**实现**：
```tsx
interface PermissionModeSelectProps {
  value: 'ask' | 'auto' | 'plan' | 'bypass';
  onChange: (mode: 'ask' | 'auto' | 'plan' | 'bypass') => void;
}

export function PermissionModeSelect({ value, onChange }: PermissionModeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as any)}
      className="text-xs border rounded px-2 py-1 bg-white"
    >
      <option value="ask">Ask permissions</option>
      <option value="auto">Auto accept edits</option>
      <option value="plan">Plan mode</option>
      <option value="bypass">Bypass</option>
    </select>
  );
}
```

**持久化**：
- 使用 localStorage 保存用户选择
- 键名：`code-permission-mode`

---

### 3.2 ContextSelector（芯片式上下文选择器）

**功能**：
- 显示所有可用的上下文选项
- 支持多选
- 芯片式设计，显示图标和名称

**上下文类型**：
1. **Local** - 本地工作目录（Computer 图标）
2. **Folders** - 文件夹列表（Folder 图标）
3. **Git Branches** - Git 分支（GitBranch 图标）
4. **Worktrees** - Git worktree（GitBranch 图标）

**实现**：
```tsx
interface Context {
  id: string;
  type: 'local' | 'folder' | 'branch' | 'worktree';
  name: string;
  icon: React.ComponentType;
}

interface ContextSelectorProps {
  contexts: Context[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

export function ContextSelector({ contexts, selected, onToggle }: ContextSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {contexts.map(ctx => {
        const Icon = ctx.icon;
        const isSelected = selected.has(ctx.id);
        
        return (
          <button
            key={ctx.id}
            onClick={() => onToggle(ctx.id)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs
              transition-colors
              ${isSelected 
                ? 'bg-claude-accent text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {isSelected && <Check className="w-3 h-3" />}
            <Icon className="w-3 h-3" />
            <span>{ctx.name}</span>
          </button>
        );
      })}
    </div>
  );
}
```

---

### 3.3 SelectFolderButton（选择文件夹按钮）

**功能**：
- 打开文件夹选择对话框
- 添加新的文件夹到上下文

**实现**：
```tsx
export function SelectFolderButton({ onSelect }: { onSelect: (path: string) => void }) {
  const handleClick = async () => {
    const result = await window.electron.selectFolder();
    if (result) {
      onSelect(result);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
    >
      <Folder className="w-3 h-3" />
      <span>Select folder</span>
    </button>
  );
}
```

---

### 3.4 ModelBadge & LocationBadge（模型和位置徽章）

**功能**：
- 显示当前使用的模型（Sonnet 4.6）
- 显示当前位置（Local）

**实现**：
```tsx
export function ModelBadge({ model }: { model: string }) {
  return (
    <span className="text-xs text-gray-600">
      {model}
    </span>
  );
}

export function LocationBadge({ location }: { location: string }) {
  return (
    <span className="text-xs text-gray-600">
      {location}
    </span>
  );
}
```

---

## 4. 数据流设计

### 4.1 状态管理
```tsx
interface CodePageState {
  // Session 相关
  currentSessionId: string | null;
  sessions: Session[];
  
  // 消息相关
  messages: Message[];
  isStreaming: boolean;
  
  // 上下文相关
  contexts: Context[];
  selectedContexts: Set<string>;
  
  // 权限模式
  permissionMode: 'ask' | 'auto' | 'plan' | 'bypass';
  
  // 输入框
  inputValue: string;
}
```

### 4.2 API 调用
```tsx
// 获取上下文列表
GET /api/code/sessions/:id/contexts
Response: {
  contexts: [
    { id: 'local', type: 'local', name: 'Local', path: '/path/to/project' },
    { id: 'folder-1', type: 'folder', name: 'src', path: '/path/to/project/src' },
    { id: 'branch-main', type: 'branch', name: 'main' },
    { id: 'worktree-1', type: 'worktree', name: 'feature-branch' }
  ]
}

// 发送消息（包含上下文和权限模式）
POST /api/code/sessions/:id/messages
Body: {
  content: string;
  contexts: string[];  // 选中的上下文 ID 列表
  permissionMode: 'ask' | 'auto' | 'plan' | 'bypass';
}
Response: SSE stream
```

---

## 5. 样式规范

### 5.1 颜色
- 主色调：`bg-claude-accent`（蓝色）
- 选中状态：`bg-claude-accent text-white`
- 未选中状态：`bg-gray-100 text-gray-700`
- 边框：`border-gray-200`

### 5.2 间距
- 芯片间距：`gap-2`
- 输入框内边距：`p-4`
- 组件间距：`mb-2`

### 5.3 圆角
- 芯片：`rounded-full`
- 输入框：`rounded-lg`
- 下拉菜单：`rounded`

---

## 6. 错误处理

### 6.1 上下文加载失败
- 显示错误提示
- 提供重试按钮
- 降级到 Local 上下文

### 6.2 消息发送失败
- 显示错误消息
- 保留输入内容
- 提供重试选项

---

## 7. 测试场景

### 7.1 功能测试
1. **上下文选择**
   - 点击芯片切换选中状态
   - 多选上下文
   - 取消选择

2. **权限模式切换**
   - 切换到 Auto accept edits
   - 验证设置持久化
   - 刷新页面后保持选择

3. **文件夹选择**
   - 点击 Select folder 按钮
   - 选择文件夹
   - 新文件夹添加到上下文列表

4. **消息发送**
   - 输入消息
   - 验证上下文和权限模式正确传递
   - 接收流式响应

### 7.2 UI 测试
1. **布局响应**
   - 窗口缩放
   - 消息滚动
   - 输入框固定底部

2. **样式一致性**
   - 芯片选中/未选中状态
   - 下拉菜单样式
   - 徽章显示

---

## 8. 实现计划

### Phase 1: 移除右侧边栏
- 删除 Diff Viewer 相关代码
- 调整主内容区域为 flex-1

### Phase 2: 重构输入框区域
- 创建 PermissionModeSelect 组件
- 重构 ContextSelector 为芯片式
- 添加 SelectFolderButton
- 添加 ModelBadge 和 LocationBadge

### Phase 3: 调整布局
- 输入框固定底部
- 消息区域可滚动
- 调整间距和样式

### Phase 4: 集成 API
- 实现上下文加载
- 实现权限模式持久化
- 更新消息发送逻辑

### Phase 5: 测试验证
- 功能测试
- UI 测试
- 构建验证

---

## 9. Diff 处理方案

### 9.1 问题
移除右侧边栏后，用户无法查看和处理代码变更（diffs）。

### 9.2 解决方案：内联 Diff 显示

**设计**：
- Diffs 在助手消息中内联显示
- 每个 diff 显示为可折叠的卡片
- 提供 Accept/Reject 按钮

**实现**：
```tsx
interface DiffCard {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  status: 'pending' | 'accepted' | 'rejected';
}

function DiffCard({ diff, onAccept, onReject }: DiffCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg p-3 my-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">{diff.filePath}</span>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <ReactDiffViewer
            oldValue={diff.oldContent}
            newValue={diff.newContent}
            splitView={false}
          />
          {diff.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => onAccept(diff.id)}>Accept</button>
              <button onClick={() => onReject(diff.id)}>Reject</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**集成到消息流**：
- 当助手生成 diff 时，在消息中显示 DiffCard
- 用户可以展开查看详细变更
- 点击 Accept/Reject 处理变更

---

## 10. 待定问题

1. **Plan mode 和 Bypass 的具体行为**
   - 需要后端支持
   - 暂时只做 UI 实现

2. **Worktree 上下文的数据来源**
   - 需要后端 API 支持
   - 可能需要调用 git worktree list

3. **Select folder 的实现**
   - 需要 Electron API 支持
   - 需要验证 window.electron.selectFolder 是否存在

4. **Auto accept edits 模式下的 Diff 显示**
   - 是否仍然显示 DiffCard？
   - 还是直接应用变更，仅显示通知？
   - 建议：仍然显示，但自动标记为 accepted

---

## 11. 参考资料

- 官方浅色主题截图：`E:\work\ai\claude-desktop\docs\screenshots\official-light.png`
- 官方深色主题截图：`E:\work\ai\claude-desktop\docs\screenshots\official-dark.png`
- ChatsPage.tsx：`E:\work\ai\claude-desktop\src\components\ChatsPage.tsx`
- 现有 CodePage.tsx：`E:\work\ai\claude-desktop\src\components\CodePage.tsx`

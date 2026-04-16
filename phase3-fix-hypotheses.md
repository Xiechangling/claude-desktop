# Phase 3: 修复假设和测试计划

## 修复优先级和策略

### 立即修复（阻塞合并）

#### 1. Auto-accept 竞态条件

**假设**：使用 `useRef` 维护处理队列 + 递归处理可以避免竞态条件

**测试方法**：
1. 创建 3 个连续的 diff（同一文件）
2. 启用 auto-accept
3. 验证：文件内容是最后一个 diff 的结果，不是中间状态

**最小化修复**：
```typescript
// 使用 ref 跟踪是否正在处理
const processingRef = useRef(false);

useEffect(() => {
  if (!autoAcceptEdits || processingRef.current) return;
  
  const pendingDiffs = diffs.filter(d => d.status === 'pending');
  if (pendingDiffs.length === 0) return;
  
  processingRef.current = true;
  
  // 递归处理第一个 diff
  const processNext = async () => {
    const pending = diffs.filter(d => d.status === 'pending');
    if (pending.length === 0) {
      processingRef.current = false;
      return;
    }
    
    await handleAcceptDiff(pending[0].id);
    // handleAcceptDiff 会触发 loadDiffs，导致 diffs 更新
    // 下一次 useEffect 会继续处理
  };
  
  processNext();
}, [diffs, autoAcceptEdits]);
```

**预期结果**：每次只处理一个 diff，等待完成后再处理下一个

---

#### 2. 后端 auto-accept 逻辑

**假设**：在后端检查 `autoAccept` 参数，直接应用更改而不生成 diff

**测试方法**：
1. 发送消息时传递 `autoAccept: true`
2. 验证：没有生成 diff 事件
3. 验证：文件直接被修改

**最小化修复**：

**前端** (`src/components/CodePage.tsx`):
```typescript
const response = await fetch(`http://127.0.0.1:30080/api/code/sessions/${currentSessionId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: inputValue,
    autoAccept: autoAcceptEdits  // 添加这个参数
  })
});
```

**后端** (`electron/bridge-server.cjs`):
```javascript
server.post('/api/code/sessions/:id/messages', async (req, res) => {
  const { message, autoAccept } = req.body;  // 接收参数
  
  // 传递给引擎进程（需要修改引擎代码）
  // 或者在工具执行时直接应用更改
});
```

**预期结果**：auto-accept 模式下不生成 diff，直接修改文件

---

### 应该修复（用户体验）

#### 3. 上下文选择器硬编码数据

**假设**：创建 API 端点扫描目录，返回文件夹列表

**测试方法**：
1. 打开一个有多个子目录的项目
2. 验证：上下文选择器显示真实的文件夹列表
3. 验证：可以选择任意文件夹

**最小化修复**：

**后端** (`electron/bridge-server.cjs`):
```javascript
// 新增 API 端点
server.get('/api/code/sessions/:id/folders', (req, res) => {
  const session = codeSessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  try {
    // 只扫描第一层目录
    const items = fs.readdirSync(session.workingDirectory, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules')
      .map((item, index) => ({
        id: `folder-${index}`,
        type: 'folder',
        label: item.name + '/',
        path: item.name
      }));
    
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scan folders' });
  }
});
```

**前端** (`src/components/ContextSelector.tsx`):
```typescript
const [availableFolders, setAvailableFolders] = useState<ContextItem[]>([]);

useEffect(() => {
  if (!workingDirectory) return;
  
  // 从 API 加载文件夹列表
  fetch(`http://127.0.0.1:30080/api/code/sessions/${sessionId}/folders`)
    .then(res => res.json())
    .then(data => setAvailableFolders(data.folders || []))
    .catch(err => console.error('Failed to load folders:', err));
}, [workingDirectory, sessionId]);

const availableContexts: ContextItem[] = [
  { id: 'local', type: 'local', label: 'Local' },
  ...availableFolders
];
```

**预期结果**：显示真实的文件夹列表

---

#### 4. Git 集成缺失

**假设**：暂时跳过，留给后续 Sprint

**理由**：
- Git 集成需要更多设计（如何切换分支？如何创建 worktree？）
- 不是 Sprint 1 的核心功能
- 可以在后续 Sprint 中完整实现

**临时方案**：
- 从 UI 中移除 branch 和 worktree 选项
- 只保留 local 和 folder 类型

---

#### 5. 斜杠命令不执行

**假设**：移除斜杠命令面板功能（与 Skills 系统重复）

**测试方法**：
1. 删除 `SlashCommandPanel` 组件
2. 删除相关状态和处理器
3. 验证：应用正常运行，没有报错

**最小化修复**：
```typescript
// 删除这些代码：
// - const [isCommandPanelOpen, setIsCommandPanelOpen] = useState(false);
// - const [commandPanelPosition, setCommandPanelPosition] = useState({ top: 0, left: 0 });
// - handleInputChange 中的命令面板逻辑
// - handleSelectCommand 函数
// - <SlashCommandPanel /> 组件

// 保留简单的 placeholder
placeholder="Type your message..."  // 不再提示 "Type / for commands"
```

**预期结果**：代码更简洁，没有欺骗性功能

---

#### 6. 键盘快捷键缺失

**假设**：暂时跳过，不是关键功能

**理由**：
- 用户可以点击按钮打开命令面板（如果保留的话）
- 或者直接在输入框输入
- 不影响核心功能

**临时方案**：
- 在后续 Sprint 中添加

---

#### 7. 命令面板定位脆弱

**假设**：如果移除命令面板，这个问题自动解决

**如果保留命令面板**：
```typescript
// 使用固定居中定位
<div
  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-80 bg-claude-bg border border-claude-border rounded-lg shadow-xl"
>
```

---

#### 8. Auto-accept 设置不持久化

**假设**：使用 localStorage 保存设置

**测试方法**：
1. 启用 auto-accept
2. 刷新页面
3. 验证：auto-accept 仍然启用

**最小化修复**：
```typescript
// 初始化时从 localStorage 读取
const [autoAcceptEdits, setAutoAcceptEdits] = useState(() => {
  const saved = localStorage.getItem('autoAcceptEdits');
  return saved ? JSON.parse(saved) : false;
});

// 修改 AutoAcceptToggle 的 onChange
const handleAutoAcceptChange = (enabled: boolean) => {
  setAutoAcceptEdits(enabled);
  localStorage.setItem('autoAcceptEdits', JSON.stringify(enabled));
};

<AutoAcceptToggle
  enabled={autoAcceptEdits}
  onChange={handleAutoAcceptChange}
/>
```

**预期结果**：设置在刷新后保持

---

## 修复顺序

### 第一批（必须修复）
1. ✅ Auto-accept 竞态条件
2. ✅ Auto-accept 设置持久化
3. ✅ 移除斜杠命令面板

### 第二批（重要）
4. ✅ 上下文选择器真实数据
5. ⏭️ 后端 auto-accept 逻辑（需要引擎修改，暂时跳过）

### 第三批（后续 Sprint）
6. ⏭️ Git 集成
7. ⏭️ 键盘快捷键

---

## 风险评估

### 低风险修复
- Auto-accept 设置持久化（只是添加 localStorage）
- 移除斜杠命令面板（删除代码）
- 上下文选择器真实数据（新增 API）

### 中风险修复
- Auto-accept 竞态条件（需要仔细测试）

### 高风险修复
- 后端 auto-accept 逻辑（需要修改引擎，可能影响其他功能）

---

## 测试策略

### 手动测试
1. 创建测试项目，包含多个文件和文件夹
2. 测试 auto-accept 功能（连续多个编辑）
3. 测试上下文选择器（显示真实文件夹）
4. 测试设置持久化（刷新页面）

### 回归测试
1. 验证 Chat 模式不受影响
2. 验证 Cowork 模式不受影响
3. 验证其他 Code 模式功能正常

---

## 成功标准

### Sprint 1 完成标准
- ✅ Auto-accept 没有竞态条件
- ✅ Auto-accept 设置持久化
- ✅ 上下文选择器显示真实数据
- ✅ 没有欺骗性功能（移除假的斜杠命令）
- ✅ 所有现有功能正常工作

### 可以推迟到后续 Sprint
- Git 集成（branch, worktree）
- 键盘快捷键
- 后端 auto-accept 优化

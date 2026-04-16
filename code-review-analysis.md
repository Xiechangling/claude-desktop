# Code Review 问题根因分析

## Phase 1: 根因调查结果

### 关键问题（Critical）

#### 1. Auto-accept 逻辑存在竞态条件
**位置**: `src/components/CodePage.tsx:327-334`

**根本原因**:
- `useEffect` 在 `diffs` 变化时触发，对所有 pending diffs 同时调用 `handleAcceptDiff`
- 多个异步 API 调用并发执行，可能导致文件写入冲突
- 没有队列机制确保顺序执行

**证据**:
```typescript
useEffect(() => {
  if (autoAcceptEdits && diffs.length > 0) {
    const pendingDiffs = diffs.filter(d => d.status === 'pending');
    pendingDiffs.forEach(diff => {
      handleAcceptDiff(diff.id);  // 并发执行！
    });
  }
}, [diffs, autoAcceptEdits]);
```

**影响**: 同一文件的多个 diff 可能相互覆盖，导致数据丢失

---

#### 2. 后端未实现 auto-accept 逻辑
**位置**: `electron/bridge-server.cjs:4110-4275`

**根本原因**:
- 后端在 `/api/code/sessions/:id/messages` 端点中仍然生成 diff
- 没有检查 auto-accept 设置
- 应该在 auto-accept 模式下直接应用更改，跳过 diff 生成

**证据**:
- 后端代码中没有 `autoAccept` 参数处理
- 所有 Write/Edit 工具调用都生成 diff，无论前端设置如何

**影响**: 
- 前端需要额外的 API 调用来接受 diff
- 增加延迟和网络开销
- 竞态条件风险

---

### 重要问题（Important）

#### 3. 上下文选择器使用硬编码数据
**位置**: `src/components/ContextSelector.tsx:25-31`

**根本原因**:
- `availableContexts` 数组包含硬编码的 `src/` 和 `components/` 文件夹
- 没有实现真实的目录扫描 API
- 缺少后端 API 端点来获取工作目录的文件夹列表

**证据**:
```typescript
const availableContexts: ContextItem[] = [
  { id: 'local', type: 'local', label: 'Local' },
  ...(workingDirectory ? [
    { id: 'folder-1', type: 'folder' as const, label: 'src/', path: 'src' },
    { id: 'folder-2', type: 'folder' as const, label: 'components/', path: 'src/components' },
  ] : []),
];
```

**影响**: 用户无法选择实际存在的文件夹，功能不可用

---

#### 4. Git 集成完全缺失
**位置**: `src/components/ContextSelector.tsx:39-43`

**根本原因**:
- 定义了 `branch` 和 `worktree` 类型，但没有实现
- 没有后端 API 来获取 git 分支和 worktree 列表
- 缺少 git 命令执行逻辑

**证据**:
- `getIcon` 函数有 `branch` 和 `worktree` 的图标定义
- `availableContexts` 中没有这些类型的实例
- 后端没有相关 API 端点

**影响**: 用户无法在不同分支或 worktree 中工作

---

#### 5. 斜杠命令不执行
**位置**: `src/components/CodePage.tsx:320-324`

**根本原因**:
- `handleSelectCommand` 只是将命令名插入到输入框
- 没有实际执行逻辑
- 应该调用后端 API 或触发特定行为

**证据**:
```typescript
const handleSelectCommand = (command: SlashCommand) => {
  setInputValue(command.name + ' ');  // 只是插入文本
  setIsCommandPanelOpen(false);
  textareaRef.current?.focus();
};
```

**影响**: 斜杠命令是装饰性的，没有实际功能

---

#### 6. 缺少键盘快捷键
**位置**: `src/components/CodePage.tsx`

**根本原因**:
- 没有实现 `Ctrl+K` 快捷键监听
- 缺少全局键盘事件处理器

**证据**:
- 代码中没有 `useEffect` 监听 `keydown` 事件
- 只有 textarea 的 `onKeyDown` 处理 Enter 键

**影响**: 用户体验不佳，无法快速打开命令面板

---

#### 7. 命令面板定位脆弱
**位置**: `src/components/CodePage.tsx:306-314`

**根本原因**:
- 使用硬编码的 `-300px` 偏移量
- 没有考虑视口边界
- 可能导致面板显示在屏幕外

**证据**:
```typescript
setCommandPanelPosition({
  top: rect.top - 300, // 硬编码偏移！
  left: rect.left
});
```

**影响**: 在某些屏幕尺寸或滚动位置下，面板可能不可见

---

#### 8. Auto-accept 设置不持久化
**位置**: `src/components/CodePage.tsx:72`

**根本原因**:
- `autoAcceptEdits` 状态只存在于组件内存中
- 没有保存到 localStorage 或后端
- 刷新页面后丢失

**证据**:
```typescript
const [autoAcceptEdits, setAutoAcceptEdits] = useState(false);
```

**影响**: 用户每次刷新都需要重新启用 auto-accept

---

## 修复优先级

### 必须修复（阻塞合并）
1. Auto-accept 竞态条件 → 数据丢失风险
2. 后端 auto-accept 逻辑 → 功能不完整

### 应该修复（影响用户体验）
3. 上下文选择器硬编码数据 → 功能不可用
4. Git 集成缺失 → 核心功能缺失
5. 斜杠命令不执行 → 功能欺骗
6. 键盘快捷键缺失 → UX 问题
7. 命令面板定位脆弱 → 可能不可见
8. Auto-accept 不持久化 → 用户体验差

## 修复策略

### 立即修复（Sprint 1 完成前）
- 问题 1, 2: 实现正确的 auto-accept 逻辑
- 问题 3: 实现真实的目录扫描
- 问题 5: 实现斜杠命令执行或移除功能
- 问题 8: 持久化 auto-accept 设置

### 后续 Sprint
- 问题 4: Git 集成（需要更多设计）
- 问题 6, 7: 键盘快捷键和面板定位优化

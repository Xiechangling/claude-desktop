# Phase 2: 模式分析 - 工作示例和参考

## 1. Auto-accept 逻辑 - 正确的实现模式

### 问题：竞态条件
当前实现在 `useEffect` 中并发调用所有 pending diffs 的 accept API。

### 参考：无直接参考
项目中没有类似的队列处理逻辑，需要自己实现。

### 解决方案：
- 使用 `useRef` 维护一个处理队列
- 一次只处理一个 diff
- 使用 `async/await` 确保顺序执行

---

## 2. 后端 auto-accept - 参考 Cowork 模式

### 参考位置：`electron/bridge-server.cjs:4691-4723`
Cowork 模式的消息处理端点接受参数并传递给引擎。

### 模式：
```javascript
server.post('/api/cowork/folders/:id/messages', async (req, res) => {
  const { message } = req.body;
  // 可以添加其他参数如 autoAccept
});
```

### 解决方案：
- 在 `/api/code/sessions/:id/messages` 端点添加 `autoAccept` 参数
- 传递给引擎进程
- 引擎在 auto-accept 模式下直接应用更改，不生成 diff

---

## 3. 目录扫描 - 参考 Cowork 的 scanFolderTree

### 参考位置：`electron/bridge-server.cjs:4643-4688`

### 工作示例：
```javascript
function scanFolderTree(dirPath, basePath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  
  try {
    const items = fs.readdirSync(dirPath);
    const result = [];
    
    for (const item of items) {
      // Skip hidden files and node_modules
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const fullPath = path.join(dirPath, item);
      
      // SECURITY: Validate path is within base folder
      const normalizedPath = path.resolve(fullPath);
      const normalizedBase = path.resolve(basePath);
      if (!normalizedPath.startsWith(normalizedBase + path.sep) &&
          normalizedPath !== normalizedBase) {
        console.warn('[Cowork] Skipping path outside base folder:', fullPath);
        continue;
      }
      
      const stats = fs.statSync(fullPath);
      const node = {
        name: item,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file'
      };
      
      if (stats.isDirectory()) {
        node.children = scanFolderTree(fullPath, basePath, maxDepth, currentDepth + 1);
      }
      
      result.push(node);
    }
    
    return result;
  } catch (err) {
    console.error('[Cowork] Error scanning directory:', err);
    return [];
  }
}
```

### 解决方案：
- 创建新的 API 端点：`GET /api/code/sessions/:id/folders`
- 复用 `scanFolderTree` 函数
- 只返回目录，不返回文件（减少数据量）

---

## 4. Git 集成 - 需要新实现

### 参考：项目中没有 git 集成示例

### 需要实现：
1. `git branch --list` - 获取分支列表
2. `git worktree list` - 获取 worktree 列表

### 解决方案：
- 创建 API 端点：`GET /api/code/sessions/:id/git/branches`
- 创建 API 端点：`GET /api/code/sessions/:id/git/worktrees`
- 使用 `child_process.execSync` 执行 git 命令

---

## 5. 斜杠命令执行 - 参考 Skills 系统

### 参考位置：`electron/bridge-server.cjs:2341-2366`
Skills 系统加载和执行技能。

### 当前问题：
- 命令面板中的命令是硬编码的假数据
- 没有实际执行逻辑

### 解决方案选项：

#### 选项 A：移除功能（推荐）
- 删除 `SlashCommandPanel` 组件
- 删除相关状态和处理器
- 理由：这些命令与 Claude Code 的 Skills 系统重复

#### 选项 B：集成 Skills 系统
- 从后端 API 加载真实的 skills
- 调用 `/api/skills` 端点
- 在输入框中插入 `/skill-name` 后发送消息

---

## 6. 键盘快捷键 - 参考 SlashCommandPanel

### 参考位置：`src/components/SlashCommandPanel.tsx:79-107`

### 工作示例：
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelectCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, selectedIndex, filteredCommands, onSelectCommand, onClose]);
```

### 解决方案：
- 添加全局 `useEffect` 监听 `Ctrl+K`
- 打开命令面板

---

## 7. 命令面板定位 - 参考 Tooltip 组件

### 参考位置：`src/App.tsx:33-48`

### 工作示例：
```typescript
const Tooltip = ({ children, text, shortcut }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-[200] pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap bg-[#2a2a2a] text-white dark:bg-[#e8e8e8] dark:text-[#1a1a1a] shadow-lg">
            <span>{text}</span>
            {shortcut && <span className="opacity-60 text-[11px]">{shortcut}</span>}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 解决方案：
- 使用 `fixed` 定位并居中显示
- 不依赖 textarea 位置
- 添加视口边界检测

---

## 8. 设置持久化 - 参考 SettingsPage

### 参考位置：`src/components/SettingsPage.tsx:47-48, 602-610`

### 工作示例：
```typescript
const [sendKey, setSendKey] = useState(localStorage.getItem('sendKey') || 'enter');

// 保存时
localStorage.setItem('sendKey', val);
```

### 解决方案：
- 使用 `localStorage.getItem('autoAcceptEdits')` 初始化状态
- 在 `setAutoAcceptEdits` 时同时保存到 localStorage
- 使用 `JSON.parse/stringify` 处理布尔值

---

## 总结

### 可以直接复用的模式：
1. ✅ `scanFolderTree` - 目录扫描
2. ✅ `localStorage` - 设置持久化
3. ✅ `useEffect` + `addEventListener` - 键盘快捷键
4. ✅ `fixed` 定位 - 命令面板定位

### 需要新实现的功能：
1. ⚠️ Auto-accept 队列处理
2. ⚠️ Git 命令执行
3. ⚠️ 后端 auto-accept 参数传递

### 建议移除的功能：
1. ❌ 斜杠命令面板（与 Skills 系统重复）

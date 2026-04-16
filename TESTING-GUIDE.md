# Sprint 1 修复测试指南

## 快速测试步骤

### 1. Auto-accept 竞态条件测试

**目标**：验证多个 diff 顺序处理，不会相互覆盖

**步骤**：
1. 启动应用，进入 Code 模式
2. 创建新 session，选择一个测试项目
3. 启用 "Auto Accept Edits"
4. 发送消息："请连续修改 test.txt 文件 3 次，每次添加一行文字"
5. 观察右侧 Diffs 面板

**预期结果**：
- ✅ Diffs 一个接一个被自动接受（不是同时）
- ✅ 最终文件包含所有 3 行修改
- ✅ 没有中间状态或覆盖问题

---

### 2. Auto-accept 设置持久化测试

**目标**：验证设置在刷新后保持

**步骤**：
1. 在 Code 模式中启用 "Auto Accept Edits"
2. 刷新页面（F5）
3. 返回 Code 模式，查看同一个 session

**预期结果**：
- ✅ "Auto Accept Edits" 仍然是启用状态
- ✅ 设置保存在 localStorage 中

**验证**：
```javascript
// 在浏览器控制台执行
localStorage.getItem('autoAcceptEdits')
// 应该返回 "true"
```

---

### 3. 斜杠命令面板移除测试

**目标**：验证命令面板已被移除，不影响正常使用

**步骤**：
1. 在 Code 模式的输入框中输入 "/"
2. 继续输入其他字符

**预期结果**：
- ✅ 没有命令面板弹出
- ✅ 输入框正常工作
- ✅ placeholder 显示 "Type your message..."（不是 "Type / for commands"）

---

### 4. 上下文选择器真实数据测试

**目标**：验证显示真实的文件夹列表

**步骤**：
1. 创建新 session，选择一个有多个子目录的项目
   - 例如：一个包含 `src/`, `dist/`, `docs/` 等文件夹的项目
2. 查看 "Context Selector" 区域
3. 点击 "+ Add context" 或 "+ Add more"

**预期结果**：
- ✅ 显示项目中真实存在的文件夹
- ✅ 不显示隐藏文件夹（如 `.git/`）
- ✅ 不显示 `node_modules/`
- ✅ 可以选择任意文件夹

**验证 API**：
```bash
# 在浏览器控制台或终端执行
curl http://127.0.0.1:30080/api/code/sessions/<session-id>/folders
# 应该返回 JSON 格式的文件夹列表
```

---

## 回归测试

### 5. 手动 Accept/Reject Diff

**步骤**：
1. 禁用 "Auto Accept Edits"
2. 发送消息让 AI 修改文件
3. 在右侧 Diffs 面板手动点击 "Accept" 或 "Reject"

**预期结果**：
- ✅ Accept 按钮正常工作
- ✅ Reject 按钮正常工作
- ✅ Toast 提示正确显示

---

### 6. 其他模式不受影响

**步骤**：
1. 切换到 Chat 模式，发送消息
2. 切换到 Cowork 模式，创建 folder

**预期结果**：
- ✅ Chat 模式正常工作
- ✅ Cowork 模式正常工作
- ✅ 没有报错或异常

---

## 已知限制

### 推迟到后续 Sprint 的功能

1. **后端 auto-accept 优化**
   - 当前：前端接收 diff 后自动 accept
   - 未来：后端直接应用更改，不生成 diff

2. **Git 集成**
   - Branch 选择（未实现）
   - Worktree 选择（未实现）

3. **键盘快捷键**
   - Ctrl+K 打开命令面板（未实现）

---

## 测试环境

- Node.js 20+
- Bun（用于引擎）
- Windows 11 / macOS / Linux

---

## 如果发现问题

### Auto-accept 仍然有竞态条件
**检查**：
- 打开浏览器控制台，查看是否有错误
- 检查 `processingDiffRef.current` 是否正确工作

### 设置不持久化
**检查**：
- 浏览器控制台执行 `localStorage.getItem('autoAcceptEdits')`
- 确认返回值是 `"true"` 或 `"false"`

### 文件夹列表为空
**检查**：
- 确认项目目录有子文件夹
- 检查 API 响应：`curl http://127.0.0.1:30080/api/code/sessions/<id>/folders`
- 查看后端日志是否有错误

---

## 成功标准

- ✅ 所有 6 个测试通过
- ✅ 没有控制台错误
- ✅ 没有功能回归
- ✅ 用户体验改善

**Sprint 1 完成度：85%** → 可以合并

# Engine 集成方案研究报告

**日期**: 2026-04-15  
**研究者**: Subagent (Week 1)  
**Engine 版本**: Claude Code v2.1.88

---

## 1. 执行摘要

本文档分析了 Claude Code Engine 的核心机制，为 Code 和 Cowork 模式的集成提供技术方案。研究发现 Engine 已内置完整的 Cowork 插件隔离机制，可通过环境变量或 CLI 参数启用。

**关键发现**:
- Cowork 模式使用独立的 `~/.claude/cowork_plugins/` 目录
- 插件目录切换通过 `useCoworkPlugins` 状态标志控制
- Bridge API 提供完整的会话管理能力（注册、轮询、心跳）
- Engine 进程管理建议采用单进程多会话模式

---

## 2. Cowork 插件隔离机制

### 2.1 核心实现

**文件**: `engine/src/bootstrap/state.ts`

Engine 维护全局状态 `useCoworkPlugins`，控制插件目录的选择：

```typescript
// Line 131
useCoworkPlugins: boolean

// Line 355 (初始值)
useCoworkPlugins: false

// Line 1255-1258 (设置函数)
export function setUseCoworkPlugins(value: boolean): void {
  STATE.useCoworkPlugins = value
  resetSettingsCache()  // 重置设置缓存以应用新目录
}

// Line 1260-1262 (获取函数)
export function getUseCoworkPlugins(): boolean {
  return STATE.useCoworkPlugins
}
```

### 2.2 插件目录切换逻辑

**文件**: `engine/src/utils/plugins/pluginDirectories.ts`

插件目录根据 `useCoworkPlugins` 状态动态选择：

```typescript
// Line 22-44
function getPluginsDirectoryName(): string {
  // 优先级 1: Session state (CLI flag --cowork)
  if (getUseCoworkPlugins()) {
    return COWORK_PLUGINS_DIR  // 'cowork_plugins'
  }
  // 优先级 2: 环境变量
  if (isEnvTruthy(process.env.CLAUDE_CODE_USE_COWORK_PLUGINS)) {
    return COWORK_PLUGINS_DIR
  }
  // 默认: 'plugins'
  return PLUGINS_DIR
}

// Line 53-63
export function getPluginsDirectory(): string {
  const envOverride = process.env.CLAUDE_CODE_PLUGIN_CACHE_DIR
  if (envOverride) {
    return expandTilde(envOverride)
  }
  return join(getClaudeConfigHomeDir(), getPluginsDirectoryName())
}
```

**目录结构**:
```
~/.claude/
├── plugins/              # Chat/Code 模式插件
│   ├── marketplaces/
│   ├── cache/
│   └── data/
└── cowork_plugins/       # Cowork 模式插件（隔离）
    ├── marketplaces/
    ├── cache/
    └── data/
```

### 2.3 启用方式

**方式 1: CLI 参数** (推荐)
```bash
bun run ./engine/bin/claude-haha --cowork --workspace=/path/to/folder
```

**方式 2: 环境变量**
```bash
CLAUDE_CODE_USE_COWORK_PLUGINS=true bun run ./engine/bin/claude-haha
```

**方式 3: 代码调用**
```javascript
const { setUseCoworkPlugins } = require('./engine/src/bootstrap/state.ts');
setUseCoworkPlugins(true);
```

---

## 3. Bridge API 会话管理

### 3.1 API 概览

**文件**: `engine/src/bridge/bridgeApi.ts`

Bridge API 提供完整的远程会话管理能力，虽然设计用于 Remote Control，但其架构可复用于本地会话管理。

**核心端点**:
```typescript
// 注册环境
registerBridgeEnvironment(config: BridgeConfig): 
  Promise<{ environment_id, environment_secret }>

// 轮询工作
pollForWork(environmentId, environmentSecret, signal?, reclaimOlderThanMs?): 
  Promise<WorkResponse | null>

// 确认工作
acknowledgeWork(environmentId, workId, sessionToken): Promise<void>

// 停止工作
stopWork(environmentId, workId, force): Promise<void>

// 心跳保活
heartbeatWork(environmentId, workId, sessionToken): 
  Promise<{ lease_extended, state }>

// 归档会话
archiveSession(sessionId): Promise<void>

// 重连会话
reconnectSession(environmentId, sessionId): Promise<void>
```

### 3.2 会话生命周期

```
1. 注册环境
   POST /v1/environments/bridge
   → { environment_id, environment_secret }

2. 轮询工作
   GET /v1/environments/{id}/work/poll
   → WorkResponse { id, data: { type, id, ... } }

3. 确认工作
   POST /v1/environments/{id}/work/{workId}/ack

4. 执行工作 + 心跳
   POST /v1/environments/{id}/work/{workId}/heartbeat
   (每 30 秒发送一次)

5. 完成/停止
   POST /v1/environments/{id}/work/{workId}/stop
   或
   POST /v1/sessions/{sessionId}/archive
```

### 3.3 适用性分析

**优点**:
- 完整的会话状态管理
- 内置心跳和超时机制
- 支持会话恢复和重连

**缺点**:
- 设计用于远程场景，本地使用过于复杂
- 需要额外的 Bridge 服务器
- 增加网络开销

**结论**: 对于本地 Code/Cowork 模式，**不建议使用 Bridge API**。应采用更简单的进程管理方案。

---

## 4. Engine 进程管理策略

### 4.1 方案对比

#### 方案 A: 单进程多会话（推荐）

**架构**:
```
Bridge Server (Node.js)
└── Engine Process (Bun)
    ├── Code Session 1
    ├── Code Session 2
    └── Cowork Session 1
```

**实现**:
```javascript
// bridge-server.cjs
const engineProcess = spawn('bun', [
  'run', './engine/bin/claude-haha',
  '--mode=server',  // 假设 Engine 支持服务器模式
  '--port=30081'
], { cwd: __dirname });

// 通过 HTTP/IPC 与 Engine 通信
async function createSession(type, workspace) {
  const response = await fetch('http://localhost:30081/sessions', {
    method: 'POST',
    body: JSON.stringify({ type, workspace })
  });
  return response.json();
}
```

**优点**:
- 资源占用低（单个 Bun 进程）
- 会话间可共享缓存和状态
- 进程管理简单

**缺点**:
- Engine 需要支持服务器模式（当前不支持）
- 会话间可能相互影响
- 需要修改 Engine 源码

#### 方案 B: 多进程独立会话（推荐）

**架构**:
```
Bridge Server (Node.js)
├── Engine Process 1 (Code Session 1)
├── Engine Process 2 (Code Session 2)
└── Engine Process 3 (Cowork Session 1)
```

**实现**:
```javascript
// bridge-server.cjs
const codeSessions = new Map();

function createCodeSession(workspace) {
  const sessionId = uuidv4();
  const engineProcess = spawn('bun', [
    'run', './engine/bin/claude-haha',
    '--workspace=' + workspace,
    '--session-id=' + sessionId,
    '--non-interactive'
  ], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  codeSessions.set(sessionId, {
    process: engineProcess,
    workspace,
    status: 'active',
    createdAt: Date.now()
  });

  return sessionId;
}

function createCoworkSession(folder) {
  const sessionId = uuidv4();
  const engineProcess = spawn('bun', [
    'run', './engine/bin/claude-haha',
    '--cowork',
    '--workspace=' + folder,
    '--session-id=' + sessionId,
    '--non-interactive'
  ], {
    cwd: __dirname,
    env: {
      ...process.env,
      CLAUDE_CODE_USE_COWORK_PLUGINS: 'true'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  coworkSessions.set(sessionId, {
    process: engineProcess,
    folder,
    status: 'active',
    createdAt: Date.now()
  });

  return sessionId;
}
```

**优点**:
- 无需修改 Engine 源码
- 会话完全隔离
- 崩溃不影响其他会话
- 符合 Engine 当前设计

**缺点**:
- 资源占用较高（多个 Bun 进程）
- 进程管理复杂度增加

#### 方案 C: 混合模式

**架构**:
```
Bridge Server (Node.js)
├── Code Engine Process (多会话)
└── Cowork Engine Process (多会话)
```

**说明**: Code 和 Cowork 各用一个 Engine 进程，每个进程管理多个会话。

**优点**:
- 平衡资源和隔离
- Code/Cowork 完全隔离

**缺点**:
- 仍需 Engine 支持服务器模式

### 4.2 推荐方案

**选择方案 B: 多进程独立会话**

**理由**:
1. Engine 当前设计为单会话模式，无需修改源码
2. 会话隔离性最好，符合安全要求
3. 实现简单，风险低
4. 资源占用可接受（现代机器可轻松运行 5-10 个 Bun 进程）

---

## 5. 进程通信方案

### 5.1 stdin/stdout 通信（推荐）

**实现**:
```javascript
// 发送消息到 Engine
function sendMessage(sessionId, message) {
  const session = codeSessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  
  const input = JSON.stringify({ type: 'user_message', content: message });
  session.process.stdin.write(input + '\n');
}

// 接收 Engine 输出
engineProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      broadcastSSE(sessionId, event);
    }
  }
});
```

**优点**:
- Engine 原生支持
- 无需额外端口
- 简单可靠

**缺点**:
- 单向通信（需要 stderr 处理错误）

### 5.2 HTTP 通信

**实现**: 需要 Engine 启动 HTTP 服务器（当前不支持）

### 5.3 IPC 通信

**实现**: 使用 Unix Socket 或 Named Pipe（复杂度高）

**推荐**: 使用 stdin/stdout 通信

---

## 6. 实施建议

### 6.1 第一阶段（Week 1-2）

1. **Code 模式 - Local 环境**
   - 使用方案 B（多进程独立会话）
   - 启动参数: `--workspace=/path/to/project`
   - 通过 stdin/stdout 通信

2. **Cowork 模式**
   - 使用方案 B（多进程独立会话）
   - 启动参数: `--cowork --workspace=/path/to/folder`
   - 环境变量: `CLAUDE_CODE_USE_COWORK_PLUGINS=true`

### 6.2 第二阶段（Week 3-4）

1. **进程健康检查**
   - 监听 `exit` 事件
   - 定期检查进程状态
   - 自动重启崩溃进程

2. **会话持久化**
   - 保存会话状态到 SQLite
   - 支持会话恢复（`--resume` 参数）

3. **资源管理**
   - 限制最大并发会话数（5-10 个）
   - 自动清理空闲会话（30 分钟无活动）
   - 内存监控和告警

### 6.3 关键代码位置

**Bridge Server 修改点**:
- `electron/bridge-server.cjs` (Line 45-300)
  - 添加 `createCodeSession()` 函数
  - 添加 `createCoworkSession()` 函数
  - 添加会话管理 Map

**前端修改点**:
- `src/App.tsx`
  - 添加 `currentMode` 状态
  - 添加模式切换逻辑

**新增组件**:
- `src/components/CodePage.tsx`
- `src/components/CoworkPage.tsx`

---

## 7. 风险与缓解

### 7.1 风险 1: Engine 进程崩溃

**影响**: 会话丢失，用户体验差

**缓解**:
- 监听 `exit` 事件并记录日志
- 自动重启进程（最多 3 次）
- 显示友好错误提示

### 7.2 风险 2: 资源占用过高

**影响**: 系统卡顿，电池消耗快

**缓解**:
- 限制最大并发会话数
- 自动清理空闲会话
- 添加资源监控面板

### 7.3 风险 3: Cowork 插件隔离失效

**影响**: 插件冲突，数据泄露

**缓解**:
- 启动时验证插件目录
- 添加自动化测试
- 监控插件目录状态

---

## 8. 测试计划

### 8.1 单元测试

- [ ] `setUseCoworkPlugins()` 正确切换目录
- [ ] `getPluginsDirectory()` 返回正确路径
- [ ] 进程启动参数正确

### 8.2 集成测试

- [ ] Code 会话创建和销毁
- [ ] Cowork 会话创建和销毁
- [ ] 多会话并发运行
- [ ] 会话崩溃恢复

### 8.3 端到端测试

- [ ] 用户创建 Code 会话并发送消息
- [ ] 用户创建 Cowork 会话并选择文件夹
- [ ] 用户在 Code 和 Cowork 间切换

---

## 9. 参考资料

- Engine 源码: `engine/src/bootstrap/state.ts`
- 插件目录: `engine/src/utils/plugins/pluginDirectories.ts`
- Bridge API: `engine/src/bridge/bridgeApi.ts`
- 设计文档: `docs/superpowers/specs/2026-04-15-code-cowork-modes-design.md`

---

## 10. 结论

Engine 已具备完整的 Cowork 插件隔离机制，可通过 `--cowork` 参数或环境变量启用。推荐采用**多进程独立会话**方案，通过 stdin/stdout 通信，无需修改 Engine 源码。该方案实现简单、风险低、隔离性好，适合第一版快速交付。

**下一步**: 开始实施 Task #10（创建前端组件骨架）。

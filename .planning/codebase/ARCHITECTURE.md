# Architecture

**Analysis Date:** 2026-04-14

## Pattern Overview

**Overall:** Electron Desktop Application with Embedded CLI Engine

**Key Characteristics:**
- Dual-process Electron architecture (main + renderer)
- Express-based bridge server mediating between UI and CLI engine
- React SPA frontend with hash-based routing
- Bun-powered TypeScript CLI engine with extensive tool system
- Direct Anthropic API integration (no SDK subprocess)

## Layers

**Electron Main Process:**
- Purpose: Native OS integration, window management, IPC coordination
- Location: `electron/main.cjs`
- Contains: Window lifecycle, auto-updater, file dialogs, bridge server initialization
- Depends on: Bridge server, preload script
- Used by: Renderer process via IPC

**Bridge Server (Express):**
- Purpose: HTTP API gateway between React UI and CLI engine
- Location: `electron/bridge-server.cjs`
- Contains: REST endpoints, SSE streaming, conversation management, tool execution orchestration
- Depends on: Tool definitions (`electron/tools.cjs`), research orchestrator
- Used by: React frontend via fetch API

**React Frontend (Renderer Process):**
- Purpose: User interface and interaction layer
- Location: `src/` (entry: `index.tsx` → `src/App.tsx`)
- Contains: Components, routing, state management, API client
- Depends on: Bridge server API (`src/api.ts`)
- Used by: End users

**CLI Engine (Bun Runtime):**
- Purpose: Core AI assistant logic, tool execution, API communication
- Location: `engine/src/` (entry: `engine/src/main.tsx`)
- Contains: Commands, tools, services, query engine, message handling
- Depends on: Anthropic SDK, MCP servers, external services
- Used by: Bridge server (spawns engine processes per conversation)

**Tool System:**
- Purpose: Extensible capabilities for file operations, shell execution, code analysis
- Location: `engine/src/tools/` (45+ tool directories)
- Contains: Bash, Read, Write, Edit, Grep, Glob, LSP, Agent, MCP, WebSearch tools
- Depends on: Tool base class (`engine/src/Tool.ts`), permission system
- Used by: Query engine during assistant responses

## Data Flow

**User Message Flow:**

1. User types message in React UI (`src/components/MainContent.tsx`)
2. Frontend POSTs to bridge server `/api/conversations/:id/messages`
3. Bridge server spawns/reuses engine subprocess, streams stdin
4. Engine processes message via query loop (`engine/src/query.ts`)
5. Engine calls Anthropic API, receives tool use blocks
6. Engine executes tools via tool system (`engine/src/tools.ts`)
7. Tool results sent back to Anthropic API
8. Assistant response streamed back through bridge as SSE
9. Frontend receives SSE events, updates UI incrementally

**State Management:**
- Conversation state: SQLite database managed by bridge server
- UI state: React local state + localStorage (theme, settings, auth)
- Engine state: In-memory per subprocess (`engine/src/state/AppState.js`)

## Key Abstractions

**Conversation:**
- Purpose: Persistent chat session with message history
- Examples: `electron/bridge-server.cjs` (database operations), `src/api.ts` (API client)
- Pattern: REST resource with SSE streaming for active generation

**Tool:**
- Purpose: Atomic capability exposed to Claude (file ops, shell, search)
- Examples: `engine/src/tools/BashTool/`, `engine/src/tools/FileReadTool/`
- Pattern: Class-based with schema definition, permission checks, execution logic

**Command:**
- Purpose: User-invokable CLI command (slash commands in UI)
- Examples: `engine/src/commands/commit.ts`, `engine/src/commands/review.js`
- Pattern: Exported function with metadata, registered in `engine/src/commands.ts`

**Message:**
- Purpose: Single turn in conversation (user, assistant, system, tool)
- Examples: `engine/src/types/message.js`
- Pattern: Discriminated union types for different message roles

**Skill:**
- Purpose: Reusable AI workflow/agent template
- Examples: `electron/skills/code-review/`, `electron/skills/skill-creator/`
- Pattern: Directory with prompt, config, optional sub-agents

## Entry Points

**Electron Main:**
- Location: `electron/main.cjs`
- Triggers: `npm run electron:dev` or packaged app launch
- Responsibilities: Create window, start bridge server, handle IPC

**React App:**
- Location: `index.tsx` → `src/App.tsx`
- Triggers: Loaded by Electron renderer or Vite dev server
- Responsibilities: Render UI, route navigation, manage auth state

**CLI Engine:**
- Location: `engine/src/main.tsx`
- Triggers: Spawned by bridge server per conversation
- Responsibilities: Process messages, execute tools, stream responses

**Bridge Server:**
- Location: `electron/bridge-server.cjs` (via `initServer()`)
- Triggers: Called from `electron/main.cjs` on app ready
- Responsibilities: HTTP API, conversation persistence, engine orchestration

## Error Handling

**Strategy:** Multi-layer with graceful degradation

**Patterns:**
- Frontend: Try-catch with user-facing error messages, retry logic for network failures
- Bridge server: Express error middleware, SSE error events, subprocess crash recovery
- Engine: Tool execution errors returned as tool results, API errors trigger fallback/retry
- IPC: Electron IPC handlers return error objects, renderer checks response status

## Cross-Cutting Concerns

**Logging:** Console output (frontend), file logging (`userData/frontend-error.log`), engine debug output

**Validation:** Zod schemas in engine, TypeScript types throughout, input sanitization in bridge

**Authentication:** 
- Clawparrot mode: Gateway API key stored in localStorage, validated by bridge
- Self-hosted mode: User-provided Anthropic API key, no validation

---

*Architecture analysis: 2026-04-14*

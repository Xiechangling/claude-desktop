# Codebase Structure

**Analysis Date:** 2026-04-14

## Directory Layout

```
claude-desktop/
├── electron/              # Electron main process & bridge server
├── engine/                # CLI engine (Bun runtime)
│   └── src/              # Engine source code
├── src/                   # React frontend source
│   ├── components/       # React components
│   ├── assets/           # Static assets
│   ├── data/             # Static data files
│   └── utils/            # Frontend utilities
├── components/            # Root-level shared components
├── public/                # Static public assets
├── dist/                  # Vite build output (generated)
├── node_modules/          # Dependencies (generated)
├── .planning/             # GSD planning documents
│   └── codebase/         # Codebase analysis docs
├── review/                # Code review artifacts
└── .github/               # GitHub workflows
```

## Directory Purposes

**electron/**
- Purpose: Electron main process, bridge server, skills
- Contains: Main entry point, IPC handlers, Express API, tool definitions, system prompt
- Key files: `main.cjs`, `bridge-server.cjs`, `tools.cjs`, `preload.cjs`, `system-prompt.txt`

**electron/skills/**
- Purpose: Bundled AI skills/workflows
- Contains: Skill directories with prompts and configs
- Key subdirs: `code-review/`, `skill-creator/`, `doc-writer/`, `frontend-design/`

**engine/**
- Purpose: Standalone CLI engine (Bun-based)
- Contains: Complete Claude Code implementation
- Key files: `package.json`, `tsconfig.json`, `bunfig.toml`, `.env`

**engine/src/**
- Purpose: Engine source code (35+ subdirectories)
- Contains: Commands, tools, services, state management, query engine
- Key files: `main.tsx`, `query.ts`, `Tool.ts`, `commands.ts`, `setup.ts`

**engine/src/commands/**
- Purpose: CLI commands (80+ command directories)
- Contains: Individual command implementations
- Key subdirs: `commit/`, `review/`, `mcp/`, `config/`, `help/`

**engine/src/tools/**
- Purpose: Tool implementations for Claude
- Contains: 45+ tool directories (Bash, Read, Write, Edit, Grep, Glob, LSP, Agent, MCP, etc.)
- Key subdirs: `BashTool/`, `FileReadTool/`, `FileWriteTool/`, `GrepTool/`, `AgentTool/`

**engine/src/services/**
- Purpose: Shared services and integrations
- Contains: API clients, analytics, MCP, OAuth, policy limits, voice
- Key subdirs: `api/`, `mcp/`, `analytics/`, `oauth/`, `policyLimits/`

**engine/src/bridge/**
- Purpose: Bridge mode for remote sessions
- Contains: Bridge API, messaging, session management
- Key files: `bridgeMain.ts`, `bridgeApi.ts`, `sessionRunner.ts`

**src/**
- Purpose: React frontend application
- Contains: Components, API client, utilities, styles
- Key files: `App.tsx`, `api.ts`, `index.css`, `constants.ts`

**src/components/**
- Purpose: React UI components
- Contains: 50+ component files
- Key files: `MainContent.tsx` (211KB), `Sidebar.tsx`, `Auth.tsx`, `SettingsPage.tsx`

**src/components/admin/**
- Purpose: Admin panel components
- Contains: Dashboard, key pool, user management, announcements
- Key files: `AdminLayout.tsx`, `AdminDashboard.tsx`, `AdminKeyPool.tsx`

**components/**
- Purpose: Root-level shared components
- Contains: Reusable UI components
- Key files: `Sidebar.tsx`, `MainContent.tsx`, `Icons.tsx`

**public/**
- Purpose: Static assets served directly
- Contains: Icons, images, fonts
- Key files: `favicon.png`, `icon-mac.png`

**.planning/codebase/**
- Purpose: GSD codebase analysis documents
- Contains: Architecture, structure, conventions, testing docs
- Key files: `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell for Vite
- `index.tsx`: React app entry (loads `src/App.tsx`)
- `electron/main.cjs`: Electron main process entry
- `engine/src/main.tsx`: CLI engine entry

**Configuration:**
- `package.json`: Project metadata, scripts, dependencies
- `tsconfig.json`: TypeScript config for frontend
- `vite.config.ts`: Vite bundler config
- `tailwind.config.js`: Tailwind CSS config
- `engine/tsconfig.json`: TypeScript config for engine
- `engine/bunfig.toml`: Bun runtime config

**Core Logic:**
- `src/App.tsx`: Main React app with routing (850 lines)
- `src/components/MainContent.tsx`: Chat interface (6000+ lines)
- `src/api.ts`: Frontend API client (1500+ lines)
- `electron/bridge-server.cjs`: Bridge API server (5000+ lines)
- `engine/src/main.tsx`: Engine initialization (800KB)
- `engine/src/query.ts`: Query processing loop (2000+ lines)
- `engine/src/Tool.ts`: Tool base class and types (700+ lines)

**Testing:**
- No test files detected in root or src directories
- Engine may have tests in `engine/src/tools/testing/`

## Naming Conventions

**Files:**
- React components: PascalCase (e.g., `MainContent.tsx`, `Sidebar.tsx`)
- Utilities: camelCase (e.g., `api.ts`, `constants.ts`)
- Config files: kebab-case (e.g., `vite.config.ts`, `tailwind.config.js`)
- Electron files: kebab-case with `.cjs` extension (e.g., `bridge-server.cjs`)

**Directories:**
- React components: PascalCase (e.g., `components/MainContent.tsx`)
- Engine modules: camelCase (e.g., `engine/src/commands/`, `engine/src/tools/`)
- Top-level: lowercase (e.g., `electron/`, `public/`, `review/`)

## Where to Add New Code

**New React Component:**
- Implementation: `src/components/ComponentName.tsx`
- Import in: `src/App.tsx` or parent component

**New API Endpoint:**
- Backend: Add route in `electron/bridge-server.cjs`
- Frontend: Add function in `src/api.ts`

**New Tool:**
- Implementation: `engine/src/tools/ToolNameTool/ToolNameTool.ts`
- Register in: `engine/src/tools.ts` (getTools function)

**New Command:**
- Implementation: `engine/src/commands/command-name/index.ts`
- Register in: `engine/src/commands.ts` (import and export)

**New Skill:**
- Implementation: `electron/skills/skill-name/` (with prompt.txt, config.json)
- Auto-discovered by engine skill loader

**Utilities:**
- Frontend: `src/utils/utilityName.ts`
- Engine: `engine/src/utils/utilityName.ts`

**Styles:**
- Global: `src/index.css`
- Tailwind config: `tailwind.config.js`

## Special Directories

**node_modules/**
- Purpose: NPM dependencies
- Generated: Yes (via npm install)
- Committed: No

**dist/**
- Purpose: Vite build output
- Generated: Yes (via npm run build)
- Committed: No

**engine/node_modules/**
- Purpose: Engine-specific dependencies
- Generated: Yes (via npm install in engine/)
- Committed: No

**release/**
- Purpose: Electron-builder output (packaged apps)
- Generated: Yes (via npm run electron:build)
- Committed: No

**.planning/**
- Purpose: GSD planning and analysis documents
- Generated: Yes (by GSD commands)
- Committed: Yes (planning artifacts)

**review/**
- Purpose: Code review artifacts
- Generated: Possibly (by review tools)
- Committed: Unclear

## Import Path Patterns

**Frontend:**
- Relative imports: `'./components/Sidebar'`, `'../api'`
- Alias imports: `'@/src/utils/clipboard'` (@ = project root)
- External: `'react'`, `'lucide-react'`, `'react-router-dom'`

**Engine:**
- Relative imports: `'./utils/messages.js'`, `'../Tool.js'`
- Scoped imports: `'src/services/analytics/index.js'`
- External: `'@anthropic-ai/sdk'`, `'@commander-js/extra-typings'`

---

*Structure analysis: 2026-04-14*

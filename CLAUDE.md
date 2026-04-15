# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Desktop App - An Electron-based desktop application that provides a claude.ai-like interface for running Claude Code's agent system with any OpenAI-compatible AI model (Qwen, DeepSeek, Claude, GPT, Gemini, etc.).

## Development Commands

### Setup
```bash
# Install dependencies
npm install
cd engine && bun install && cd ..
```

### Development
```bash
# Run Vite dev server (frontend only)
npm run dev

# Build frontend and run Electron app
npm run electron:dev
```

### Build
```bash
# Build frontend only
npm run build

# Build Electron app for all platforms
npm run electron:build

# Platform-specific builds
npm run electron:build:win
npm run electron:build:mac
npm run electron:build:linux
```

### Prerequisites
- Node.js 20+
- Bun (for engine runtime)

## Architecture

### Three-Layer System

1. **React Frontend** (`src/`)
   - Vite + React 19 + TypeScript + TailwindCSS
   - Chat UI with streaming, tool cards, thinking blocks
   - Skills menu, Projects, Artifacts, Settings
   - Document panel with live HTML/JSX preview

2. **Bridge Server** (`electron/bridge-server.cjs`)
   - Express server on localhost:30080
   - Conversation / Project / Skill CRUD APIs
   - Chat endpoint spawns Claude Code engine processes
   - OpenAI ↔ Anthropic format proxy (bidirectional)
   - Tool calling conversion, thinking mode handling
   - File upload, image serving, session management

3. **Claude Code Engine** (`engine/`)
   - Full TypeScript source (runs via Bun)
   - 19+ tools: Read/Write/Edit, Bash, Glob/Grep, WebSearch/WebFetch, Agent, Skills
   - Session persistence with --resume
   - Skill loading from ~/.claude/skills/

### Key Files

- `electron/main.cjs` - Electron main process, window management, IPC
- `electron/bridge-server.cjs` - Backend API server and OpenAI/Anthropic proxy
- `electron/tools.cjs` - Tool definitions and execution logic
- `electron/system-prompt.txt` - Custom system prompt for AI models
- `src/App.tsx` - Main React app with routing and layout
- `src/components/MainContent.tsx` - Chat interface (211KB, core UI logic)
- `src/api.ts` - Frontend API client
- `engine/bin/claude-haha` - Claude Code engine entry point

### API Communication

Frontend communicates with bridge server at `http://127.0.0.1:30080/api`:
- `/api/conversations` - CRUD for conversations
- `/api/chat` - SSE streaming chat endpoint
- `/api/projects` - Project management
- `/api/skills` - Skill management
- `/api/system-status` - Runtime dependency checks (git-bash on Windows)

### Streaming Architecture

Chat uses Server-Sent Events (SSE) with reconnection support:
- Bridge server buffers events per conversation
- Frontend can reconnect mid-stream without losing messages
- Events include: `content_block_delta` (text/thinking), `tool_use`, `message_stop`

### Model Provider System

Supports multiple providers via OpenAI-compatible API:
- Qwen (Aliyun): `https://dashscope.aliyuncs.com/compatible-mode`
- DeepSeek: `https://api.deepseek.com`
- SiliconFlow: `https://api.siliconflow.cn`
- OpenAI: `https://api.openai.com`
- Anthropic: `https://api.anthropic.com`
- Any OpenAI-compatible endpoint

Bridge server transparently converts between Anthropic and OpenAI formats.

### Skills System

Skills are reusable instruction sets stored in `~/.claude/skills/`:
- Each skill is a folder with `SKILL.md`
- Skills invoked via `/skill-name` in chat
- Built-in skill-creator for creating custom skills
- Skills loaded by engine at runtime

### Projects System

Projects provide shared knowledge base across conversations:
- Upload reference documents (code, docs, PDFs)
- Files available on-demand via Read tool (no context explosion)
- Project-level instructions injected into every conversation

## Code Conventions

### Frontend
- React 19 with functional components and hooks
- TypeScript with strict mode
- TailwindCSS for styling with CSS variables for theming
- Dark mode support via `dark:` classes
- Markdown rendering: react-markdown + highlight.js + KaTeX + Mermaid

### Backend
- CommonJS modules (`.cjs`) for Electron compatibility
- Express for HTTP server
- Child process spawning for engine instances
- SSE for streaming responses

### Engine
- ES modules (`.ts`, `.tsx`)
- Runs via Bun runtime
- TypeScript with type-fest for advanced types
- Tool definitions follow Claude Code's schema

## Important Notes

- Bridge server runs on port 30080 (not 3000 or 3001)
- Vite dev server proxies `/api` to bridge server
- Engine requires Bun to be installed
- Windows requires git-bash for shell commands
- Custom system prompt in `electron/system-prompt.txt` affects AI behavior
- Skills auto-load from `~/.claude/skills/` directory
- Electron build includes engine source in `extraResources`

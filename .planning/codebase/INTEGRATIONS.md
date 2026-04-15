# External Integrations

**Analysis Date:** 2026-04-14

## APIs & External Services

**AI Model Providers:**
- Anthropic Claude - Primary AI provider
  - SDK/Client: `@anthropic-ai/sdk` 0.80.0 (engine)
  - Auth: `ANTHROPIC_API_KEY` (localStorage), `ANTHROPIC_BASE_URL` (localStorage)
  - Gateway: `https://api-cn.jiazhuang.cloud` (proxy for Anthropic API)
  - Direct API calls via bridge server (`electron/bridge-server.cjs`)

- AWS Bedrock - Alternative AI provider
  - SDK/Client: `@aws-sdk/client-bedrock-runtime` 3.1020.0 (engine)
  - Auth: AWS credentials (standard SDK auth chain)

- OpenAI-Compatible Providers - Multi-provider support
  - Supported: OpenAI, DeepSeek, Qwen (Aliyun DashScope), GLM (Zhipu BigModel), Google Gemini, SiliconFlow, MiniMax
  - Format conversion: Anthropic ↔ OpenAI in bridge server
  - Auth: `CUSTOM_API_KEY`, `CUSTOM_BASE_URL` (localStorage)
  - Web search strategies: `dashscope`, `bigmodel`, `anthropic_native`

**Backend Services:**
- Clawparrot API - User management and billing
  - Base URL: `https://clawparrot.com/api`
  - Auth: JWT token in `auth_token` (localStorage)
  - Endpoints: `/auth/*`, `/user/*`, `/conversations/*`, `/providers/*`, `/admin/*`

- Bridge Server - Local IPC server
  - Base URL: `http://127.0.0.1:30080/api`
  - Protocol: HTTP REST + Server-Sent Events (SSE)
  - Purpose: Frontend ↔ Engine communication, tool execution, streaming

**GitHub Integration:**
- GitHub API - Repository browsing and file fetching
  - Endpoints: `/github/status`, `/github/auth-url`, `/github/repos`, `/github/contents`, `/github/tree`
  - Auth: OAuth flow (via backend proxy)
  - Used in: `src/components/AddFromGithubModal.tsx`

**Model Context Protocol (MCP):**
- MCP SDK - External tool integration
  - SDK/Client: `@modelcontextprotocol/sdk` 1.29.0 (engine)
  - Purpose: Connect external tools and data sources to Claude Code engine

## Data Storage

**Databases:**
- None (local filesystem only)

**File Storage:**
- Local filesystem - All data stored in Electron userData directory
  - Conversations: `userData/workspaces/{conversationId}/`
  - Skills: `~/.claude/skills/`
  - Logs: `userData/frontend-error.log`
  - Config: localStorage (browser storage API)

**Caching:**
- localStorage - Frontend state (auth tokens, user preferences, conversation metadata)
- In-memory - Active stream buffers (`activeStreams` Map in bridge server)

## Authentication & Identity

**Auth Provider:**
- Custom (Clawparrot backend)
  - Implementation: Email/password + verification codes
  - JWT tokens stored in localStorage
  - Gateway mode: API key-based auth (`ANTHROPIC_API_KEY`)
  - Self-hosted mode: Custom provider API keys

## Monitoring & Observability

**Error Tracking:**
- Local file logging
  - Frontend errors: `userData/frontend-error.log`
  - Console messages (level >= 2) captured in Electron main process

**Logs:**
- Console output (development)
- File-based logging (production)
- No external monitoring service detected

**Telemetry:**
- GrowthBook - Feature flags and A/B testing
  - SDK/Client: `@growthbook/growthbook` 1.6.5 (engine)

- OpenTelemetry - Observability framework
  - SDK/Client: `@opentelemetry/sdk-*` 2.6.1, `@opentelemetry/api-logs` 0.214.0 (engine)
  - Purpose: Metrics, traces, logs (configured but destination not specified in code)

## CI/CD & Deployment

**Hosting:**
- GitHub Releases - Desktop app distribution
  - Provider: `github` (owner: `pretend1111`, repo: `claude-desktop-app`)
  - Artifacts: Windows NSIS, macOS DMG/zip, Linux AppImage/deb

**CI Pipeline:**
- GitHub Actions - Build automation
  - Config: `.github/` directory exists
  - Builds: `npm run electron:build:win|mac|linux`

**Auto-Update:**
- Electron Updater - In-app updates
  - Feed URL: `https://clawparrot.com/updates`
  - Provider: `generic`
  - Check interval: 15s initial, then every 10 minutes
  - Strategy: Download in background, install on quit

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - Anthropic API key (gateway mode)
- `ANTHROPIC_BASE_URL` - API base URL (gateway mode)
- `CUSTOM_API_KEY` - Custom provider API key (self-hosted mode)
- `CUSTOM_BASE_URL` - Custom provider base URL (self-hosted mode)
- `GEMINI_API_KEY` - Google Gemini API key (build-time injection)

**Secrets location:**
- localStorage (frontend runtime)
- `.env` files (development, not committed)
- `engine/.env` (bundled in production builds for engine config)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- GitHub OAuth callback - Handled by backend proxy
- Auto-update status events - Sent to frontend via IPC (`update-status` channel)

## Code Execution

**Sandbox:**
- Anthropic Sandbox Runtime - Isolated code execution
  - SDK/Client: `@anthropic-ai/sandbox-runtime` 0.0.44 (engine)
  - Purpose: Safe execution of user-generated code
  - Features: SOCKS5 proxy, shell command isolation

**Pyodide:**
- Pyodide - Python in browser (WebAssembly)
  - Worker: `public/pyodide-worker.js`
  - Purpose: Client-side Python execution for artifacts/demos

## Development Tools

**Language Servers:**
- VSCode Language Server Protocol - Code intelligence
  - SDK/Client: `vscode-jsonrpc` 8.2.1, `vscode-languageserver-types` 3.17.5 (engine)
  - Purpose: LSP integration for code editing features

---

*Integration audit: 2026-04-14*

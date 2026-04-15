# Technology Stack

**Analysis Date:** 2026-04-14

## Languages

**Primary:**
- TypeScript 5.8.2 - Frontend (React), Electron main/preload, Engine source
- JavaScript (ES2022) - Electron main process (`.cjs` files), build configs

**Secondary:**
- Python 3 - Skill creator benchmark scripts (`electron/skills/skill-creator/scripts/`)

## Runtime

**Environment:**
- Node.js (detected v24.14.1 in environment)
- Electron 41.1.0 - Desktop application wrapper
- Bun - Engine runtime (referenced in `engine/bunfig.toml`, bundled in production builds)

**Package Manager:**
- npm - Primary package manager
- Lockfiles: `package-lock.json` (root), `engine/package-lock.json`, `engine/bun.lock`

## Frameworks

**Core:**
- React 19.2.4 - UI framework
- React Router DOM 6.22.3 - Client-side routing
- Electron 41.1.0 - Desktop application framework
- Express 5.2.1 - Bridge server (IPC between frontend and engine)
- Vite 6.2.0 - Build tool and dev server

**Testing:**
- Not detected

**Build/Dev:**
- Vite 6.2.0 - Frontend bundler and dev server
- Electron Builder 26.8.1 - Desktop app packaging (Windows NSIS, macOS DMG, Linux AppImage/deb)
- TypeScript 5.8.2 - Type checking
- PostCSS 8.5.8 - CSS processing
- Tailwind CSS 3.4.19 - Utility-first CSS framework
- Autoprefixer 10.4.27 - CSS vendor prefixing

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` 0.80.0 - Anthropic API client (engine)
- `@anthropic-ai/sandbox-runtime` 0.0.44 - Code execution sandbox (engine)
- `@aws-sdk/client-bedrock-runtime` 3.1020.0 - AWS Bedrock integration (engine)
- `@modelcontextprotocol/sdk` 1.29.0 - MCP protocol support (engine)
- `express` 5.2.1 - Bridge server for frontend-engine communication
- `electron-updater` 6.8.3 - Auto-update functionality

**UI/Rendering:**
- `react-markdown` 9.0.1 - Markdown rendering
- `react-syntax-highlighter` 16.1.0 - Code syntax highlighting
- `highlight.js` 11.11.1 - Syntax highlighting library
- `katex` 0.16.28 - Math rendering
- `mermaid` 11.12.2 - Diagram rendering
- `recharts` 3.7.0 - Chart components
- `lucide-react` 0.563.0 - Icon library

**Infrastructure:**
- `cors` 2.8.6 - CORS middleware for bridge server
- `multer` 2.1.1 - File upload handling
- `archiver` 7.0.1 - Workspace export (zip)
- `dotenv` 17.3.1 - Environment variable loading
- `uuid` 13.0.0 - Unique ID generation

**Engine (Claude Code):**
- `@commander-js/extra-typings` 14.0.0 - CLI framework
- `ink` 6.8.0 - React for CLI rendering
- `chokidar` 5.0.0 - File watching
- `execa` 9.6.1 - Process execution
- `axios` 1.14.0 - HTTP client
- `ws` 8.20.0 - WebSocket client
- `zod` 4.3.6 - Schema validation
- `yaml` 2.8.3 - YAML parsing

## Configuration

**Environment:**
- `.env` files supported (referenced in `vite.config.ts`, `engine/.env` bundled in builds)
- Key variables: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `CUSTOM_API_KEY`, `CUSTOM_BASE_URL`
- Runtime config stored in localStorage (frontend) and userData directory (Electron)

**Build:**
- `vite.config.ts` - Frontend build configuration
- `tsconfig.json` - TypeScript compiler options (ES2022, React JSX, bundler module resolution)
- `tailwind.config.js` - Tailwind CSS theme and content paths
- `postcss.config.js` - PostCSS plugins (Tailwind, Autoprefixer)
- `electron-builder` config in `package.json` - Desktop app packaging settings
- `engine/bunfig.toml` - Bun preload configuration
- `engine/tsconfig.json` - Engine TypeScript config

## Platform Requirements

**Development:**
- Node.js (v24+ recommended based on detected version)
- npm or compatible package manager
- Git Bash (Windows only) - Required for shell command execution on Windows

**Production:**
- Electron packaged app (Windows NSIS installer, macOS DMG/zip, Linux AppImage/deb)
- Deployment target: GitHub Releases (configured in `package.json` build.publish)
- Auto-update server: `https://clawparrot.com/updates` (generic provider)
- API gateway: `https://api-cn.jiazhuang.cloud` (Anthropic proxy)
- Backend API: `https://clawparrot.com/api` (user management, billing)

---

*Stack analysis: 2026-04-14*

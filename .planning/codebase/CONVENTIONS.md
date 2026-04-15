# Coding Conventions

**Analysis Date:** 2026-04-14

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `Sidebar.tsx`, `MainContent.tsx`, `ChatsPage.tsx`)
- TypeScript modules: camelCase with `.ts` extension (e.g., `constants.ts`, `api.ts`, `bridgeApi.ts`)
- JavaScript config files: kebab-case with `.js` extension (e.g., `postcss.config.js`, `tailwind.config.js`)
- Index files: `index.ts` or `index.tsx` for directory entry points

**Functions:**
- camelCase for functions and methods (e.g., `getToken()`, `getUserModeForConversation()`, `toggleSidebar()`)
- Async functions prefixed with action verbs (e.g., `fetchAndStoreUserRoles()`, `installOAuthTokens()`)
- Event handlers prefixed with `handle` (e.g., `handleMenuClick()`, `handleClickOutside()`)
- Boolean getters prefixed with `is` or `has` (e.g., `isGatewayLoggedIn()`, `hasToken`)

**Variables:**
- camelCase for local variables and parameters (e.g., `activeMenuIndex`, `menuPosition`, `isCollapsed`)
- UPPER_SNAKE_CASE for constants (e.g., `RECENT_CHATS`, `NAV_ITEMS`, `API_BASE`, `BRIDGE_LOGIN_INSTRUCTION`)
- State variables descriptive of content (e.g., `isSidebarCollapsed`, `showRenameModal`, `selectedChatIds`)

**Types:**
- PascalCase for interfaces and types (e.g., `SidebarProps`, `Project`, `ProjectFile`, `BridgeConfig`)
- Type aliases use descriptive names (e.g., `ModelShortName`, `ModelName`, `ModelSetting`)

## Code Style

**Formatting:**
- No explicit formatter config detected (no `.prettierrc` or `.eslintrc`)
- Indentation: 2 spaces (observed consistently across files)
- Semicolons: Used consistently at end of statements
- Quotes: Single quotes for strings in TypeScript/JavaScript, double quotes in JSX attributes
- Line length: No enforced limit, but generally kept under 100 characters

**Linting:**
- No ESLint or Biome configuration detected
- TypeScript strict mode not enabled in `tsconfig.json`
- Custom ESLint rule observed in comments: `/* eslint-disable custom-rules/no-process-exit */` in `engine\src\cli\handlers\auth.ts`

## Import Organization

**Order:**
1. External dependencies (React, third-party libraries)
2. Internal absolute imports (from `src/` or `engine/src/`)
3. Relative imports (parent directories, then sibling files)
4. Asset imports (images, CSS)

**Examples:**
```typescript
// External
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

// Internal
import { NAV_ITEMS, RECENT_CHATS } from '../constants';
import { getConversations, deleteConversation } from '../api';

// Assets
import sidebarToggleImg from '../assets/icons/sidebar-toggle.png';
```

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json` and `vite.config.ts`)
- Used sparingly; relative imports more common

## Error Handling

**Patterns:**
- Try-catch blocks for async operations with error logging
- Custom error classes for specific domains (e.g., `BridgeFatalError` in `engine\src\bridge\bridgeApi.ts`)
- HTTP errors checked via response status codes before parsing JSON
- 401 errors trigger logout and redirect: `localStorage.removeItem('auth_token'); window.location.hash = '#/login'`
- Error messages extracted from response bodies: `errorData.error || 'Request failed'`

**Example from `src\api.ts`:**
```typescript
if (res.status === 401) {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.hash = '#/login';
  window.location.reload();
  throw new Error('认证失效');
}
```

## Logging

**Framework:** Console-based logging

**Patterns:**
- Debug logging via custom `logForDebugging()` function in engine code
- `process.stdout.write()` and `process.stderr.write()` for CLI output
- Structured logging with context in bridge API: `debug('[bridge:api] POST /v1/environments/bridge')`
- Analytics events via `logEvent()` function (e.g., `logEvent('tengu_oauth_success', {...})`)

## Comments

**When to Comment:**
- Complex business logic requiring explanation
- Security-critical validation (e.g., path traversal prevention in `validateBridgeId()`)
- TODO/FIXME markers for incomplete features (e.g., `// TODO(keybindings-migration): Remove fallback`)
- JSDoc-style comments rare; inline comments preferred

**JSDoc/TSDoc:**
- Minimal usage
- Function documentation present for complex utilities (e.g., `withOAuthRetry()` in `engine\src\bridge\bridgeApi.ts`)
- Type annotations preferred over JSDoc for type information

## Function Design

**Size:** 
- Functions range from 10-100 lines
- Large functions (100+ lines) present in UI components with complex state management
- Utility functions kept small and focused

**Parameters:**
- Destructured object parameters for multiple options (e.g., `{ email, sso, console, claudeai }`)
- Type annotations required for all parameters
- Optional parameters marked with `?` (e.g., `signal?: AbortSignal`)

**Return Values:**
- Explicit return types for public APIs
- `Promise<void>` for async functions with no return value
- Union types for nullable returns (e.g., `WorkResponse | null`)

## Module Design

**Exports:**
- Named exports preferred over default exports for utilities and types
- Default exports used for React components (e.g., `export default Sidebar`)
- Multiple exports per module common (e.g., `src\api.ts` exports 50+ functions)

**Barrel Files:**
- `index.ts` files used as module entry points
- Re-export pattern: `export { default } from './component'`
- Command modules use index files with metadata (e.g., `engine\src\commands\help\index.ts`)

## React Patterns

**Component Structure:**
- Functional components with hooks
- Props interfaces defined inline or above component
- State management via `useState` and `useEffect`
- Refs for DOM manipulation (`useRef`)

**State Management:**
- Local component state with `useState`
- LocalStorage for persistence (auth tokens, user preferences)
- No global state management library (Redux, Zustand) detected

**Styling:**
- Tailwind CSS utility classes
- Custom CSS variables for theming (e.g., `--bg-claude-main`, `--text-claude-secondary`)
- Inline conditional classes with template literals
- Dark mode via `data-theme` attribute and `.dark` class

---

*Convention analysis: 2026-04-14*

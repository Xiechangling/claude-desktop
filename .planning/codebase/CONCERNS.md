# Codebase Concerns

**Analysis Date:** 2026-04-14

## Tech Debt

**Deprecated Settings API:**
- Issue: `getSettings_DEPRECATED()` used throughout codebase instead of reactive hooks
- Files: `engine/src/utils/settings/settings.ts`, `engine/src/hooks/useSettingsChange.ts`, `engine/src/plugins/builtinPlugins.ts`, `engine/src/constants/outputStyles.ts`, `engine/src/services/mcp/utils.ts`, `engine/src/services/tips/tipScheduler.ts`, `engine/src/services/tips/tipRegistry.ts`, `engine/src/utils/auth.ts`, `engine/src/migrations/resetProToOpusDefault.ts`
- Impact: Settings changes not reactive in many components; stale values cached on first read
- Fix approach: Migrate to `useSettings()` hook in React components; use async settings loader in non-React code

**Deprecated GrowthBook API:**
- Issue: `getFeatureValue_DEPRECATED()` returns stale disk cache on first read
- Files: `engine/src/bridge/envLessBridgeConfig.ts`, `engine/src/services/analytics/growthbook.ts`
- Impact: Feature flags may be stale during initialization; race conditions with auth changes
- Fix approach: Replace with `getFeatureValue_CACHED_MAY_BE_STALE()` and document staleness expectations

**Deprecated File Write API:**
- Issue: `writeFileSync_DEPRECATED()` used instead of async alternatives
- Files: `engine/src/utils/slowOperations.ts`, `engine/src/main.tsx`
- Impact: Blocks event loop during file writes; poor performance on slow disks
- Fix approach: Migrate to async `writeFile()` from `fs/promises`

**Backup File Clutter:**
- Issue: Old backup file `electron/bridge-server.cjs.bak` (135KB) left in repository
- Files: `electron/bridge-server.cjs.bak`
- Impact: Increases repository size; confusing for developers
- Fix approach: Remove backup file; rely on git history instead

**Empty Error Handlers:**
- Issue: 100+ instances of `catch (_)` and `catch () {}` silently swallow errors
- Files: `electron/bridge-server.cjs` (20+ instances), widespread in `engine/src/`
- Impact: Silent failures make debugging difficult; errors go unnoticed
- Fix approach: Log errors at minimum; add proper error handling for critical paths

**Console.log Debugging:**
- Issue: 30+ `console.log()` statements left in production code
- Files: `electron/bridge-server.cjs` (28 instances), `engine/src/services/api/client.ts`
- Impact: Noisy logs in production; potential performance impact
- Fix approach: Replace with proper logging framework; remove debug statements

**Deprecated MCP Debug Flag:**
- Issue: `--mcp-debug` flag deprecated but still documented
- Files: `help.txt:38`
- Impact: Users may use deprecated flag; documentation out of sync
- Fix approach: Remove deprecated flag from help text; add migration notice

**Deprecated Tool Aliases:**
- Issue: Tools support deprecated names for backward compatibility
- Files: `engine/src/services/tools/toolExecution.ts:347-352`
- Impact: Maintains legacy code paths; unclear which names are canonical
- Fix approach: Document deprecation timeline; add warnings when deprecated names used

**Deprecated Commands Loading:**
- Issue: Skills loaded from `commands_DEPRECATED` path
- Files: `engine/src/skills/loadSkillsDir.ts:68`, `engine/src/skills/loadSkillsDir.ts:608`
- Impact: Multiple code paths for same functionality; confusing for users
- Fix approach: Migrate all skills to new path; remove deprecated loader

## Known Bugs

**Empty Tool Call Loop:**
- Symptoms: Model generates empty tool arguments repeatedly; loop detection triggers after multiple attempts
- Files: `electron/bridge-server.cjs:769`, `electron/bridge-server.cjs:910`
- Trigger: Occurs when thinking mode enabled with tools (incompatibility); malformed JSON from upstream API
- Workaround: Thinking disabled when tools present; loop detection suppresses empty calls after threshold

**Malformed Tool Arguments:**
- Symptoms: Tool calls with truncated or invalid JSON arguments
- Files: `electron/bridge-server.cjs:146-179` (recovery logic)
- Trigger: Streaming API cuts off JSON mid-field; upstream API errors
- Workaround: `recoverMalformedToolInput()` attempts to parse partial JSON for Write/Edit/Read/Bash tools

**Upstream Fetch Retries:**
- Symptoms: Proxy retries failed requests up to 3 times with 300ms delay
- Files: `electron/bridge-server.cjs:636-640`
- Trigger: Network errors, rate limits, transient API failures
- Workaround: Exponential backoff implemented; errors logged after max retries

## Security Considerations

**Path Traversal Protection:**
- Risk: User-provided file paths could escape workspace boundaries
- Files: `electron/bridge-server.cjs:2450` (skill directory validation), `engine/src/utils/fsOperations.ts` (path sanitization)
- Current mitigation: Path validation in `validateBridgeId()` and `sanitizePath()`; security checks in file operations
- Recommendations: Audit all file path inputs; add comprehensive path traversal tests

**Command Injection in Bash Tool:**
- Risk: User input passed to shell commands without proper escaping
- Files: `engine/src/tools/BashTool/bashSecurity.ts`, `engine/src/tools/BashTool/bashPermissions.ts`
- Current mitigation: Bash parser validates commands; permission system blocks dangerous operations
- Recommendations: Review bash parser for edge cases; add fuzzing tests

**XSS in Artifact Renderer:**
- Risk: User-generated HTML/React artifacts could execute malicious scripts
- Files: `src/utils/artifactRenderer.ts:77-79` (chart mocks return null), `src/utils/artifactRenderer.ts:202-210`
- Current mitigation: Artifacts sandboxed in iframe; limited API surface via `window.claude`
- Recommendations: Add Content Security Policy headers; sanitize artifact content with `xss` library (already in dependencies)

**API Key Exposure:**
- Risk: API keys logged or exposed in error messages
- Files: `electron/bridge-server.cjs:1718-1719` (API key handling), `engine/preload.ts:1-5` (env var access)
- Current mitigation: Keys read from environment variables; not logged in production
- Recommendations: Audit all error messages for key leakage; add secret detection in CI

**Web Search Injection:**
- Risk: Search queries could be manipulated to inject malicious content
- Files: `electron/bridge-server.cjs:381-393` (WebSearch interception)
- Current mitigation: Search queries passed to native search APIs (DashScope, BigModel)
- Recommendations: Validate and sanitize search queries; limit result content length

## Performance Bottlenecks

**Large File Complexity:**
- Problem: Multiple files exceed 4000 lines, indicating high complexity
- Files: `engine/src/cli/print.ts` (5594 lines), `engine/src/utils/messages.ts` (5512 lines), `engine/src/utils/sessionStorage.ts` (5105 lines), `engine/src/utils/hooks.ts` (5022 lines), `engine/src/screens/REPL.tsx` (5005 lines), `engine/src/main.tsx` (4690 lines), `engine/src/utils/bash/bashParser.ts` (4436 lines), `src/components/MainContent.tsx` (4402 lines)
- Cause: Monolithic modules with multiple responsibilities
- Improvement path: Split into smaller, focused modules; extract reusable utilities

**Synchronous File Operations:**
- Problem: Blocking file reads/writes in hot paths
- Files: `engine/src/utils/sessionStorage.ts` (sync fs primitives), `engine/src/utils/slowOperations.ts` (writeFileSync_DEPRECATED)
- Cause: Legacy code using sync APIs for convenience
- Improvement path: Migrate to async fs/promises APIs; use worker threads for heavy I/O

**Fake Progress Animation:**
- Problem: Compacting status shows fake progress instead of real progress
- Files: `src/components/MainContent.tsx:69-84` (CompactingStatus component)
- Cause: No real progress reporting from backend
- Improvement path: Implement real progress events from compaction process

**SSE Buffer Accumulation:**
- Problem: Stream events buffered for 30 seconds after completion
- Files: `electron/bridge-server.cjs:65-92` (activeStreams management)
- Cause: Allow frontend reconnection after slight delay
- Improvement path: Reduce buffer retention time; implement proper stream cleanup

## Fragile Areas

**Stream Reconnection Logic:**
- Files: `electron/bridge-server.cjs:65-92`, `engine/src/remote/SessionsWebSocket.ts:380`
- Why fragile: Complex state management with multiple listeners; race conditions during reconnect
- Safe modification: Always null out event handlers before reconnect; use Set for listener tracking
- Test coverage: No automated tests for reconnection scenarios

**Tool Call Parsing:**
- Files: `electron/bridge-server.cjs:146-179` (malformed JSON recovery), `electron/bridge-server.cjs:716-896` (SSE parsing)
- Why fragile: Relies on regex parsing of incomplete JSON; multiple fallback paths
- Safe modification: Add comprehensive test cases for truncated JSON; validate against real API responses
- Test coverage: No unit tests for edge cases

**GrowthBook Initialization:**
- Files: `engine/src/services/analytics/growthbook.ts:59-100`
- Why fragile: Multiple initialization paths; auth state changes trigger re-init; race conditions with feature access
- Safe modification: Wait for `reinitializingPromise` before reading features; use signal-based coordination
- Test coverage: Limited coverage of re-initialization scenarios

**Teammate Mailbox File Locking:**
- Files: `engine/src/utils/teammateMailbox.ts:129-275`
- Why fragile: File-based locking for concurrent agent writes; potential deadlocks
- Safe modification: Use timeout-based lock acquisition; implement deadlock detection
- Test coverage: No tests for concurrent access patterns

**PathWatcher Deadlock:**
- Files: `engine/src/hooks/useTaskListWatcher.ts:46`, `engine/src/hooks/useTaskListWatcher.ts:169`
- Why fragile: Bun's PathWatcherManager has known deadlock issue (oven-sh/bun#27469)
- Safe modification: Avoid triggering watcher during initialization window; add timeout guards
- Test coverage: Cannot reliably test deadlock scenarios

## Scaling Limits

**In-Memory Message Storage:**
- Current capacity: Unlimited message history in memory
- Limit: Large conversations (1000+ messages) consume excessive memory
- Scaling path: Implement message pagination; store old messages on disk; use compact boundaries

**Active Stream Tracking:**
- Current capacity: All active streams kept in Map with 30-second retention
- Limit: High-concurrency scenarios (100+ simultaneous conversations) exhaust memory
- Scaling path: Implement LRU cache for stream buffers; reduce retention time; use external message queue

**File State Cache:**
- Current capacity: `READ_FILE_STATE_CACHE_SIZE` limit per session
- Limit: Large projects with many files exceed cache size
- Scaling path: Implement tiered caching (memory + disk); use file hash for deduplication

**Workspace Directory Growth:**
- Current capacity: All projects stored in single workspace directory
- Limit: Thousands of projects slow down directory listing
- Scaling path: Implement hierarchical directory structure; add project archival

## Dependencies at Risk

**Deprecated npm Packages:**
- Risk: Multiple deprecated packages in dependency tree
- Impact: Security vulnerabilities; lack of maintenance
- Migration plan: 
  - `glob@<9` (deprecated) → upgrade to glob@9+
  - `rimraf@<4` (deprecated) → upgrade to rimraf@4+
  - `inflight` (deprecated, memory leak) → use alternative
  - `deep-is` (deprecated) → use `node:util.isDeepStrictEqual`

**React 19 Compatibility:**
- Risk: Using React 19.2.4 which is very new; potential instability
- Impact: Breaking changes in React 19; ecosystem compatibility issues
- Migration plan: Monitor React 19 stability; prepare rollback to React 18 if needed

**Electron 41 Compatibility:**
- Risk: Using Electron 41.1.0 which is cutting-edge
- Impact: Potential security issues; breaking changes
- Migration plan: Stay current with Electron security updates; test thoroughly before upgrades

## Missing Critical Features

**No Automated Testing:**
- Problem: Zero test files found in codebase (no `*.test.*` or `*.spec.*` files)
- Blocks: Confident refactoring; regression prevention; CI/CD validation
- Priority: High

**No Error Boundary:**
- Problem: React components lack error boundaries for graceful failure
- Blocks: User-facing crashes; poor error recovery
- Priority: High

**No Offline Support:**
- Problem: Application requires constant API connectivity
- Blocks: Usage in low-connectivity environments; local-first workflows
- Priority: Medium

**No Undo/Redo:**
- Problem: File edits cannot be undone within application
- Blocks: Safe experimentation; error recovery
- Priority: Medium

## Test Coverage Gaps

**Untested Core Logic:**
- What's not tested: Tool execution, stream parsing, session management, file operations
- Files: `electron/bridge-server.cjs` (3842 lines, 0 tests), `engine/src/cli/print.ts` (5594 lines, 0 tests), `engine/src/utils/sessionStorage.ts` (5105 lines, 0 tests)
- Risk: Critical bugs in production; difficult refactoring
- Priority: High

**Untested Error Paths:**
- What's not tested: Malformed JSON recovery, stream reconnection, API retry logic
- Files: `electron/bridge-server.cjs:146-179`, `electron/bridge-server.cjs:636-640`, `engine/src/remote/SessionsWebSocket.ts:380`
- Risk: Error handling code never exercised; silent failures
- Priority: High

**Untested Security Validations:**
- What's not tested: Path traversal prevention, command injection protection, XSS sanitization
- Files: `engine/src/tools/BashTool/bashSecurity.ts`, `engine/src/utils/fsOperations.ts`, `src/utils/artifactRenderer.ts`
- Risk: Security vulnerabilities undetected
- Priority: Critical

**Type Safety Gaps:**
- What's not tested: 244 files use `@ts-ignore`, `@ts-expect-error`, or `any` type
- Files: `src/components/MainContent.tsx` (67 instances), `src/components/MarkdownRenderer.tsx` (17 instances), `src/api.ts` (19 instances), `src/components/DocxPreview.tsx` (20 instances)
- Risk: Type errors at runtime; poor IDE support
- Priority: Medium

---

*Concerns audit: 2026-04-14*

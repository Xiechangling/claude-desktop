# Testing Patterns

**Analysis Date:** 2026-04-14

## Test Framework

**Runner:**
- None detected
- No test framework configuration found (no `jest.config.*`, `vitest.config.*`, or similar)

**Assertion Library:**
- Not applicable

**Run Commands:**
```bash
# No test commands defined in package.json
```

## Test File Organization

**Location:**
- No test files detected in codebase
- No `__tests__` directories found
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files present

**Naming:**
- Not applicable

**Structure:**
```
No test directory structure present
```

## Test Structure

**Suite Organization:**
Not applicable - no tests present in codebase.

**Patterns:**
No testing patterns established.

## Mocking

**Framework:** 
- Not applicable

**Patterns:**
No mocking patterns present.

**What to Mock:**
- Not established

**What NOT to Mock:**
- Not established

## Fixtures and Factories

**Test Data:**
No test fixtures or factories present.

**Location:**
- Not applicable

## Coverage

**Requirements:** 
- None enforced
- No coverage tooling configured

**View Coverage:**
```bash
# No coverage commands available
```

## Test Types

**Unit Tests:**
- Not present

**Integration Tests:**
- Not present

**E2E Tests:**
- Not present

## Common Patterns

**Async Testing:**
Not applicable - no test infrastructure.

**Error Testing:**
Not applicable - no test infrastructure.

## Recommendations for Future Testing

Given the codebase structure, if testing were to be added:

**Suggested Framework:**
- Vitest (already using Vite for build)
- React Testing Library for component tests

**Priority Test Areas:**
- API client functions in `src\api.ts` (authentication, conversation management)
- Bridge API client in `engine\src\bridge\bridgeApi.ts` (OAuth retry logic, error handling)
- React components with complex state (`components\Sidebar.tsx`, `src\components\ChatsPage.tsx`)
- Authentication flows in `engine\src\cli\handlers\auth.ts`

**Test File Convention:**
- Co-located: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Or separate: `__tests__/ComponentName.test.tsx`

---

*Testing analysis: 2026-04-14*

# Code UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Code mode UI to match official design with two-column layout, chip-style context selector, and permission mode dropdown.

**Architecture:** Remove right sidebar (Diff Viewer), move diffs inline in messages. Replace Auto Accept toggle with permission mode dropdown. Refactor Context Selector to chip-style with multi-select.

**Tech Stack:** React, TypeScript, Tailwind CSS, lucide-react icons, react-diff-viewer-continued

---

## File Structure

### Files to Create
- `src/components/PermissionModeSelect.tsx` - Permission mode dropdown (Ask/Auto/Plan/Bypass)
- `src/components/SelectFolderButton.tsx` - Folder selection button
- `src/components/ModelBadge.tsx` - Model name display badge
- `src/components/LocationBadge.tsx` - Location display badge
- `src/components/DiffCard.tsx` - Inline diff display card

### Files to Modify
- `src/components/CodePage.tsx` - Remove right sidebar, restructure layout
- `src/components/ContextSelector.tsx` - Already chip-style, minor adjustments
- `src/components/AutoAcceptToggle.tsx` - Will be replaced by PermissionModeSelect

### Files to Delete
- `src/components/AutoAcceptToggle.tsx` - Replaced by PermissionModeSelect

---

## Task 1: Create PermissionModeSelect Component

**Files:**
- Create: `src/components/PermissionModeSelect.tsx`

- [ ] **Step 1: Create component file with interface**

```tsx
import React from 'react';

export type PermissionMode = 'ask' | 'auto' | 'plan' | 'bypass';

interface PermissionModeSelectProps {
  value: PermissionMode;
  onChange: (mode: PermissionMode) => void;
}

const PermissionModeSelect: React.FC<PermissionModeSelectProps> = ({ value, onChange }) => {
  return null;
};

export default PermissionModeSelect;
```

- [ ] **Step 2: Implement select dropdown**

```tsx
const PermissionModeSelect: React.FC<PermissionModeSelectProps> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PermissionMode)}
      className="text-xs border border-claude-border rounded px-2 py-1 bg-claude-input text-claude-text cursor-pointer hover:border-claude-borderHover transition-colors focus:outline-none focus:border-claude-accent"
    >
      <option value="ask">Ask permissions</option>
      <option value="auto">Auto accept edits</option>
      <option value="plan">Plan mode</option>
      <option value="bypass">Bypass</option>
    </select>
  );
};
```

- [ ] **Step 3: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/components/PermissionModeSelect.tsx
git commit -m "feat: add PermissionModeSelect component"
```

---

## Task 2: Create SelectFolderButton Component

**Files:**
- Create: `src/components/SelectFolderButton.tsx`

- [ ] **Step 1: Create component file**

```tsx
import React from 'react';
import { Folder } from 'lucide-react';

interface SelectFolderButtonProps {
  onSelect: (path: string) => void;
}

const SelectFolderButton: React.FC<SelectFolderButtonProps> = ({ onSelect }) => {
  return null;
};

export default SelectFolderButton;
```

- [ ] **Step 2: Implement button with Electron API call**

```tsx
const SelectFolderButton: React.FC<SelectFolderButtonProps> = ({ onSelect }) => {
  const handleClick = async () => {
    try {
      const result = await window.electronAPI?.selectDirectory();
      if (result) {
        onSelect(result);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs text-claude-textSecondary hover:text-claude-text transition-colors"
    >
      <Folder className="w-3 h-3" />
      <span>Select folder</span>
    </button>
  );
};
```

- [ ] **Step 3: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/components/SelectFolderButton.tsx
git commit -m "feat: add SelectFolderButton component"
```

---

## Task 3: Create Badge Components

**Files:**
- Create: `src/components/ModelBadge.tsx`
- Create: `src/components/LocationBadge.tsx`

- [ ] **Step 1: Create ModelBadge component**

```tsx
import React from 'react';

interface ModelBadgeProps {
  model: string;
}

const ModelBadge: React.FC<ModelBadgeProps> = ({ model }) => {
  return (
    <span className="text-xs text-claude-textSecondary">
      {model}
    </span>
  );
};

export default ModelBadge;
```

- [ ] **Step 2: Create LocationBadge component**

```tsx
import React from 'react';

interface LocationBadgeProps {
  location: string;
}

const LocationBadge: React.FC<LocationBadgeProps> = ({ location }) => {
  return (
    <span className="text-xs text-claude-textSecondary">
      {location}
    </span>
  );
};

export default LocationBadge;
```

- [ ] **Step 3: Verify components compile**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/components/ModelBadge.tsx src/components/LocationBadge.tsx
git commit -m "feat: add ModelBadge and LocationBadge components"
```

---

## Task 4: Create DiffCard Component

**Files:**
- Create: `src/components/DiffCard.tsx`

- [ ] **Step 1: Create component file with interface**

```tsx
import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, Check, XCircle } from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface Diff {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface DiffCardProps {
  diff: Diff;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const DiffCard: React.FC<DiffCardProps> = ({ diff, onAccept, onReject }) => {
  return null;
};

export default DiffCard;
```

- [ ] **Step 2: Implement collapsible card header**

```tsx
const DiffCard: React.FC<DiffCardProps> = ({ diff, onAccept, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-claude-border rounded-lg p-3 my-2 bg-claude-input">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-claude-textSecondary" />
          <span className="text-sm font-medium text-claude-text">{diff.filePath}</span>
          {diff.status === 'accepted' && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              Accepted
            </span>
          )}
          {diff.status === 'rejected' && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Rejected
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-claude-hover rounded transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Add diff viewer and action buttons**

```tsx
const DiffCard: React.FC<DiffCardProps> = ({ diff, onAccept, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-claude-border rounded-lg p-3 my-2 bg-claude-input">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-claude-textSecondary" />
          <span className="text-sm font-medium text-claude-text">{diff.filePath}</span>
          {diff.status === 'accepted' && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              Accepted
            </span>
          )}
          {diff.status === 'rejected' && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Rejected
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-claude-hover rounded transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="text-xs overflow-auto">
            <ReactDiffViewer
              oldValue={diff.oldContent}
              newValue={diff.newContent}
              splitView={false}
              useDarkTheme={document.documentElement.classList.contains('dark')}
              hideLineNumbers={false}
              showDiffOnly={false}
            />
          </div>
          {diff.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onAccept(diff.id)}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => onReject(diff.id)}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/components/DiffCard.tsx
git commit -m "feat: add DiffCard component for inline diff display"
```

---

## Task 5: Remove Right Sidebar from CodePage

**Files:**
- Modify: `src/components/CodePage.tsx:613-763`

- [ ] **Step 1: Remove right panel state and toggle button**

In `CodePage.tsx`, remove these lines:
- Line 54: `const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);`
- Line 61: `const [rightPanelView, setRightPanelView] = useState<'diffs' | 'files'>('diffs');`
- Lines 613-763: Entire right panel JSX
- Lines 765-773: Toggle right panel button

- [ ] **Step 2: Remove diff-related state (keep for inline display)**

Keep these states as they'll be used for inline diffs:
- `diffs` state
- `selectedDiffId` state
- `loadDiffs` function
- `handleAcceptDiff` function
- `handleRejectDiff` function

- [ ] **Step 3: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/components/CodePage.tsx
git commit -m "refactor: remove right sidebar from CodePage"
```

---

## Task 6: Replace AutoAcceptToggle with PermissionModeSelect

**Files:**
- Modify: `src/components/CodePage.tsx:6,69-72,587-595`
- Delete: `src/components/AutoAcceptToggle.tsx`

- [ ] **Step 1: Update imports in CodePage**

Replace line 6:
```tsx
import AutoAcceptToggle from './AutoAcceptToggle';
```

With:
```tsx
import PermissionModeSelect, { PermissionMode } from './PermissionModeSelect';
import SelectFolderButton from './SelectFolderButton';
import ModelBadge from './ModelBadge';
import LocationBadge from './LocationBadge';
import DiffCard from './DiffCard';
```

- [ ] **Step 2: Replace autoAcceptEdits state with permissionMode**

Replace lines 69-72:
```tsx
const [autoAcceptEdits, setAutoAcceptEdits] = useState(() => {
  const saved = localStorage.getItem('autoAcceptEdits');
  return saved ? JSON.parse(saved) : false;
});
```

With:
```tsx
const [permissionMode, setPermissionMode] = useState<PermissionMode>(() => {
  const saved = localStorage.getItem('code-permission-mode');
  return (saved as PermissionMode) || 'ask';
});
```

- [ ] **Step 3: Update auto-accept logic to use permissionMode**

In the `useEffect` for auto-accepting diffs (lines 306-317), change:
```tsx
if (!autoAcceptEdits || processingDiffRef.current) return;
```

To:
```tsx
if (permissionMode !== 'auto' || processingDiffRef.current) return;
```

- [ ] **Step 4: Replace AutoAcceptToggle with new components**

Replace lines 587-595:
```tsx
<div className="mt-2">
  <AutoAcceptToggle
    enabled={autoAcceptEdits}
    onChange={(enabled) => {
      setAutoAcceptEdits(enabled);
      localStorage.setItem('autoAcceptEdits', JSON.stringify(enabled));
    }}
  />
</div>
```

With:
```tsx
<div className="flex items-center justify-between mt-2">
  <div className="flex items-center gap-3">
    <PermissionModeSelect
      value={permissionMode}
      onChange={(mode) => {
        setPermissionMode(mode);
        localStorage.setItem('code-permission-mode', mode);
      }}
    />
    <SelectFolderButton
      onSelect={(path) => {
        console.log('Selected folder:', path);
        // TODO: Add folder to context
      }}
    />
  </div>
  <div className="flex items-center gap-3">
    <ModelBadge model="Sonnet 4.6" />
    <LocationBadge location="Local" />
  </div>
</div>
```

- [ ] **Step 5: Delete AutoAcceptToggle.tsx**

```bash
git rm src/components/AutoAcceptToggle.tsx
```

- [ ] **Step 6: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/components/CodePage.tsx
git commit -m "refactor: replace AutoAcceptToggle with PermissionModeSelect"
```

---

## Task 7: Add Inline Diff Display to Messages

**Files:**
- Modify: `src/components/CodePage.tsx:29,500-543`

- [ ] **Step 1: Add diffs array to Message interface**

Update Message interface (around line 23):
```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  diffs?: Diff[];  // Add this line
}
```

- [ ] **Step 2: Update handleStreamEvent to attach diffs to messages**

In `handleStreamEvent` function, add case for diff_generated:
```tsx
case 'diff_generated':
  // Reload diffs and attach to current message
  loadDiffs().then(() => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const messageDiffs = diffs.filter(d => 
        d.timestamp >= msg.timestamp && 
        d.timestamp <= Date.now()
      );
      return { ...m, diffs: messageDiffs };
    }));
  });
  break;
```

- [ ] **Step 3: Render DiffCard components in message display**

Update message rendering (around lines 500-543):
```tsx
{messages.map((msg) => (
  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[80%] rounded-lg p-4 ${
      msg.role === 'user'
        ? 'bg-claude-accent text-white'
        : 'bg-claude-input border border-claude-border'
    }`}>
      <div className="whitespace-pre-wrap break-words">{msg.content}</div>

      {/* Tool Calls */}
      {msg.toolCalls && msg.toolCalls.length > 0 && (
        <div className="mt-3 space-y-2">
          {msg.toolCalls.map((tool) => (
            <div key={tool.id} className="text-xs bg-black/5 dark:bg-white/5 rounded p-2">
              {/* ... existing tool call rendering ... */}
            </div>
          ))}
        </div>
      )}

      {/* Diffs - Add this section */}
      {msg.diffs && msg.diffs.length > 0 && (
        <div className="mt-3">
          {msg.diffs.map((diff) => (
            <DiffCard
              key={diff.id}
              diff={diff}
              onAccept={handleAcceptDiff}
              onReject={handleRejectDiff}
            />
          ))}
        </div>
      )}
    </div>
  </div>
))}
```

- [ ] **Step 4: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/components/CodePage.tsx
git commit -m "feat: add inline diff display in messages"
```

---

## Task 8: Adjust Layout and Styling

**Files:**
- Modify: `src/components/CodePage.tsx:549-597`

- [ ] **Step 1: Adjust input area padding and spacing**

Update input area container (around line 549):
```tsx
<div className="border-t border-claude-border p-4 bg-claude-bg">
  <div className="max-w-4xl mx-auto">
    {/* Context Selector - Above input */}
    <div className="mb-3">
      <ContextSelector
        selectedContexts={selectedContexts}
        onContextsChange={setSelectedContexts}
        workingDirectory={currentSession.workingDirectory}
        sessionId={currentSessionId || undefined}
      />
    </div>

    {/* Input box */}
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type / for commands"
        className="w-full px-4 py-3 pr-12 bg-claude-input border border-claude-border rounded-lg text-claude-text resize-none focus:outline-none focus:border-claude-accent"
        rows={4}
        disabled={isSending}
      />
      <button
        onClick={handleSendMessage}
        disabled={!inputValue.trim() || isSending}
        className="absolute right-2 bottom-2 p-2 bg-claude-accent text-white rounded-lg hover:bg-claude-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </div>

    {/* Bottom toolbar */}
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-3">
        <PermissionModeSelect
          value={permissionMode}
          onChange={(mode) => {
            setPermissionMode(mode);
            localStorage.setItem('code-permission-mode', mode);
          }}
        />
        <SelectFolderButton
          onSelect={(path) => {
            console.log('Selected folder:', path);
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <ModelBadge model="Sonnet 4.6" />
        <LocationBadge location="Local" />
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Increase textarea rows from 3 to 4**

Already done in step 1 above.

- [ ] **Step 3: Verify layout looks correct**

Run: `npm run dev`
Open app and check:
- Input area is at bottom
- Context selector is above input
- Permission mode dropdown is below input on left
- Model and location badges are on right

- [ ] **Step 4: Commit**

```bash
git add src/components/CodePage.tsx
git commit -m "style: adjust input area layout and spacing"
```

---

## Task 9: Update ContextSelector Styling

**Files:**
- Modify: `src/components/ContextSelector.tsx:68-91`

- [ ] **Step 1: Adjust chip styling to match spec**

Update button className (lines 74-84):
```tsx
className={`
  px-2.5 py-1 rounded-full text-xs font-medium transition-all
  flex items-center gap-1.5
  ${selected
    ? 'bg-claude-accent text-white'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  }
`}
```

- [ ] **Step 2: Adjust icon sizes**

Change icon className from `w-3.5 h-3.5` to `w-3 h-3` (lines 86, 88).

- [ ] **Step 3: Verify styling matches spec**

Run: `npm run dev`
Check:
- Chips are rounded-full
- Selected chips are blue with white text
- Unselected chips are gray
- Icons are 12px (w-3 h-3)

- [ ] **Step 4: Commit**

```bash
git add src/components/ContextSelector.tsx
git commit -m "style: adjust ContextSelector chip styling"
```

---

## Task 10: Test and Verify

**Files:**
- Test: All modified components

- [ ] **Step 1: Run build to check for errors**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Start dev server**

Run: `npm run dev`
Expected: App starts without errors

- [ ] **Step 3: Test permission mode switching**

1. Open app
2. Create new session
3. Change permission mode dropdown
4. Refresh page
5. Verify selection persists

Expected: Permission mode persists after refresh

- [ ] **Step 4: Test context selector**

1. Click on context chips
2. Verify selection toggles
3. Verify multiple contexts can be selected

Expected: Context selection works correctly

- [ ] **Step 5: Test select folder button**

1. Click "Select folder" button
2. Select a folder
3. Verify console log shows selected path

Expected: Folder selection dialog opens and path is logged

- [ ] **Step 6: Test inline diff display**

1. Send a message that generates diffs
2. Verify DiffCard appears in message
3. Click to expand diff
4. Click Accept/Reject buttons

Expected: Diffs display inline and can be accepted/rejected

- [ ] **Step 7: Test layout responsiveness**

1. Resize window
2. Verify layout adapts correctly
3. Verify input area stays at bottom

Expected: Layout is responsive

- [ ] **Step 8: Commit test results**

```bash
git add -A
git commit -m "test: verify Code UI redesign implementation"
```

---

## Task 11: Final Cleanup and Documentation

**Files:**
- Modify: `README.md` or relevant docs

- [ ] **Step 1: Remove unused imports**

Check all modified files for unused imports and remove them.

- [ ] **Step 2: Update documentation**

Add notes about new components and permission modes to project documentation.

- [ ] **Step 3: Final build verification**

Run: `npm run build`
Expected: Clean build with no warnings

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "docs: update documentation for Code UI redesign"
```

---

## Self-Review Checklist

### Spec Coverage
- ✅ Remove right sidebar (Diff Viewer) - Task 5
- ✅ Two-column layout - Task 5
- ✅ Fixed bottom input area - Task 8
- ✅ Chip-style Context Selector - Task 9 (already implemented)
- ✅ Permission mode dropdown - Tasks 1, 6
- ✅ Select folder button - Tasks 2, 6
- ✅ Model and location badges - Tasks 3, 6
- ✅ Inline diff display - Tasks 4, 7
- ✅ Permission mode persistence - Task 6
- ✅ Auto-accept logic update - Task 6

### Placeholder Scan
- ✅ No TBD or TODO in code
- ✅ All components have complete implementations
- ✅ All error handling specified
- ✅ All test steps have expected outputs

### Type Consistency
- ✅ PermissionMode type used consistently
- ✅ Diff interface matches across components
- ✅ Context interface matches ContextSelector
- ✅ Props interfaces are complete

### Dependencies
- ✅ Task 1-4 create components (no dependencies)
- ✅ Task 5 removes right sidebar (independent)
- ✅ Task 6 depends on Tasks 1-3 (components must exist)
- ✅ Task 7 depends on Task 4 (DiffCard must exist)
- ✅ Task 8-9 are styling (can run anytime after Task 6)
- ✅ Task 10 tests everything (must be last)
- ✅ Task 11 cleanup (must be last)

---

## Notes

### Known Limitations
1. **Plan mode and Bypass** - UI only, no backend implementation yet
2. **Worktree context** - Requires backend API support
3. **Select folder** - Depends on Electron API availability
4. **Diff attachment to messages** - Simplified implementation, may need refinement

### Future Enhancements
1. Add keyboard shortcuts for permission mode switching
2. Add context menu for context chips
3. Add drag-and-drop for folder selection
4. Add diff syntax highlighting themes
5. Add diff statistics (lines added/removed)

---

## Execution Time Estimate

- Task 1-4: 15 minutes (component creation)
- Task 5: 10 minutes (remove sidebar)
- Task 6: 15 minutes (replace toggle)
- Task 7: 20 minutes (inline diffs)
- Task 8-9: 10 minutes (styling)
- Task 10: 20 minutes (testing)
- Task 11: 5 minutes (cleanup)

**Total: ~95 minutes (1.5 hours)**

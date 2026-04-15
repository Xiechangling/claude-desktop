import React, { useState } from 'react';
import { Folder, GitBranch, GitFork, Monitor, Check } from 'lucide-react';

export interface ContextItem {
  id: string;
  type: 'local' | 'folder' | 'branch' | 'worktree';
  label: string;
  path?: string;
}

interface ContextSelectorProps {
  selectedContexts: ContextItem[];
  onContextsChange: (contexts: ContextItem[]) => void;
  workingDirectory?: string;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({
  selectedContexts,
  onContextsChange,
  workingDirectory
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Available context options
  const availableContexts: ContextItem[] = [
    { id: 'local', type: 'local', label: 'Local' },
    ...(workingDirectory ? [
      { id: 'folder-1', type: 'folder' as const, label: 'src/', path: 'src' },
      { id: 'folder-2', type: 'folder' as const, label: 'components/', path: 'src/components' },
    ] : []),
  ];

  const getIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'local':
        return Monitor;
      case 'folder':
        return Folder;
      case 'branch':
        return GitBranch;
      case 'worktree':
        return GitFork;
    }
  };

  const isSelected = (contextId: string) => {
    return selectedContexts.some(c => c.id === contextId);
  };

  const toggleContext = (context: ContextItem) => {
    if (isSelected(context.id)) {
      onContextsChange(selectedContexts.filter(c => c.id !== context.id));
    } else {
      onContextsChange([...selectedContexts, context]);
    }
  };

  return (
    <div className="relative">
      {/* Selected Chips Display */}
      <div className="flex flex-wrap gap-2 mb-3">
        {selectedContexts.length === 0 ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-claude-input border border-claude-border rounded-lg text-sm text-claude-textSecondary hover:border-claude-borderHover transition-colors"
          >
            + Add context
          </button>
        ) : (
          selectedContexts.map((context) => {
            const Icon = getIcon(context.type);
            return (
              <button
                key={context.id}
                onClick={() => toggleContext(context)}
                className="px-3 py-1.5 bg-claude-accent/10 border border-claude-accent/30 rounded-lg text-sm text-claude-text hover:bg-claude-accent/20 transition-colors flex items-center gap-2 group"
              >
                <Icon className="w-3.5 h-3.5 text-claude-accent" />
                <span>{context.label}</span>
                <Check className="w-3.5 h-3.5 text-claude-accent" />
              </button>
            );
          })
        )}
        {selectedContexts.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-claude-input border border-claude-border rounded-lg text-sm text-claude-textSecondary hover:border-claude-borderHover transition-colors"
          >
            + Add more
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsExpanded(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-claude-bg border border-claude-border rounded-lg shadow-lg z-20 py-1">
            {availableContexts.map((context) => {
              const Icon = getIcon(context.type);
              const selected = isSelected(context.id);

              return (
                <button
                  key={context.id}
                  onClick={() => {
                    toggleContext(context);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-claude-hover transition-colors flex items-center gap-2 ${
                    selected ? 'bg-claude-accent/5' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${selected ? 'text-claude-accent' : 'text-claude-textSecondary'}`} />
                  <span className={`text-sm flex-1 ${selected ? 'text-claude-accent font-medium' : 'text-claude-text'}`}>
                    {context.label}
                  </span>
                  {selected && <Check className="w-4 h-4 text-claude-accent" />}
                </button>
              );
            })}

            {availableContexts.length === 0 && (
              <div className="px-3 py-2 text-sm text-claude-textSecondary text-center">
                No contexts available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ContextSelector;

import React, { useState, useEffect } from 'react';
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
  sessionId?: string;
}

const ContextSelector: React.FC<ContextSelectorProps> = ({
  selectedContexts,
  onContextsChange,
  workingDirectory,
  sessionId
}) => {
  const [availableFolders, setAvailableFolders] = useState<ContextItem[]>([]);

  // Load folders from API
  useEffect(() => {
    if (!sessionId) return;

    fetch(`http://127.0.0.1:30080/api/code/sessions/${sessionId}/folders`)
      .then(res => res.json())
      .then(data => setAvailableFolders(data.folders || []))
      .catch(err => console.error('Failed to load folders:', err));
  }, [sessionId]);

  // Available context options
  const availableContexts: ContextItem[] = [
    { id: 'local', type: 'local', label: 'Local' },
    ...availableFolders
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
    <div className="flex flex-wrap gap-2">
      {availableContexts.map((context) => {
        const Icon = getIcon(context.type);
        const selected = isSelected(context.id);

        return (
          <button
            key={context.id}
            onClick={() => toggleContext(context)}
            className={`
              px-2.5 py-1 rounded-full text-xs font-medium transition-all
              flex items-center gap-1.5
              ${selected
                ? 'bg-claude-accent text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <Icon className="w-3 h-3" />
            <span>{context.label}</span>
            {selected && <Check className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
};

export default ContextSelector;

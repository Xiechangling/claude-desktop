import React, { useState, useEffect, useRef } from 'react';
import { Search, FileEdit, FilePlus, Code, Terminal, HelpCircle } from 'lucide-react';

export interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SlashCommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: SlashCommand) => void;
  position: { top: number; left: number };
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'edit',
    name: '/edit',
    description: 'Edit existing files',
    icon: FileEdit
  },
  {
    id: 'create',
    name: '/create',
    description: 'Create new files',
    icon: FilePlus
  },
  {
    id: 'search',
    name: '/search',
    description: 'Search in codebase',
    icon: Search
  },
  {
    id: 'refactor',
    name: '/refactor',
    description: 'Refactor code',
    icon: Code
  },
  {
    id: 'terminal',
    name: '/terminal',
    description: 'Run terminal commands',
    icon: Terminal
  },
  {
    id: 'help',
    name: '/help',
    description: 'Show help',
    icon: HelpCircle
  }
];

const SlashCommandPanel: React.FC<SlashCommandPanelProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
  position
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      setFilter('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelectCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelectCommand, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="fixed z-40 w-80 bg-claude-bg border border-claude-border rounded-lg shadow-xl"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        <div className="p-2 border-b border-claude-border">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter commands..."
            className="w-full px-3 py-2 bg-claude-input border border-claude-border rounded text-sm text-claude-text placeholder-claude-textSecondary focus:outline-none focus:border-claude-accent"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredCommands.length === 0 ? (
            <div className="px-3 py-2 text-sm text-claude-textSecondary text-center">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.id}
                  onClick={() => onSelectCommand(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-3 py-2 text-left transition-colors flex items-center gap-3 ${
                    index === selectedIndex
                      ? 'bg-claude-accent/10 border-l-2 border-claude-accent'
                      : 'hover:bg-claude-hover border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${index === selectedIndex ? 'text-claude-accent' : 'text-claude-textSecondary'}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${index === selectedIndex ? 'text-claude-accent' : 'text-claude-text'}`}>
                      {command.name}
                    </div>
                    <div className="text-xs text-claude-textSecondary">
                      {command.description}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="px-3 py-2 border-t border-claude-border text-xs text-claude-textSecondary">
          <div className="flex items-center justify-between">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlashCommandPanel;

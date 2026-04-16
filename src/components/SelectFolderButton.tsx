import React from 'react';
import { Folder } from 'lucide-react';

interface SelectFolderButtonProps {
  onSelect: (path: string) => void;
}

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

export default SelectFolderButton;

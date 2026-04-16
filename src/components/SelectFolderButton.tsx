import React, { useState } from 'react';
import { Folder } from 'lucide-react';

interface SelectFolderButtonProps {
  onSelect: (path: string) => void;
  disabled?: boolean;
}

const SelectFolderButton: React.FC<SelectFolderButtonProps> = ({ onSelect, disabled }) => {
  const [isSelecting, setIsSelecting] = useState(false);

  const handleClick = async () => {
    if (!window.electronAPI) {
      console.warn('electronAPI not available - folder selection requires Electron environment');
      return;
    }

    setIsSelecting(true);
    try {
      const result = await window.electronAPI.selectDirectory();
      if (result) {
        onSelect(result);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
      // TODO: Show user-facing error notification
    } finally {
      setIsSelecting(false);
    }
  };

  const isDisabled = disabled || isSelecting;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Select folder"
      aria-busy={isSelecting}
      className="flex items-center gap-1.5 text-xs text-claude-textSecondary hover:text-claude-text transition-colors focus:outline-none focus:ring-2 focus:ring-claude-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Folder className="w-3 h-3" />
      <span>{isSelecting ? 'Selecting...' : 'Select folder'}</span>
    </button>
  );
};

export default SelectFolderButton;

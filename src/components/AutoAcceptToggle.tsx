import React from 'react';

interface AutoAcceptToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const AutoAcceptToggle: React.FC<AutoAcceptToggleProps> = ({ enabled, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <span className="text-xs text-claude-textSecondary group-hover:text-claude-text transition-colors">
        Auto accept edits
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-2 border-claude-border bg-claude-input cursor-pointer
                   checked:bg-[#4a9eff] checked:border-[#4a9eff]
                   hover:border-claude-borderHover transition-colors
                   focus:outline-none focus:ring-2 focus:ring-[#4a9eff]/20"
      />
    </label>
  );
};

export default AutoAcceptToggle;

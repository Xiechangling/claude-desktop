import React from 'react';

export type PermissionMode = 'ask' | 'auto' | 'plan' | 'bypass';

interface PermissionModeSelectProps {
  value: PermissionMode;
  onChange: (mode: PermissionMode) => void;
}

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

export default PermissionModeSelect;

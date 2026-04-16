import React from 'react';

export type PermissionMode = 'ask' | 'auto' | 'plan' | 'bypass';

interface PermissionModeSelectProps {
  value: PermissionMode;
  onChange: (mode: PermissionMode) => void;
  disabled?: boolean;
  'aria-label'?: string;
}

const isValidPermissionMode = (value: string): value is PermissionMode => {
  return ['ask', 'auto', 'plan', 'bypass'].includes(value);
};

const PermissionModeSelect: React.FC<PermissionModeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  'aria-label': ariaLabel = 'Permission mode'
}) => {
  return (
    <select
      value={value}
      onChange={(e) => {
        const newValue = e.target.value;
        if (isValidPermissionMode(newValue)) {
          onChange(newValue);
        }
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`text-xs border border-claude-border rounded px-2 py-1 bg-claude-input text-claude-text transition-colors focus:outline-none focus:border-claude-accent focus:ring-2 focus:ring-claude-accent focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-claude-borderHover'
      }`}
    >
      <option value="ask">Ask permissions</option>
      <option value="auto">Auto accept edits</option>
      <option value="plan">Plan mode</option>
      <option value="bypass">Bypass</option>
    </select>
  );
};

export default PermissionModeSelect;

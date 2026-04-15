import React from 'react';
import { Check } from 'lucide-react';

interface AutoAcceptToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const AutoAcceptToggle: React.FC<AutoAcceptToggleProps> = ({ enabled, onChange }) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
        enabled
          ? 'bg-claude-accent text-white'
          : 'bg-claude-input border border-claude-border text-claude-textSecondary hover:border-claude-borderHover'
      }`}
      title={enabled ? 'Auto-accept edits enabled' : 'Auto-accept edits disabled'}
    >
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
        enabled
          ? 'bg-white border-white'
          : 'bg-transparent border-claude-border'
      }`}>
        {enabled && <Check className="w-3 h-3 text-claude-accent" />}
      </div>
      <span className="font-medium">Auto Accept Edits</span>
    </button>
  );
};

export default AutoAcceptToggle;

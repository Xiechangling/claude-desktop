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

import React from 'react';

interface LocationBadgeProps {
  location: string;
}

const LocationBadge: React.FC<LocationBadgeProps> = ({ location }) => {
  return (
    <span className="text-xs text-claude-textSecondary">
      {location}
    </span>
  );
};

export default LocationBadge;

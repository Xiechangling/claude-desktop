import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, Check, XCircle } from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';

interface Diff {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface DiffCardProps {
  diff: Diff;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const DiffCard: React.FC<DiffCardProps> = ({ diff, onAccept, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-claude-border rounded-lg p-3 my-2 bg-claude-input">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-claude-textSecondary" />
          <span className="text-sm font-medium text-claude-text">{diff.filePath}</span>
          {diff.status === 'accepted' && (
            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              Accepted
            </span>
          )}
          {diff.status === 'rejected' && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Rejected
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-claude-hover rounded transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="text-xs overflow-auto">
            <ReactDiffViewer
              oldValue={diff.oldContent}
              newValue={diff.newContent}
              splitView={false}
              useDarkTheme={document.documentElement.classList.contains('dark')}
              hideLineNumbers={false}
              showDiffOnly={false}
            />
          </div>
          {diff.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onAccept(diff.id)}
                className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => onReject(diff.id)}
                className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiffCard;

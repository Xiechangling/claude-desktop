import React from 'react';

const CoworkPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full bg-claude-bg">
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🤝</div>
        <h1 className="text-2xl font-semibold text-claude-text">Cowork Mode</h1>
        <p className="text-claude-textSecondary max-w-md">
          Coming Soon - Collaborate on files and folders with AI assistance for non-technical tasks.
        </p>
        <div className="mt-6 text-sm text-claude-textSecondary">
          <div className="space-y-2">
            <div>📁 Select a folder to work with</div>
            <div>📋 AI-powered task planning</div>
            <div>🔍 File browsing and editing</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoworkPage;

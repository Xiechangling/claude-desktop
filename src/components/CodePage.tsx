import React from 'react';

const CodePage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full bg-claude-bg">
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">💻</div>
        <h1 className="text-2xl font-semibold text-claude-text">Code Mode</h1>
        <p className="text-claude-textSecondary max-w-md">
          Coming Soon - A powerful coding assistant with Local, Remote, and SSH environments.
        </p>
        <div className="mt-6 text-sm text-claude-textSecondary">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Local Environment</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>Remote Environment (Coming Soon)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              <span>SSH Environment (Coming Soon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePage;

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-claude-bg flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-claude-input border border-claude-border rounded-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-claude-text">
                  Something went wrong
                </h1>
                <p className="text-claude-textSecondary mt-1">
                  The application encountered an unexpected error
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6">
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Error Details:
                  </p>
                  <p className="text-sm text-claude-text font-mono">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-3">
                      <summary className="text-sm text-claude-textSecondary cursor-pointer hover:text-claude-text">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-claude-textSecondary overflow-auto max-h-48 p-2 bg-black/5 dark:bg-white/5 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-claude-accent text-white rounded-lg hover:bg-claude-accentHover transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-claude-input border border-claude-border text-claude-text rounded-lg hover:bg-claude-hover transition-colors"
              >
                Try Again
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-claude-textSecondary">
                If this problem persists, try:
              </p>
              <ul className="mt-2 text-sm text-claude-textSecondary space-y-1 list-disc list-inside">
                <li>Clearing your browser cache</li>
                <li>Restarting the application</li>
                <li>Checking the console for more details</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

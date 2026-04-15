import React, { useState, useEffect, useRef } from 'react';
import { Folder, Clock, Send, Loader2, ChevronDown, ChevronUp, FileText, FolderOpen } from 'lucide-react';

interface CoworkFolder {
  id: string;
  path: string;
  fileCount: number;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  id: string;
  name: string;
  input: any;
  result?: any;
  status: 'pending' | 'success' | 'error';
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

const CoworkPage: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<CoworkFolder | null>(null);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load tasks and files when folder changes
  useEffect(() => {
    if (currentFolderId) {
      loadTasks();
      loadFiles();
    }
  }, [currentFolderId]);

  const handleSelectFolder = async () => {
    if (isSelectingFolder) return;

    setIsSelectingFolder(true);
    try {
      const directory = await window.electronAPI?.selectDirectory();
      if (!directory) {
        setIsSelectingFolder(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:30080/api/cowork/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: directory })
      });

      if (!response.ok) {
        throw new Error('Failed to create folder session');
      }

      const data = await response.json();
      setCurrentFolderId(data.folderId);
      setCurrentFolder(data);
      setMessages([]);
      setTasks([]);
    } catch (err) {
      console.error('Failed to select folder:', err);
      alert('Failed to select folder: ' + (err as Error).message);
    } finally {
      setIsSelectingFolder(false);
    }
  };

  const loadTasks = async () => {
    if (!currentFolderId) return;

    try {
      const response = await fetch(`http://127.0.0.1:30080/api/cowork/folders/${currentFolderId}/tasks`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const loadFiles = async () => {
    if (!currentFolderId) return;

    try {
      const response = await fetch(`http://127.0.0.1:30080/api/cowork/folders/${currentFolderId}/files`);
      const data = await response.json();
      setFileTree(data.files || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentFolderId || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: []
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(`http://127.0.0.1:30080/api/cowork/folders/${currentFolderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            setIsSending(false);
            loadTasks(); // Refresh tasks after message completes
            loadFiles(); // Refresh files after message completes
            continue;
          }

          try {
            const event = JSON.parse(data);
            handleStreamEvent(event, assistantMessage.id);
          } catch (err) {
            console.error('Failed to parse SSE event:', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: 'Error: ' + (err as Error).message }
          : m
      ));
    } finally {
      setIsSending(false);
    }
  };

  const handleStreamEvent = (event: any, messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      switch (event.type) {
        case 'content_block_delta':
          if (event.delta?.type === 'text_delta') {
            return { ...msg, content: msg.content + event.delta.text };
          }
          break;

        case 'tool_use':
          const newToolCall: ToolCall = {
            id: event.tool_use_id || Date.now().toString(),
            name: event.name,
            input: event.input,
            status: 'pending'
          };
          return { ...msg, toolCalls: [...(msg.toolCalls || []), newToolCall] };

        case 'tool_result':
          return {
            ...msg,
            toolCalls: (msg.toolCalls || []).map(tc =>
              tc.id === event.tool_use_id
                ? { ...tc, result: event.result, status: event.is_error ? 'error' : 'success' }
                : tc
            )
          };

        case 'error':
          return { ...msg, content: msg.content + '\n\nError: ' + event.error };
      }

      return msg;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className="flex items-center gap-2 px-2 py-1 hover:bg-claude-hover rounded cursor-pointer text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => node.type === 'directory' && toggleFolder(node.path)}
        >
          {node.type === 'directory' ? (
            <>
              {expandedFolders.has(node.path) ? (
                <ChevronDown className="w-3 h-3 text-claude-textSecondary flex-shrink-0" />
              ) : (
                <ChevronUp className="w-3 h-3 text-claude-textSecondary flex-shrink-0" />
              )}
              <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            </>
          ) : (
            <>
              <div className="w-3" />
              <FileText className="w-4 h-4 text-claude-textSecondary flex-shrink-0" />
            </>
          )}
          <span className="text-claude-text truncate">{node.name}</span>
        </div>
        {node.type === 'directory' && node.children && expandedFolders.has(node.path) && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const getTaskIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
    }
  };

  return (
    <div className="flex h-full bg-claude-bg">
      {/* Left Sidebar - 350px */}
      <div className="w-[350px] border-r border-claude-border flex flex-col bg-claude-bg">
        {/* Folder Selection */}
        <div className="p-4 border-b border-claude-border">
          <button
            onClick={handleSelectFolder}
            disabled={isSelectingFolder}
            className="w-full px-4 py-2 bg-claude-accent text-white rounded-lg hover:bg-claude-accentHover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSelectingFolder ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Selecting...
              </>
            ) : (
              <>
                <Folder className="w-4 h-4" />
                Select Folder
              </>
            )}
          </button>

          {currentFolder && (
            <div className="mt-3 p-3 bg-claude-input rounded-lg border border-claude-border">
              <div className="flex items-center gap-2 mb-1">
                <Folder className="w-4 h-4 text-claude-textSecondary" />
                <span className="text-sm font-medium text-claude-text truncate">
                  {currentFolder.path.split(/[/\\]/).pop()}
                </span>
              </div>
              <div className="text-xs text-claude-textSecondary truncate">
                {currentFolder.path}
              </div>
              <div className="text-xs text-claude-textSecondary mt-1">
                {currentFolder.fileCount} files
              </div>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-claude-text mb-3">Tasks</h3>
            {tasks.length === 0 ? (
              <div className="text-center text-claude-textSecondary text-sm py-4">
                {currentFolder ? 'No tasks yet. Start a conversation to create tasks.' : 'Select a folder to see tasks.'}
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-claude-input rounded-lg border border-claude-border hover:border-claude-borderHover transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{getTaskIcon(task.status)}</span>
                      <span className="text-sm text-claude-text flex-1">{task.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Chat + File Browser */}
      <div className="flex-1 flex flex-col">
        {currentFolder ? (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-claude-textSecondary py-8">
                    Start a conversation to work with your files...
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-claude-accent text-white'
                          : 'bg-claude-input border border-claude-border'
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                        {/* Tool Calls */}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {msg.toolCalls.map((tool) => (
                              <div key={tool.id} className="text-xs bg-black/5 dark:bg-white/5 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`w-2 h-2 rounded-full ${
                                    tool.status === 'success' ? 'bg-green-500' :
                                    tool.status === 'error' ? 'bg-red-500' :
                                    'bg-yellow-500'
                                  }`} />
                                  <span className="font-medium">{tool.name}</span>
                                </div>
                                {tool.input && (
                                  <div className="text-claude-textSecondary mt-1">
                                    {typeof tool.input === 'string'
                                      ? tool.input.slice(0, 100)
                                      : JSON.stringify(tool.input).slice(0, 100)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* File Browser (Collapsible) */}
            {isFileTreeOpen && fileTree.length > 0 && (
              <div className="border-t border-claude-border bg-claude-bg">
                <div className="px-4 py-2 flex items-center justify-between border-b border-claude-border">
                  <h3 className="text-sm font-medium text-claude-text">Files</h3>
                  <button
                    onClick={() => setIsFileTreeOpen(false)}
                    className="text-xs text-claude-textSecondary hover:text-claude-text transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <div className="max-h-[200px] overflow-y-auto p-2">
                  {renderFileTree(fileTree)}
                </div>
              </div>
            )}

            {/* Show File Browser Button */}
            {!isFileTreeOpen && fileTree.length > 0 && (
              <div className="border-t border-claude-border p-2 text-center">
                <button
                  onClick={() => setIsFileTreeOpen(true)}
                  className="text-xs text-claude-textSecondary hover:text-claude-text transition-colors"
                >
                  Show Files
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-claude-border p-4">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message..."
                    className="w-full px-4 py-3 pr-12 bg-claude-input border border-claude-border rounded-lg text-claude-text resize-none focus:outline-none focus:border-claude-accent"
                    rows={3}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isSending}
                    className="absolute right-2 bottom-2 p-2 bg-claude-accent text-white rounded-lg hover:bg-claude-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-xl font-semibold text-claude-text">Cowork Mode</h2>
              <p className="text-claude-textSecondary max-w-md">
                Select a folder to start collaborating with AI on your files.
              </p>
              <div className="mt-6 text-sm text-claude-textSecondary">
                <div className="space-y-2">
                  <div>📁 Work within a specific folder</div>
                  <div>📋 AI-powered task planning</div>
                  <div>🔍 File browsing and editing</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoworkPage;

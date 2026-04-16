import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, Folder, Clock, X, ChevronRight, ChevronLeft, Send, Loader2, FileText, Check, XCircle } from 'lucide-react';
import { useToast } from './Toast';
import ContextSelector, { ContextItem } from './ContextSelector';
import PermissionModeSelect, { PermissionMode } from './PermissionModeSelect';
import DiffCard from './DiffCard';
import SelectFolderButton from './SelectFolderButton';
import ModelBadge from './ModelBadge';
import LocationBadge from './LocationBadge';

interface CodeSession {
  id: string;
  type: string;
  workingDirectory: string;
  status: string;
  createdAt: string;
  lastActiveAt: string;
  processStatus?: {
    pid: number;
    running: boolean;
    restartCount: number;
    uptime: number;
  } | null;
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

interface Diff {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  status: 'pending' | 'accepted' | 'rejected';
  toolName: string;
  timestamp: number;
}

const CodePage: React.FC = () => {
  const toast = useToast();
  const [environment, setEnvironment] = useState<'local' | 'remote' | 'ssh'>('local');
  const [sessions, setSessions] = useState<CodeSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [diffs, setDiffs] = useState<Diff[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // New state for redesigned features
  const [selectedContexts, setSelectedContexts] = useState<ContextItem[]>([
    { id: 'local', type: 'local', label: 'Local' }
  ]);
  const [permissionMode, setPermissionMode] = useState<PermissionMode>(() => {
    const saved = localStorage.getItem('permissionMode');
    return (saved as PermissionMode) || 'ask';
  });

  useEffect(() => {
    localStorage.setItem('permissionMode', permissionMode);
  }, [permissionMode]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear messages when session changes
  useEffect(() => {
    setMessages([]);
    setDiffs([]);
    if (currentSessionId) {
      loadDiffs();
    }
  }, [currentSessionId]);

  const loadDiffs = async () => {
    if (!currentSessionId) return;
    try {
      const response = await fetch(`http://127.0.0.1:30080/api/code/sessions/${currentSessionId}/diffs`);
      const data = await response.json();
      setDiffs(data.diffs || []);
    } catch (err) {
      console.error('Failed to load diffs:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:30080/api/code/sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      toast.error('Failed to load sessions');
    }
  };

  const handleNewSession = async () => {
    if (isCreatingSession) return;

    setIsCreatingSession(true);
    try {
      // Use Electron IPC to open directory picker
      const directory = await window.electronAPI?.selectDirectory();
      if (!directory) {
        setIsCreatingSession(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:30080/api/code/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'local',
          workingDirectory: directory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const newSession = await response.json();
      await loadSessions();
      setCurrentSessionId(newSession.sessionId);
      toast.success('Session created successfully');
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Failed to create session: ' + (err as Error).message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;

    try {
      await fetch(`http://127.0.0.1:30080/api/code/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      await loadSessions();
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      toast.success('Session deleted');
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Failed to delete session');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSessionId || isSending) return;

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
      const response = await fetch(`http://127.0.0.1:30080/api/code/sessions/${currentSessionId}/messages`, {
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

        case 'diff_generated':
          // Reload diffs when a new diff is generated
          loadDiffs();
          break;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Auto-accept diffs when enabled (sequential processing to avoid race conditions)
  const processingDiffRef = useRef(false);

  useEffect(() => {
    if (permissionMode !== 'auto' || processingDiffRef.current) return;

    const pendingDiffs = diffs.filter(d => d.status === 'pending');
    if (pendingDiffs.length === 0) return;

    // Process first pending diff
    processingDiffRef.current = true;
    handleAcceptDiff(pendingDiffs[0].id).finally(() => {
      processingDiffRef.current = false;
    });
  }, [diffs, permissionMode]);

  const handleAcceptDiff = async (diffId: string) => {
    if (!currentSessionId) return;
    try {
      const response = await fetch(`http://127.0.0.1:30080/api/code/sessions/${currentSessionId}/diffs/${diffId}/accept`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to accept diff');
      }
      await loadDiffs();
      toast.success('Changes applied successfully');
    } catch (err) {
      console.error('Failed to accept diff:', err);
      toast.error('Failed to apply changes: ' + (err as Error).message);
    }
  };

  const handleRejectDiff = async (diffId: string) => {
    if (!currentSessionId) return;
    try {
      const response = await fetch(`http://127.0.0.1:30080/api/code/sessions/${currentSessionId}/diffs/${diffId}/reject`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to reject diff');
      }
      await loadDiffs();
      toast.info('Changes discarded');
    } catch (err) {
      console.error('Failed to reject diff:', err);
      toast.error('Failed to reject changes: ' + (err as Error).message);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-full bg-claude-bg">
      {/* Left Sidebar - 300px */}
      <div className="w-[300px] border-r border-claude-border flex flex-col bg-claude-bg">
        {/* Environment Selector */}
        <div className="p-4 border-b border-claude-border">
          <label className="block text-xs font-medium text-claude-textSecondary mb-2">
            Environment
          </label>
          <div className="relative">
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full px-3 py-2 bg-claude-input border border-claude-border rounded-lg text-claude-text appearance-none cursor-pointer hover:border-claude-borderHover transition-colors"
              disabled={environment !== 'local'}
            >
              <option value="local">Local</option>
              <option value="remote" disabled>Remote (Coming Soon)</option>
              <option value="ssh" disabled>SSH (Coming Soon)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-claude-textSecondary pointer-events-none" />
          </div>
        </div>

        {/* New Session Button */}
        <div className="p-4 border-b border-claude-border">
          <button
            onClick={handleNewSession}
            disabled={isCreatingSession}
            className="w-full px-4 py-2 bg-claude-accent text-white rounded-lg hover:bg-claude-accentHover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingSession ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                New Session
              </>
            )}
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-claude-textSecondary text-sm">
              No sessions yet. Click "New Session" to start.
            </div>
          ) : (
            <div className="p-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setCurrentSessionId(session.id)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-claude-accent/10 border border-claude-accent'
                      : 'hover:bg-claude-hover border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Folder className="w-4 h-4 text-claude-textSecondary flex-shrink-0" />
                        <span className="text-sm font-medium text-claude-text truncate">
                          {session.workingDirectory.split(/[/\\]/).pop() || 'Project'}
                        </span>
                      </div>
                      <div className="text-xs text-claude-textSecondary truncate mb-1">
                        {session.workingDirectory}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-claude-textSecondary">
                        <Clock className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleString()}
                      </div>
                      {session.processStatus && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${session.processStatus.running ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-claude-textSecondary">
                            {session.processStatus.running ? 'Running' : 'Stopped'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="p-1 hover:bg-claude-hover rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-claude-textSecondary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header - Only show when session is selected */}
        {currentSession && (
          <div className="px-6 py-4 border-b border-claude-border">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-claude-textSecondary" />
              <div>
                <div className="text-sm font-medium text-claude-text">
                  {currentSession.workingDirectory.split(/[/\\]/).pop()}
                </div>
                <div className="text-xs text-claude-textSecondary">
                  {currentSession.workingDirectory}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-claude-textSecondary py-8">
                {currentSession
                  ? 'Start a conversation with your code assistant...'
                  : 'Select a session or create a new one to start coding'}
              </div>
            ) : (
              messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex-1 max-w-[80%]">
                        <div className={`rounded-lg p-4 ${
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
                                  {tool.result && (
                                    <div className="text-claude-textSecondary mt-1 text-[10px]">
                                      Result: {typeof tool.result === 'string'
                                        ? tool.result.slice(0, 50)
                                        : JSON.stringify(tool.result).slice(0, 50)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Inline Diffs */}
                        {msg.role === 'assistant' && (
                          <div className="mt-2">
                            {diffs
                              .filter(diff => Math.abs(diff.timestamp - msg.timestamp) < 5000)
                              .map(diff => (
                                <DiffCard
                                  key={diff.id}
                                  diff={diff}
                                  onAccept={handleAcceptDiff}
                                  onReject={handleRejectDiff}
                                />
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

        {/* Input Area - Always visible */}
        <div className="border-t border-claude-border p-4 bg-claude-bg">
          <div className="max-w-4xl mx-auto">
            {/* Context Selector - Above input */}
            {currentSession && (
              <div className="mb-3">
                <ContextSelector
                  selectedContexts={selectedContexts}
                  onContextsChange={setSelectedContexts}
                  workingDirectory={currentSession.workingDirectory}
                  sessionId={currentSessionId || undefined}
                />
              </div>
            )}

            {/* Input box */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-12 bg-claude-input border border-claude-border rounded-lg text-claude-text resize-none focus:outline-none focus:border-claude-accent"
                rows={4}
                disabled={isSending || !currentSession}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending || !currentSession}
                className="absolute right-2 bottom-2 p-2 bg-claude-accent text-white rounded-lg hover:bg-claude-accentHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <PermissionModeSelect
                  value={permissionMode}
                  onChange={setPermissionMode}
                />
                <SelectFolderButton
                  onSelect={(path) => {
                    console.log('Selected folder:', path);
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <ModelBadge model="Sonnet 4.6" />
                <LocationBadge location="Local" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePage;

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Save, Plus, Trash2, LogOut, Terminal, 
  History, Search, Check, AlertCircle, Copy, 
  FileText, Sparkles, RefreshCw, Layers
} from 'lucide-react';

const API_BASE = '/api';

interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  route: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionLog {
  id: string;
  snippetId: string;
  input: any;
  output: any;
  stdout: string;
  statusCode: number;
  executionTimeMs: number;
  createdAt: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('snabit_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('snabit_user') || 'null'));
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Auth Form Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');

  // App Dashboard States
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Snippet Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [route, setRoute] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Logs & Playground
  const [activeTab, setActiveTab] = useState<'playground' | 'logs'>('playground');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [playgroundInput, setPlaygroundInput] = useState('{\n  "name": "Developer"\n}');
  const [playgroundOutput, setPlaygroundOutput] = useState<any>(null);
  const [playgroundLogs, setPlaygroundLogs] = useState<string>('');
  const [playgroundStatus, setPlaygroundStatus] = useState<number | null>(null);
  const [playgroundTime, setPlaygroundTime] = useState<number | null>(null);

  // Status/Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Textarea Ref for custom editing behaviors
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch snippets on token load
  useEffect(() => {
    if (token) {
      fetchSnippets();
    }
  }, [token]);

  // Fetch logs when active snippet changes or tab switches
  useEffect(() => {
    if (selectedId && activeTab === 'logs') {
      fetchLogs(selectedId);
    }
  }, [selectedId, activeTab]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    localStorage.removeItem('snabit_token');
    localStorage.removeItem('snabit_user');
    setToken(null);
    setUser(null);
    setSnippets([]);
    setSelectedId(null);
    showToast('Logged out successfully');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      const endpoint = isLoginView ? '/auth/login' : '/auth/signup';
      const body = isLoginView ? { email, password } : { email, password, name };
      
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('snabit_token', data.token);
      localStorage.setItem('snabit_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast(isLoginView ? `Welcome back, ${data.user.name}!` : 'Account created successfully!');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSnippets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/snippets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setSnippets(data);
        if (data.length > 0 && !selectedId) {
          selectSnippet(data[0]);
        }
      }
    } catch (err) {
      showToast('Error loading snippets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async (snippetId: string) => {
    try {
      const res = await fetch(`${API_BASE}/logs/${snippetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs', err);
    }
  };

  const selectSnippet = (snippet: Snippet) => {
    setSelectedId(snippet.id);
    setTitle(snippet.title);
    setDescription(snippet.description || '');
    setRoute(snippet.route);
    setCode(snippet.code);
    setIsActive(snippet.isActive);
    setIsCreating(false);
    setPlaygroundOutput(null);
    setPlaygroundLogs('');
    setPlaygroundStatus(null);
    setPlaygroundTime(null);
  };

  const initNewSnippet = () => {
    setIsCreating(true);
    setSelectedId(null);
    setTitle('My New Snabit');
    setDescription('Performs a serverless action');
    setRoute('/hello-snabit');
    setCode(`// Welcome to Snabit! Write your serverless endpoint here.
// You can use 'req.body', 'req.query', 'req.headers'.
// Write return values or use 'res.json()', 'res.send()'.
// console.log() output will be recorded in execution logs.

module.exports = async (req, res) => {
  const { name } = req.body;
  console.log("Received greeting request for:", name || "stranger");
  
  return {
    message: \`Hello \${name || 'there'}! Welcome to Snabit!\`,
    timestamp: new Date()
  };
};`);
    setIsActive(true);
    setPlaygroundOutput(null);
    setPlaygroundLogs('');
  };

  const handleSave = async () => {
    if (!title || !route || !code) {
      showToast('Title, route, and code are required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const url = isCreating ? `${API_BASE}/snippets` : `${API_BASE}/snippets/${selectedId}`;
      const method = isCreating ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, code, route, isActive })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      showToast(isCreating ? 'Snippet created successfully' : 'Changes saved successfully');
      
      await fetchSnippets();
      if (isCreating) {
        selectSnippet(data);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this snippet? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/snippets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete');
      }

      showToast('Snippet deleted');
      setSelectedId(null);
      await fetchSnippets();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/snippets/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIsActive(data.isActive);
        setSnippets(snippets.map(s => s.id === id ? { ...s, isActive: data.isActive } : s));
        showToast(data.isActive ? 'Endpoint activated' : 'Endpoint deactivated');
      }
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleRunTest = async () => {
    if (!route) return;
    setIsExecuting(true);
    setPlaygroundOutput(null);
    setPlaygroundLogs('');
    setPlaygroundStatus(null);
    setPlaygroundTime(null);

    const startHr = performance.now();

    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(playgroundInput);
      } catch (e) {
        showToast('Invalid JSON input body', 'error');
        setIsExecuting(false);
        return;
      }

      // Execute snippet using proxy /run path
      const res = await fetch(`/run${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody)
      });

      const endHr = performance.now();
      setPlaygroundTime(Math.round(endHr - startHr));
      setPlaygroundStatus(res.status);

      const data = await res.json();
      setPlaygroundOutput(data);
      
      // Pull logs immediately to show output details
      if (selectedId) {
        fetchLogs(selectedId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
      setPlaygroundOutput({ error: err.message });
      setPlaygroundStatus(500);
    } finally {
      setIsExecuting(false);
    }
  };

  // Support tab key indentation in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = textareaRef.current;
      if (!target) return;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      // Reset selection range
      setTimeout(() => {
        if (target) {
          target.selectionStart = target.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const copyEndpointUrl = () => {
    const fullUrl = `${window.location.origin}/run${route}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('Endpoint URL copied to clipboard!');
  };

  const filteredSnippets = snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLineCount = () => {
    return code.split('\n').length;
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">Snabit</h1>
            <p className="auth-subtitle">
              {isLoginView ? 'Sign in to deploy instantly' : 'Create an account to start deploying'}
            </p>
          </div>

          <form onSubmit={handleAuth}>
            {authError && (
              <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {!isLoginView && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="John Doe" 
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="john@example.com" 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="animate-spin" size={18} />
              ) : isLoginView ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
            </span>
            <span className="auth-link" onClick={() => setIsLoginView(!isLoginView)}>
              {isLoginView ? 'Create Account' : 'Sign In'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Toast Notification */}
      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
          {toast.type === 'success' ? <Check size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--danger)" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <Layers size={24} color="#8b5cf6" />
          <span>Snabit</span>
        </div>
        <div className="header-user-info">
          <span className="user-badge">{user?.name} ({user?.email})</span>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-content">
        
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title-row">
              <span className="sidebar-title">My Snippets</span>
              <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }} onClick={initNewSnippet}>
                <Plus size={14} /> New
              </button>
            </div>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search endpoints..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="snippet-list">
            {filteredSnippets.length === 0 ? (
              <div className="no-data" style={{ padding: '30px 10px' }}>
                <span className="no-data-icon"><FileText size={32} /></span>
                <p style={{ fontSize: '0.85rem' }}>No snippets found</p>
              </div>
            ) : (
              filteredSnippets.map((snippet) => (
                <div 
                  key={snippet.id} 
                  className={`snippet-item ${selectedId === snippet.id ? 'active-item' : ''}`}
                  onClick={() => selectSnippet(snippet)}
                >
                  <div className="snippet-item-header">
                    <span className="snippet-item-title">{snippet.title}</span>
                    <span className={`status-indicator ${snippet.isActive ? 'status-active' : 'status-inactive'}`} />
                  </div>
                  <div className="snippet-item-route">/run{snippet.route}</div>
                  {snippet.description && <div className="snippet-item-desc">{snippet.description}</div>}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Editor Area (Center) */}
        <main className="editor-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Sparkles size={16} color="var(--primary)" />
              <span>{isCreating ? 'Create Snabit API' : 'Editor'}</span>
            </div>
            <div className="panel-actions">
              {!isCreating && selectedId && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', borderColor: isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(107, 114, 128, 0.4)' }}
                    onClick={() => handleToggleActive(selectedId)}
                  >
                    {isActive ? 'Active' : 'Deactivated'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger-hover)' }} 
                    onClick={() => handleDelete(selectedId)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
              <button 
                className="btn btn-primary" 
                style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }} 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save size={14} /> {isSaving ? 'Saving...' : 'Deploy'}
              </button>
            </div>
          </div>

          {/* Snippet Meta Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255, 255, 255, 0.01)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Snippet Title</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Math Calculation API"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Deployment Route</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '8px 12px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                value={route} 
                onChange={(e) => setRoute(e.target.value)} 
                placeholder="/calculate-api"
              />
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Description</label>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Enter description of what this microservice does..."
              />
            </div>
          </div>

          {/* Editor Sandbox Code */}
          <div className="editor-container">
            <div className="line-numbers">
              {Array.from({ length: getLineCount() }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              className="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="// Write javascript logic here"
              spellCheck={false}
            />
          </div>
        </main>

        {/* Playground / Logs (Right) */}
        <aside className="playground-panel">
          <nav className="tab-nav">
            <button 
              className={`tab-btn ${activeTab === 'playground' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('playground')}
            >
              <Play size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Playground
            </button>
            <button 
              className={`tab-btn ${activeTab === 'logs' ? 'active-tab' : ''}`}
              onClick={() => setActiveTab('logs')}
              disabled={isCreating || !selectedId}
            >
              <History size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Logs History
            </button>
          </nav>

          <div className="tab-content">
            {activeTab === 'playground' ? (
              <div className="playground-container">
                <div className="endpoint-banner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="section-label" style={{ margin: 0 }}>API Endpoint URL</span>
                    {!isCreating && route && (
                      <button 
                        onClick={copyEndpointUrl}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        title="Copy URL"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                  <div className="endpoint-url">
                    {isCreating ? 'Deploy first to get a URL' : `${window.location.origin}/run${route}`}
                  </div>
                </div>

                <div>
                  <span className="section-label">JSON Request Body (POST)</span>
                  <textarea 
                    className="payload-textarea"
                    value={playgroundInput}
                    onChange={(e) => setPlaygroundInput(e.target.value)}
                  />
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={handleRunTest}
                  disabled={isExecuting || isCreating || !isActive}
                >
                  {isExecuting ? 'Running...' : 'Execute Request'}
                </button>

                {playgroundStatus !== null && (
                  <div className="execution-status-row">
                    <span>Status: <strong style={{ color: playgroundStatus < 400 ? 'var(--success)' : 'var(--danger)' }}>{playgroundStatus}</strong></span>
                    <span>Time: <strong>{playgroundTime} ms</strong></span>
                  </div>
                )}

                {playgroundOutput && (
                  <div className="response-card">
                    <div className="response-header">
                      <span className="section-label" style={{ margin: 0 }}>Response Body</span>
                    </div>
                    <div className="response-body">
                      {JSON.stringify(playgroundOutput, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="logs-container">
                {logs.length === 0 ? (
                  <div className="no-data">
                    <Terminal size={32} />
                    <p style={{ fontSize: '0.85rem' }}>No execution logs recorded yet</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="log-row">
                      <div className="log-meta">
                        <span className={`log-badge ${log.statusCode < 400 ? 'badge-success' : 'badge-danger'}`}>
                          HTTP {log.statusCode}
                        </span>
                        <span>{log.executionTimeMs} ms</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      {log.stdout && (
                        <div>
                          <div className="section-label" style={{ fontSize: '0.7rem', marginBottom: '2px' }}>Console Logs</div>
                          <div className="log-stdout">{log.stdout}</div>
                        </div>
                      )}
                      <div>
                        <div className="section-label" style={{ fontSize: '0.7rem', marginBottom: '2px' }}>Payload Output</div>
                        <div className="log-stdout" style={{ color: '#34d399', background: 'rgba(0,0,0,0.4)', borderLeftColor: 'var(--success)' }}>
                          {JSON.stringify(log.output, null, 2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

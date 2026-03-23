import { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import {
  askAdminAi,
  createAdminAiChat,
  deleteAdminAiChat,
  getAdminAiChat,
  getAdminAiOverview,
  renameAdminAiChat,
} from '../../services/adminApi';
import '../../styles/admin-ai-migrate.css';

const tableOptions = [
  'patients', 'doctors', 'appointments', 'emergency', 'equipments', 'hospital_staff', 'nurses', 'rooms', 'visits',
];

function AdminAiDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTables, setSelectedTables] = useState([]);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const response = await getAdminAiOverview();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load AI sessions');
      setLoading(false);
      return;
    }

    const nextSessions = response.data.sessions || [];
    setSessions(nextSessions);
    setActiveSessionId(response.data.initialSessionId || null);
    setMessages((response.data.initialChatHistory || []).flatMap((msg) => ([
      { role: 'user', text: msg.question },
      { role: 'ai', text: msg.answer },
    ])));
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const activeSessionName = useMemo(() => {
    const found = sessions.find((s) => s.session_uuid === activeSessionId);
    return found?.name || 'Chat';
  }, [sessions, activeSessionId]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.session_uuid === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const historySessions = useMemo(() => sessions.slice(0, 10), [sessions]);

  const quickPrompts = [
    'Analyze staffing gap',
    'Audit compliance logs',
    'Inventory forecast',
  ];

  const openSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    const response = await getAdminAiChat(sessionId);
    if (!response.ok) {
      setError(response.data?.error || response.data?.message || 'Failed to load chat');
      return;
    }

    const chatHistory = response.data.chat_history || [];
    setMessages(chatHistory.flatMap((msg) => ([
      { role: 'user', text: msg.question },
      { role: 'ai', text: msg.answer },
    ])));
  };

  const onNewChat = async () => {
    const response = await createAdminAiChat();
    if (!response.ok) {
      setError(response.data?.error || response.data?.message || 'Failed to create chat');
      return;
    }

    await loadOverview();
    if (response.data?.session_uuid) {
      openSession(response.data.session_uuid);
    }
  };

  const onRenameChat = async (sessionId) => {
    const newName = window.prompt('Enter new name for this chat:');
    if (!newName) return;

    const response = await renameAdminAiChat(sessionId, newName.trim());
    if (!response.ok) {
      setError(response.data?.message || 'Failed to rename chat');
      return;
    }

    setSessions((prev) => prev.map((s) => (s.session_uuid === sessionId ? { ...s, name: newName.trim() } : s)));
  };

  const onDeleteChat = async (sessionId) => {
    const ok = window.confirm('Delete this chat session?');
    if (!ok) return;

    const response = await deleteAdminAiChat(sessionId);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to delete chat');
      return;
    }

    await loadOverview();
  };

  const onSend = async (event) => {
    event.preventDefault();
    if (!activeSessionId) {
      setError('No active session found');
      return;
    }
    if (!question.trim()) return;

    const message = question.trim();
    setQuestion('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', text: message }]);

    const response = await askAdminAi({
      question: message,
      session_id: activeSessionId,
      selected_tables: selectedTables,
    });
    setSending(false);

    if (!response.ok) {
      setError(response.data?.error || response.data?.message || 'Failed to get AI response');
      return;
    }

    setMessages((prev) => [...prev, { role: 'ai', text: response.data?.answer || 'No response.' }]);
  };

  return (
    <AdminShell title="Admin AI Dashboard">
      <div className="ai-copilot-page">
        <aside className="ai-copilot-left-nav">
          <div className="ai-branding">
            <h2>Clinical Sanctuary</h2>
            <p>Admin AI Copilot</p>
          </div>

          <nav className="ai-side-menu">
            <button type="button" className="active">Dashboard</button>
            <button type="button">Analytics</button>
            <button type="button">Staffing</button>
            <button type="button">Compliance</button>
            <button type="button">Settings</button>
          </nav>

          <button type="button" className="ai-new-analysis" onClick={onNewChat}>New Analysis</button>

          <div className="ai-support-links">
            <a href="#support">Support</a>
            <a href="#logout">Logout</a>
          </div>
        </aside>

        <section className="ai-history-panel">
          <header>
            <h3>Analysis History</h3>
            <input placeholder="Find session..." />
          </header>

          {loading && <p className="muted">Loading AI dashboard...</p>}
          {!loading && error && <p className="error">{error}</p>}

          {!loading && (
            <div className="ai-history-list">
              {historySessions.length > 0 ? historySessions.map((session) => (
                <article key={session.session_uuid} className={activeSessionId === session.session_uuid ? 'active' : ''}>
                  <button type="button" className="ai-history-main" onClick={() => openSession(session.session_uuid)}>
                    <span className="ai-history-tag">{activeSessionId === session.session_uuid ? 'Active Now' : 'Archived'}</span>
                    <strong>{session.name || `Session ${String(session.session_uuid).slice(0, 8)}`}</strong>
                    <small>{String(session.session_uuid).slice(0, 16)}...</small>
                  </button>
                  <div className="ai-row-actions">
                    <button type="button" onClick={() => onRenameChat(session.session_uuid)}>Rename</button>
                    <button type="button" onClick={() => onDeleteChat(session.session_uuid)}>Delete</button>
                  </div>
                </article>
              )) : <div className="muted">No analysis history yet.</div>}
            </div>
          )}
        </section>

        <main className="ai-copilot-main">
          <header className="ai-copilot-topbar">
            <div>
              <h3>{activeSessionName || 'Hospital Operations Review'}</h3>
              <p>
                ID: {activeSession?.session_uuid ? String(activeSession.session_uuid).slice(0, 12) : 'N/A'}
                {' '}
                | System Ready
              </p>
            </div>
            <div className="ai-copilot-actions">
              <button type="button">Share</button>
              <button type="button">Export</button>
              <button type="button">More</button>
            </div>
          </header>

          <div className="ai-messages">
            {messages.length > 0 ? messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`ai-bubble ${msg.role}`}>
                {msg.text}
              </div>
            )) : (
              <div className="muted">Start a new chat and ask a question.</div>
            )}
          </div>

          <form onSubmit={onSend} className="ai-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the Copilot to analyze, audit, or report..."
              rows={2}
            />
            <div className="ai-form-bottom">
              <div className="ai-tables">
                {tableOptions.map((table) => (
                  <label key={table}>
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTables((prev) => [...prev, table]);
                        } else {
                          setSelectedTables((prev) => prev.filter((t) => t !== table));
                        }
                      }}
                    />
                    {table}
                  </label>
                ))}
              </div>
              <button className="ai-submit" type="submit" disabled={sending || !activeSessionId || !question.trim()}>
                {sending ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>
        </main>

        <aside className="ai-copilot-right-panel">
          <section>
            <h4>Quick Prompts</h4>
            <div className="ai-right-list">
              {quickPrompts.map((prompt) => (
                <button key={prompt} type="button" onClick={() => setQuestion(prompt)}>{prompt}</button>
              ))}
            </div>
          </section>

          <section>
            <h4>Compliance Status</h4>
            <div className="ai-compliance-card">
              <strong>HIPAA Shield</strong>
              <p>All patient identifiers are masked and full access requires elevated authorization.</p>
            </div>
            <div className="ai-compliance-note">
              Exported analysis is tracked in the National Medical Registry.
            </div>
          </section>

          <section className="ai-engine-meta">
            <div><span>Model Engine</span><strong>MedCore v4.2</strong></div>
            <div><span>Processing Latency</span><strong>142ms</strong></div>
            <div><span>Last Sync</span><strong>Just Now</strong></div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminAiDashboardPage;

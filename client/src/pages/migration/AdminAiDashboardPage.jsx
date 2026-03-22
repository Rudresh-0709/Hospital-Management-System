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
      <section className="card ai-shell">
        {loading && <p className="muted">Loading AI dashboard...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && (
          <div className="ai-layout">
            <aside className="ai-sidebar">
              <div className="ai-sidebar-head">
                <h3>Your Chats</h3>
                <button className="btn" type="button" onClick={onNewChat}>New Chat</button>
              </div>
              <ul>
                {sessions.map((session) => (
                  <li key={session.session_uuid} className={activeSessionId === session.session_uuid ? 'active' : ''}>
                    <button type="button" onClick={() => openSession(session.session_uuid)}>{session.name || 'Chat'}</button>
                    <div className="ai-row-actions">
                      <button type="button" onClick={() => onRenameChat(session.session_uuid)}>Rename</button>
                      <button type="button" onClick={() => onDeleteChat(session.session_uuid)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <main className="ai-main">
              <h3>{activeSessionName}</h3>
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
                  placeholder="Type your message..."
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
                  <button className="btn" type="submit" disabled={sending || !activeSessionId}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </main>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default AdminAiDashboardPage;

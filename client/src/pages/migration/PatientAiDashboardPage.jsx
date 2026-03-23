import { useEffect, useMemo, useState } from 'react';
import {
  askPatientAi,
  createPatientAiChat,
  getPatientAiChat,
  getPatientAiOverview,
} from '../../services/patientApi';
import '../../styles/patient-ai-migrate.css';

function mapHistoryToMessages(history = []) {
  return history.flatMap((msg) => {
    if (msg?.role && msg?.message) {
      const role = String(msg.role).toLowerCase();
      const normalizedRole = role === 'assistant' ? 'ai' : role;
      return [{ role: normalizedRole === 'ai' ? 'ai' : 'user', text: msg.message }];
    }

    const userText = msg?.question || msg?.user_message || '';
    const aiText = msg?.answer || msg?.ai_message || '';
    return [
      { role: 'user', text: userText },
      { role: 'ai', text: aiText },
    ].filter((entry) => entry.text);
  });
}

function PatientAiDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    const response = await getPatientAiOverview();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load patient AI dashboard');
      setLoading(false);
      return;
    }

    setPatientId(response.data.patient_id || null);
    setSessions(response.data.sessions || []);
    setActiveSessionId(response.data.initialSessionId || null);
    const initialHistory = response.data.initialChatHistory || [];
    setMessages(mapHistoryToMessages(initialHistory));
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const activeSessionLabel = useMemo(() => {
    const found = sessions.find((s) => s.session_uuid === activeSessionId);
    return found?.session_uuid ? `Session ${String(found.session_uuid).slice(0, 8)}...` : 'No Active Session';
  }, [sessions, activeSessionId]);

  const openSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    const response = await getPatientAiChat(sessionId);
    if (!response.ok) {
      setError(response.data?.error || response.data?.message || 'Failed to load chat history');
      return;
    }

    const history = response.data.chat_history || [];
    setMessages(mapHistoryToMessages(history));
  };

  const createNewChat = async () => {
    const response = await createPatientAiChat();
    if (!response.ok) {
      setError(response.data?.error || response.data?.message || 'Failed to create chat');
      return;
    }

    await loadOverview();
    if (response.data?.session_uuid) {
      openSession(response.data.session_uuid);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeSessionId) {
      return;
    }

    setSending(true);
    setMessageInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);

    const response = await askPatientAi({
      message: text,
      session_id: activeSessionId,
      patient_id: patientId,
      image_base64: null,
    });
    setSending(false);

    if (!response.ok) {
      setError(response.data?.error || response.data?.message || 'Failed to get AI response');
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: 'ai', text: response.data?.reply || response.data?.response || response.data?.answer || 'No response.' },
    ]);
  };

  const recentSessions = useMemo(() => sessions.slice(0, 6), [sessions]);
  const hasMessages = messages.length > 0;

  const quickPrompts = [
    'Check my symptoms',
    'Explain lab results',
    'Medication side effects',
    'Wellness plan help',
  ];

  const commonQuestions = [
    'Normal BP range?',
    'Allergy symptoms',
    'Fast for blood work?',
    'Vitamin D dosage',
  ];

  return (
    <div className="patient-ai-page">
      <aside className="patient-ai-sidebar">
        <div className="patient-ai-brand">
          <div className="patient-ai-brand-mark">AI</div>
          <div>
            <h2>Aetheris AI</h2>
            <p>Your Health Companion</p>
          </div>
        </div>

        <button type="button" className="new-chat-btn" onClick={createNewChat}>New Consultation</button>

        <div className="patient-ai-nav-group">
          <p className="patient-ai-group-title">Primary Portal</p>
          <button type="button" className="patient-ai-nav-item active">Recent Chat</button>
          <button type="button" className="patient-ai-nav-item">Health Insights</button>
          <button type="button" className="patient-ai-nav-item">Medications</button>
          <button type="button" className="patient-ai-nav-item">Lab Results</button>
        </div>

        <div className="patient-ai-sessions-block">
          <p className="patient-ai-group-title">Recent Consultations</p>
          <div className="patient-ai-sessions">
            {recentSessions.length > 0 ? recentSessions.map((session) => (
              <button
                type="button"
                key={session.session_uuid}
                className={activeSessionId === session.session_uuid ? 'session-link active' : 'session-link'}
                onClick={() => openSession(session.session_uuid)}
              >
                {String(session.session_uuid).slice(0, 18)}...
              </button>
            )) : <div className="empty">No history yet.</div>}
          </div>
        </div>

        <div className="patient-ai-sidebar-footer">
          <a href="#privacy">Privacy</a>
          <a href="#support">Support</a>
        </div>
      </aside>

      <main className="patient-ai-main">
        <header className="patient-ai-topbar">
          <h3>Consultation Session</h3>
          <div className="patient-ai-topbar-icons">
            <button type="button" aria-label="Help">?</button>
            <button type="button" aria-label="Settings">S</button>
            <button type="button" aria-label="Account">U</button>
          </div>
        </header>

        <div className="patient-ai-warning">Aetheris AI is an assistant, not a doctor. In an emergency, call 911.</div>

        <div className="patient-ai-workspace">
          {loading && <div className="status">Loading AI dashboard...</div>}
          {!loading && error && <div className="status error">{error}</div>}

          {!loading && (
            <>
              {!hasMessages ? (
                <section className="patient-ai-empty-state">
                  <div className="empty-state-icon">+</div>
                  <h1>How can I help you today?</h1>
                  <p>Describe your symptoms, ask about medication interactions, or get help understanding your latest lab results.</p>

                  <div className="patient-ai-quick-grid">
                    {quickPrompts.map((prompt) => (
                      <button
                        type="button"
                        key={prompt}
                        className="quick-card"
                        onClick={() => setMessageInput(prompt)}
                      >
                        <strong>{prompt}</strong>
                        <span>Tap to prepare this question</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="patient-ai-messages">
                  <div className="patient-ai-session-label">{activeSessionLabel}</div>
                  {messages.map((msg, idx) => (
                    <div key={`${msg.role}-${idx}`} className={`bubble ${msg.role}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={sendMessage} className="patient-ai-form">
                <textarea
                  rows={2}
                  placeholder="Message Aetheris AI..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button type="submit" disabled={sending || !activeSessionId}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
              <div className="patient-ai-compliance-note">Securely encrypted and HIPAA compliant</div>
            </>
          )}
        </div>
      </main>

      <aside className="patient-ai-right-panel">
        <section className="right-panel-block">
          <h4>How To Use AI</h4>
          <div className="tip-card">
            <strong>Be Specific</strong>
            <p>Instead of "I feel sick", try "I have had a headache for 2 days".</p>
          </div>
          <div className="tip-card">
            <strong>Mention Records</strong>
            <p>Reference labs, meds, and timeline for better AI guidance.</p>
          </div>
        </section>

        <section className="right-panel-block">
          <h4>Common Questions</h4>
          <div className="question-tags">
            {commonQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => setMessageInput(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </section>

        <section className="emergency-card">
          <h5>Severe Symptoms?</h5>
          <p>If you are experiencing chest pain, breathing difficulty, or severe bleeding, speak with a doctor immediately.</p>
          <button type="button">Talk To A Doctor</button>
        </section>
      </aside>
    </div>
  );
}

export default PatientAiDashboardPage;

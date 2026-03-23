import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { addChatUser, getChatOverview, getConversation } from '../../services/chatApi';
import '../../styles/chat-migrate.css';

function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [newUserCode, setNewUserCode] = useState('');
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUser) return 'No conversation selected';
    return `${selectedUser.name} (${selectedUser.role})`;
  }, [selectedUser]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const loadOverview = async () => {
    const response = await getChatOverview();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load chat data');
      setLoading(false);
      return;
    }

    const me = response.data?.currentUser;
    const chatUsers = response.data?.users || [];
    setCurrentUser(me || null);
    setUsers(chatUsers);
    if (chatUsers.length) {
      setSelectedUser(chatUsers[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (!currentUser?._id) return;

    const socket = io('/chat', {
      query: { userId: currentUser._id },
    });
    socketRef.current = socket;

    socket.on('chatMessage', (payload) => {
      const receiverId = String(payload?.receiverId || '');
      const senderId = String(payload?.senderId || '');
      const selectedId = String(selectedUser?._id || '');
      const meId = String(currentUser._id);

      const isForActiveChat =
        (senderId === selectedId && receiverId === meId) ||
        (senderId === meId && receiverId === selectedId);

      if (isForActiveChat) {
        setMessages((prev) => [...prev, {
          sender: payload.senderId,
          receiver: payload.receiverId,
          message: payload.message,
          timestamp: payload.timestamp || new Date().toISOString(),
        }]);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser?._id, selectedUser?._id]);

  useEffect(() => {
    async function loadConversation() {
      if (!currentUser?._id || !selectedUser?._id) {
        setMessages([]);
        return;
      }

      const response = await getConversation(currentUser._id, selectedUser._id);
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load conversation');
        setMessages([]);
        return;
      }

      setMessages(Array.isArray(response.data) ? response.data : []);
    }

    loadConversation();
  }, [currentUser?._id, selectedUser?._id]);

  const onAddUser = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const response = await addChatUser(newUserCode.trim());
    if (!response.ok) {
      setError(response.data?.message || 'Failed to add user');
      return;
    }

    setSuccess(response.data?.message || 'User added');
    setNewUserCode('');
    await loadOverview();
  };

  const onSend = (event) => {
    event.preventDefault();
    if (!draft.trim() || !socketRef.current || !currentUser?._id || !selectedUser?._id) return;

    socketRef.current.emit('chatMessage', {
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      message: draft.trim(),
    });

    setDraft('');
  };

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-clinical-page">
      <aside className="chat-left-nav">
        <h2>Clinical Sanctuary</h2>
        <div className="chat-left-current-user">
          <strong>{currentUser?.name || 'User'}</strong>
          <span>{currentUser?.role || 'Staff'}</span>
        </div>

        <nav className="chat-left-menu">
          <button type="button" className="active">Messages</button>
          <button type="button">Directory</button>
          <button type="button">Clinics</button>
          <button type="button">Vitals</button>
          <button type="button">Settings</button>
        </nav>

        <button type="button" className="chat-left-new">New Chat</button>
      </aside>

      <section className="chat-contacts-panel">
        <header className="chat-contacts-top">
          <input placeholder="Search medical staff..." />
          <form className="add-user-row" onSubmit={onAddUser}>
            <input
              className="chat-add-user-input"
              placeholder="Add by 6-digit user ID"
              value={newUserCode}
              onChange={(event) => setNewUserCode(event.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </header>

        {loading && <p className="muted">Loading chat...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && (
          <div className="chat-users-list">
            {users.length > 0 ? users.map((user) => (
              <button
                key={user._id}
                type="button"
                className={`user-row ${selectedUser?._id === user._id ? 'active' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.role}</small>
                </div>
                <span className={`presence ${user.is_online ? 'online' : 'offline'}`}>
                  {user.is_online ? 'Online' : 'Offline'}
                </span>
              </button>
            )) : <p className="muted">No chat users yet.</p>}
          </div>
        )}
      </section>

      <main className="chat-main-panel">
        <header className="chat-main-topbar">
          <div>
            <h3>{selectedUser?.name || 'No conversation selected'}</h3>
            <p>{selectedUser?.role || 'Select a user to start chat'}</p>
          </div>
          <nav>
            <button type="button">Patient Files</button>
            <button type="button" className="active">Lab Results</button>
            <button type="button">Radiology</button>
          </nav>
        </header>

        <div className="msg-list">
          {messages.length > 0 ? messages.map((msg, index) => {
            const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
            const mine = String(senderId) === String(currentUser?._id);
            return (
              <div key={`${msg._id || index}-${index}`} className={`msg-item ${mine ? 'self' : 'other'}`}>
                <div className={`msg-bubble ${mine ? 'self' : 'other'}`}>
                  {msg.message}
                </div>
                <span className="msg-time">{formatTime(msg.timestamp)}</span>
              </div>
            );
          }) : <p className="muted">No messages yet.</p>}
          <div ref={messageEndRef} />
        </div>

        <form className="composer" onSubmit={onSend}>
          <input
            className="composer-input"
            placeholder="Type clinical note or message..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button className="composer-send" type="submit" disabled={!draft.trim() || !selectedUser}>
            Send
          </button>
        </form>
      </main>

      <aside className="chat-right-panel">
        <div className="profile-card">
          <h4>{selectedUser?.name || 'No Contact Selected'}</h4>
          <p>{selectedUser?.role || 'Select a conversation'}</p>
        </div>

        <section className="quick-actions">
          <h5>Quick Actions</h5>
          <div>
            <button type="button">Profile</button>
            <button type="button">Schedule</button>
          </div>
        </section>

        <section className="recent-activity">
          <h5>Recent Activity</h5>
          <ul>
            <li>Updated ICU chart</li>
            <li>Ordered blood work</li>
            <li>Reviewed medication logs</li>
          </ul>
        </section>

        <section className="clinical-note">
          <h5>Clinical Note</h5>
          <p>Maintain secure communication and document major treatment decisions in the patient record.</p>
        </section>
      </aside>
    </div>
  );
}

export default ChatPage;

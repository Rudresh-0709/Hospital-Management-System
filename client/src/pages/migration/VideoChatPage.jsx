import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/video-chat-migrate.css';

function VideoChatPage() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const isPatient = user?.role === 'patient';

  const join = () => {
    if (!code.trim()) {
      setMessage('Please enter a video code.');
      return;
    }
    setMessage(`Joining room with code: ${code}`);
  };

  const generate = () => {
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setCode(generated);
    setMessage(`Generated video code: ${generated}`);
  };

  return (
    <div className="video-chat-page">
      <div className="video-chat-card">
        <h2>Video Chat</h2>
        <label htmlFor="videocode">Enter Video Code:</label>
        <input
          type="number"
          id="videocode"
          name="videocode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {isPatient ? (
          <button type="button" onClick={join}>Join</button>
        ) : (
          <button type="button" onClick={generate}>Generate Code</button>
        )}

        {message && <p className="video-status">{message}</p>}
      </div>
    </div>
  );
}

export default VideoChatPage;

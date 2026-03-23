import { useEffect, useState } from 'react';
import {
  getChatUserDetails,
  getCurrentChatUser,
  uploadChatProfilePicture,
} from '../../services/patientApi';
import '../../styles/chat-settings-migrate.css';

function ChatSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState('');
  const [statusMessage, setStatusMessage] = useState('No file chosen');

  useEffect(() => {
    async function load() {
      const currentUserResponse = await getCurrentChatUser();
      if (!currentUserResponse.ok || !currentUserResponse.data?.userId) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      const id = currentUserResponse.data.userId;
      setUserId(id);

      const userDetailsResponse = await getChatUserDetails(id);
      if (userDetailsResponse.ok && userDetailsResponse.data?.profilePicture) {
        setProfilePicture(userDetailsResponse.data.profilePicture);
      }

      setLoading(false);
    }

    load();
  }, []);

  const onUpload = async () => {
    if (!selectedFile || !userId) {
      setStatusMessage('Please select a file.');
      return;
    }

    const response = await uploadChatProfilePicture(userId, selectedFile);
    if (!response.ok || !response.data?.success) {
      setStatusMessage(response.data?.message || 'Upload failed.');
      return;
    }

    setProfilePicture(response.data.profilePicture);
    setStatusMessage('Profile updated successfully!');
  };

  return (
    <div className="chat-settings-page">
      <div className="chat-settings-card">
        <h2>Chat Settings</h2>

        {loading && <p>Loading...</p>}
        {!loading && error && <p className="error">{error}</p>}

        {!loading && !error && (
          <>
            <h3>Change Profile Picture</h3>
            <div className="profile-picture">
              <img
                src={selectedPreview || profilePicture || '/png/adminpng/doctor.png'}
                alt="Profile"
              />
            </div>

            <div className="upload-row">
              <label htmlFor="fileInput" className="custom-file-btn">Choose File</label>
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  if (file) {
                    setStatusMessage(file.name);
                    setSelectedPreview(URL.createObjectURL(file));
                  } else {
                    setStatusMessage('No file chosen');
                    setSelectedPreview('');
                  }
                }}
              />
              <button type="button" onClick={onUpload}>Upload</button>
            </div>

            <p className="status-message">{statusMessage}</p>
            <a href="/chat" className="back-btn">Back to Chat</a>
          </>
        )}
      </div>
    </div>
  );
}

export default ChatSettingsPage;

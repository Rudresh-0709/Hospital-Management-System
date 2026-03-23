export async function getPatientDashboardOverview() {
  const response = await fetch('/api/patient/dashboard/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getPatientAiOverview() {
  const response = await fetch('/api/patient/ai/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getPatientAiChat(session_uuid) {
  const response = await fetch(`/api/patient/ai/chat/${encodeURIComponent(session_uuid)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function createPatientAiChat() {
  const response = await fetch('/api/patient/ai/newchat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function askPatientAi(payload) {
  const response = await fetch('/api/patient/ai/ask', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getCurrentChatUser() {
  const response = await fetch('/chat/api/current-user', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getChatUserDetails(userId) {
  const response = await fetch(`/chat/api/user/${encodeURIComponent(userId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function uploadChatProfilePicture(userId, file) {
  const formData = new FormData();
  formData.append('profilePic', file);

  const response = await fetch(`/chat/upload-profile/${encodeURIComponent(userId)}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

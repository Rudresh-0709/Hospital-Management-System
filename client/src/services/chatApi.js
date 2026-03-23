export async function getChatOverview() {
  const response = await fetch('/api/chat/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function addChatUser(userId) {
  const response = await fetch('/api/chat/add-user', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getConversation(senderId, receiverId) {
  const response = await fetch(`/chat/conversation?senderId=${encodeURIComponent(senderId)}&receiverId=${encodeURIComponent(receiverId)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

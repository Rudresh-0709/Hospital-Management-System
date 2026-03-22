export async function getAuthStatus() {
  const response = await fetch('/api/auth/status', {
    method: 'GET',
    credentials: 'include',
  });

  return response.json();
}

export async function loginAdmin(payload) {
  const response = await fetch('/api/auth/login/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function loginDoctor(payload) {
  const response = await fetch('/api/auth/login/doctor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function loginPatient(payload) {
  const response = await fetch('/api/auth/login/patient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

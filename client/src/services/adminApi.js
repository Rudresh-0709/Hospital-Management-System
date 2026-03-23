export async function getAdminPatientsOverview() {
  const response = await fetch('/api/admin/patients/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getAdminAdmitOverview() {
  const response = await fetch('/api/admin/admit/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getAdminDischargeOverview() {
  const response = await fetch('/api/admin/discharge/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function dischargePatient(payload) {
  const response = await fetch('/api/admin/discharge', {
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

export async function getAdminPatientHistory(filters = {}) {
  const params = new URLSearchParams();
  if (filters.gender) params.set('gender', filters.gender);
  if (filters.ward_preference) params.set('ward_preference', filters.ward_preference);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  const response = await fetch(`/api/admin/patienthistory${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getAdminNewVisitorOverview() {
  const response = await fetch('/api/admin/newvisitor/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function searchVisitorBadges(payload) {
  const response = await fetch('/api/admin/newvisitor/search-badges', {
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

export async function assignVisitorBadge(payload) {
  const response = await fetch('/api/admin/newvisitor/assign-badge', {
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

export async function getAdminVisitHistory(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.ward_preference) params.set('ward_preference', filters.ward_preference);
  if (filters.sort) params.set('sort', filters.sort);

  const query = params.toString();
  const response = await fetch(`/api/admin/visit-history${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function decodeVisitQrImage(file) {
  const formData = new FormData();
  formData.append('qrImage', file);

  const response = await fetch('/api/decode-qr', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function createDoctor(payload) {
  const response = await fetch('/api/admin/newdoctor', {
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

export async function createStaff(payload) {
  const response = await fetch('/api/admin/newstaff', {
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

export async function getEquipmentOverview() {
  const response = await fetch('/api/admin/equipment/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function addEquipment(payload) {
  const response = await fetch('/api/admin/equipment/add', {
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

export async function updateEquipment(payload) {
  const response = await fetch('/api/admin/equipment/update', {
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

export async function getAdminPharmacyOverview() {
  const response = await fetch('/api/admin/pharmacy/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getNurseAllocationOverview() {
  const response = await fetch('/api/admin/nurseallocate/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getAvailableNurses(admit_id) {
  const response = await fetch(`/api/admin/nurseallocate/nurses?admit_id=${encodeURIComponent(admit_id)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function assignNurse(payload) {
  const response = await fetch('/api/admin/nurseallocate/assign', {
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

export async function getAdminAiOverview() {
  const response = await fetch('/api/admin/ai/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getAdminAiChat(session_uuid) {
  const response = await fetch(`/admin/ai/chat/${encodeURIComponent(session_uuid)}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function createAdminAiChat() {
  const response = await fetch('/admin/ai/newchat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function renameAdminAiChat(session_uuid, newName) {
  const response = await fetch(`/admin/ai/chat/${encodeURIComponent(session_uuid)}/rename`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ newName, sessionId: session_uuid }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function deleteAdminAiChat(session_uuid) {
  const response = await fetch(`/admin/ai/chat/${encodeURIComponent(session_uuid)}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function askAdminAi(payload) {
  const response = await fetch('http://localhost:8000/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getAdminNurseFormData() {
  const response = await fetch('/api/admin/nurse/form-data', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function addNurse(payload) {
  const response = await fetch('/api/admin/nurse/add', {
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

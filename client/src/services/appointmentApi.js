export async function getAppointmentFormData() {
  const response = await fetch('/api/appointments/form-data', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function bookAppointment(payload) {
  const response = await fetch('/api/appointments/book', {
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

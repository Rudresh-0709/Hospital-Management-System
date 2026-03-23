export async function getDoctorVisitNavigation() {
  const response = await fetch('/api/doctor/visitnavigation', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getPendingAppointments() {
  const response = await fetch('/api/doctor/appointments/pending', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function approveAppointment(appointment_id) {
  const response = await fetch('/api/doctor/appointments/approve', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appointment_id }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function rejectAppointment(appointment_id) {
  const response = await fetch('/api/doctor/appointments/reject', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appointment_id }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getDoctorDashboardOverview() {
  const response = await fetch('/api/doctor/dashboard/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function getDoctorDiagnosisFormData() {
  const response = await fetch('/api/doctor/diagnosis/form-data', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function submitDoctorDiagnosis(payload) {
  const response = await fetch('/api/doctor/diagnosis/submit', {
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

export async function getDoctorPrescriptionFormData(params) {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/doctor/prescription/form-data?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function submitDoctorPrescription(payload) {
  const response = await fetch('/api/doctor/prescription/submit', {
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

export async function getDoctorNewPrescriptionFormData() {
  const response = await fetch('/api/doctor/newprescription/form-data', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export async function submitDoctorNewPrescription(payload) {
  const response = await fetch('/api/doctor/newprescription/submit', {
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

export function getPatientFullName(patient, fallback = 'Patient') {
  if (!patient) return fallback;

  const fullName = String(patient.full_name || '').trim();
  if (fullName) return fullName;

  const firstName = String(patient.first_name || '').trim();
  const lastName = String(patient.last_name || '').trim();
  const merged = `${firstName} ${lastName}`.trim();
  return merged || fallback;
}

export function getPatientSearchName(patient) {
  return getPatientFullName(patient, '').toLowerCase();
}

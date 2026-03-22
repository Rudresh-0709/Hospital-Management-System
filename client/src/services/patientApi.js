export async function getPatientDashboardOverview() {
  const response = await fetch('/api/patient/dashboard/overview', {
    method: 'GET',
    credentials: 'include',
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

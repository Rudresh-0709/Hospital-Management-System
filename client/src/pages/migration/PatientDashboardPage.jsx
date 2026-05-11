import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPatientDashboardOverview } from '../../services/patientApi';
import { getPatientFullName } from '../../utils/patientName';
import '../../styles/patient-dashboard-ejs.css';

const navItems = [
  { name: 'Dashboard', active: true },
  { name: 'Appointments', to: '/appointmentbook' },
  { name: 'Medications' },
  { name: 'Lab Results' },
  { name: 'Billing' },
  { name: 'Support' },
];

const vitals = [
  { label: 'Heart Rate', value: '72', unit: 'bpm', badge: 'Normal' },
  { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', badge: 'Optimal' },
  { label: 'Weight', value: '75', unit: 'kg', badge: '-2kg' },
  { label: 'Glucose', value: '95', unit: 'mg/dL', badge: 'Fasting' },
];

const goals = [
  { label: 'Daily Steps', value: '8,500 / 10k', progress: 85 },
  { label: 'Sleep', value: '7.5h / 8h', progress: 92 },
  { label: 'Hydration', value: '2L / 2.5L', progress: 80 },
];

const careTeam = [
  { name: 'Dr. Michael Chen', role: 'Primary Care' },
  { name: 'Dr. Sarah Vance', role: 'Cardiology' },
  { name: 'Nurse Emily', role: 'Nurse Contact' },
];

const labResults = [
  { name: 'Complete Blood Count', source: 'Sep 28, 2023 • Quest Diagnostics', state: 'Normal' },
  { name: 'Lipid Panel', source: 'Sep 15, 2023 • Mercy Health', state: 'Attention' },
  { name: 'A1C Test', source: 'Aug 30, 2023 • City Lab', state: 'Critical' },
];

const insights = [
  {
    tag: 'Announcement',
    title: 'Flu shots now available at all Clinical Sanctuary locations.',
    body: 'Schedule your annual vaccination through the portal today to avoid winter rushes.'
  },
  {
    tag: 'Wellness Tip',
    title: '5 Ways to manage your blood pressure naturally.',
    body: 'Review our latest clinical guide on dietary adjustments for better cardiovascular health.'
  },
  {
    tag: 'Account Security',
    title: 'Enhanced security features added to your patient portal.',
    body: 'We implemented multi-factor authentication for all lab result access.'
  },
];

function formatPatientName(patient) {
  return getPatientFullName(patient);
}

function formatDateDisplay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString().slice(4);
}

function toLabState(severity) {
  const value = String(severity || '').toLowerCase();
  if (value.includes('critical') || value.includes('high') || value.includes('severe')) {
    return 'Critical';
  }
  if (value.includes('medium') || value.includes('moderate')) {
    return 'Attention';
  }
  return 'Normal';
}

function PatientDashboardPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState({
    patient: null,
    emergencyContact: null,
    admission: null,
    appointments: [],
    diagnoses: [],
    notifications: [],
    prescriptions: [],
  });

  useEffect(() => {
    async function load() {
      const response = await getPatientDashboardOverview();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load patient dashboard');
        setLoading(false);
        return;
      }

      setPayload({
        patient: response.data.patient || null,
        emergencyContact: response.data.emergencyContact || null,
        admission: response.data.admission || null,
        appointments: response.data.appointments || [],
        diagnoses: response.data.diagnoses || [],
        notifications: response.data.notifications || [],
        prescriptions: response.data.prescriptions || [],
      });
      setLoading(false);
    }

    load();
  }, []);

  const medicationList = useMemo(() => payload.prescriptions.slice(0, 8), [payload.prescriptions]);
  const notifications = useMemo(() => payload.notifications.slice(0, 5), [payload.notifications]);
  const patientName = useMemo(() => formatPatientName(payload.patient), [payload.patient]);
  const appointments = useMemo(() => payload.appointments || [], [payload.appointments]);

  const activePrescriptionCount = useMemo(() => {
    const unique = new Set((payload.prescriptions || []).map((row) => row.prescription_id));
    return unique.size;
  }, [payload.prescriptions]);

  const unreadNotificationCount = useMemo(
    () => (payload.notifications || []).filter((item) => !item.is_read || Number(item.is_read) === 0).length,
    [payload.notifications]
  );

  const pendingAppointmentsCount = useMemo(
    () => appointments.filter((item) => String(item.status || '').toLowerCase() === 'pending').length,
    [appointments]
  );

  const statusLabel = useMemo(() => {
    if (!payload.admission) return 'Outpatient';
    if (!payload.admission.discharge_date) return 'Admitted';
    return 'Discharged';
  }, [payload.admission]);

  const nextAppointment = useMemo(() => {
    if (!appointments.length) return null;
    const now = new Date();
    const withDate = appointments
      .map((item) => {
        const dateText = item.appointment_date ? String(item.appointment_date).slice(0, 10) : '';
        const timeText = item.appointment_time || '00:00:00';
        const date = new Date(`${dateText}T${timeText}`);
        return { ...item, _date: date };
      })
      .filter((item) => !Number.isNaN(item._date.getTime()))
      .sort((a, b) => a._date - b._date);

    return withDate.find((item) => item._date >= now) || withDate[0] || null;
  }, [appointments]);

  const dynamicCareTeam = useMemo(() => {
    const names = [];
    if (payload.admission?.doctor_assigned) names.push(payload.admission.doctor_assigned);
    appointments.forEach((item) => {
      if (item.doctor_name) names.push(item.doctor_name);
    });
    const unique = [...new Set(names)].slice(0, 3);
    return unique.map((name, index) => ({
      name: `Dr. ${name}`,
      role: index === 0 ? 'Primary Care' : 'Consultant',
    }));
  }, [appointments, payload.admission]);

  const dynamicLabResults = useMemo(() => {
    if (!payload.diagnoses?.length) return labResults;
    return payload.diagnoses.slice(0, 3).map((row) => ({
      name: row.diagnosis_name || 'Diagnosis',
      source: `${formatDateDisplay(row.diagnosis_date)}${row.doctor_name ? ` • ${row.doctor_name}` : ''}`.trim(),
      state: toLabState(row.severity),
    }));
  }, [payload.diagnoses]);

  const emergencyName = payload.emergencyContact?.emergency_name || 'Not available';
  const emergencyRelationship = payload.emergencyContact?.relationship || 'Contact';
  const emergencyPhone = payload.emergencyContact?.emergency_contact || 'Not available';

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="migrate-patient-dashboard modern-pd">
      <aside className="pd-sidebar">
        <div className="pd-brand">Clinical Sanctuary</div>

        <div className="pd-user-card">
          <div className="avatar-circle">A</div>
          <div>
            <h4>{patientName}</h4>
            <p>ID: PAT-8291</p>
          </div>
        </div>

        <nav className="pd-menu" aria-label="Patient menu">
          {navItems.map((item) => (
            item.to ? (
              <Link key={item.name} to={item.to} className={item.active ? 'active' : ''}>
                {item.name}
              </Link>
            ) : (
              <a href="#" key={item.name} className={item.active ? 'active' : ''}>{item.name}</a>
            )
          ))}
        </nav>

        <div className="pd-side-bottom">
          <a href="#">Settings</a>
          <Link to="/patient/ai" className="chat-btn">Chat with Agent</Link>
          <button type="button" onClick={handleLogout} style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'transparent', color: '#ba1a1a', border: '1px solid #ba1a1a', borderRadius: '6px', cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>

      <div className="pd-main">
        <header className="pd-topbar">
          <input type="text" placeholder="Search records, doctors, or results..." aria-label="Search records" />
          <div className="topbar-actions">
            <button type="button" className="icon-btn" aria-label="Notifications">!</button>
            <button type="button" className="icon-btn" aria-label="Help">?</button>
            <Link to="/chat" className="ghost-btn">Contact Doctor</Link>
            <button type="button" className="solid-btn">Request Refill</button>
          </div>
        </header>

        {loading && <div className="pd-block">Loading dashboard...</div>}
        {!loading && error && <div className="pd-block pd-error">{error}</div>}

        {!loading && !error && (
          <>
            <section className="pd-content-grid">
              <div className="core-column">
                <div className="kpi-grid">
                  <article className="kpi-card">
                    <h5>Active Rx</h5>
                    <strong>{activePrescriptionCount || medicationList.length || 0}</strong>
                  </article>
                  <article className="kpi-card">
                    <h5>Unread</h5>
                    <strong>{unreadNotificationCount || notifications.length || 0}</strong>
                  </article>
                  <article className="kpi-card">
                    <h5>Pending Appointments</h5>
                    <strong>{pendingAppointmentsCount}</strong>
                  </article>
                  <article className="kpi-card">
                    <h5>Status</h5>
                    <strong>{statusLabel}</strong>
                  </article>
                </div>

                <article className="visit-hero">
                  <p>Next Scheduled Visit</p>
                  <h3>{nextAppointment?.doctor_name || payload.admission?.doctor_assigned || 'Care Team'}</h3>
                  <div className="visit-meta">
                    <span>{nextAppointment ? formatDateDisplay(nextAppointment.appointment_date) : 'No upcoming appointment'}</span>
                    <span>{nextAppointment?.purpose || payload.admission?.reason_for_admission || 'General consultation'}</span>
                  </div>
                  <div className="visit-actions">
                    <button type="button">View Details</button>
                    <button type="button" className="muted">Reschedule</button>
                  </div>
                </article>

                <article className="adherence-card">
                  <div className="ring">85%</div>
                  <div>
                    <h4>Almost there!</h4>
                    <p>2 doses remaining for today. Keep it up.</p>
                  </div>
                </article>

                <article className="schedule-card">
                  <h3>Daily Schedule</h3>
                  <ul>
                    {medicationList.length > 0 ? medicationList.slice(0, 6).map((item, idx) => (
                      <li key={`${item.prescription_id || idx}-${idx}`}>
                        <span className="dose-strip" />
                        <div>
                          <h4>{item.medicine_name || 'Medication'}</h4>
                          <p>{item.time_of_intake || '08:00 AM'} • {item.dosage || 'As prescribed'}</p>
                        </div>
                        <span className="status-dot done" />
                      </li>
                    )) : (
                      <li>
                        <span className="dose-strip" />
                        <div>
                          <h4>Atorvastatin</h4>
                          <p>08:00 AM • 20mg</p>
                        </div>
                        <span className="status-dot done" />
                      </li>
                    )}
                  </ul>
                </article>
              </div>

              <div className="middle-column">
                <div className="vital-grid">
                  {vitals.map((item) => (
                    <article className="vital-card" key={item.label}>
                      <span className="badge">{item.badge}</span>
                      <h4>{item.label}</h4>
                      <strong>{item.value}</strong>
                      <span className="unit">{item.unit}</span>
                    </article>
                  ))}
                </div>

                <article className="lab-card">
                  <h3>Recent Lab Results</h3>
                  <ul>
                    {dynamicLabResults.map((lab) => (
                      <li key={lab.name}>
                        <div>
                          <h4>{lab.name}</h4>
                          <p>{lab.source}</p>
                        </div>
                        <span className={`lab-state ${lab.state.toLowerCase()}`}>{lab.state}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className="side-column">
                <article className="goals-card">
                  <h3>Patient Goals</h3>
                  <ul>
                    {goals.map((goal) => (
                      <li key={goal.label}>
                        <div className="goal-row">
                          <span>{goal.label}</span>
                          <strong>{goal.value}</strong>
                        </div>
                        <div className="goal-track">
                          <span style={{ width: `${goal.progress}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="team-card">
                  <h3>Your Care Team</h3>
                  <ul>
                    {(dynamicCareTeam.length ? dynamicCareTeam : careTeam).map((member) => (
                      <li key={member.name}>
                        <span className="avatar-sm">+</span>
                        <div>
                          <h4>{member.name}</h4>
                          <p>{member.role}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="billing-card">
                  <h3>Billing & Insurance</h3>
                  <div className="billing-panel">
                    <p>Appointment Load</p>
                    <h4>{appointments.length} total appointments</h4>
                    <div className="billing-row">
                      <span>{pendingAppointmentsCount}</span>
                      <button type="button">Pay Now</button>
                    </div>
                  </div>
                </article>

                <article className="emergency-card">
                  <p>Emergency Contact</p>
                  <h4>{emergencyName} ({emergencyRelationship})</h4>
                  <span>{emergencyPhone}</span>
                </article>

                <div className="side-tools">
                  <button type="button">Reports</button>
                  <button type="button">RX PDF</button>
                </div>
              </div>
            </section>

            <section className="notification-strip">
              <h3>Recent Notifications</h3>
              <ul>
                {notifications.length > 0 ? notifications.map((item, idx) => (
                  <li key={`${item.notification_id || idx}-${idx}`}>
                    <span>{item.message}</span>
                    <small>{formatDateDisplay(item.created_at)}</small>
                  </li>
                )) : <li><span>No new notifications.</span></li>}
              </ul>
            </section>

            <section className="updates-section">
              <h3>Health Insights & Hospital Updates</h3>
              <div className="updates-grid">
                {insights.map((item) => (
                  <article className="update-card" key={item.title}>
                    <div className="update-media" />
                    <span>{item.tag}</span>
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default PatientDashboardPage;


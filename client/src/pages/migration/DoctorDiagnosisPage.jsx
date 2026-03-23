import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorShell from '../../components/migration/DoctorShell';
import { getDoctorDiagnosisFormData, submitDoctorDiagnosis } from '../../services/doctorApi';
import '../../styles/doctor-prescription-migrate.css';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function DoctorDiagnosisPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [patients, setPatients] = useState([]);

  const [form, setForm] = useState({
    patient: '',
    patient_type: 'appointment',
    diagnosis_date: todayISO(),
    diagnosis_name: '',
    severity: 'Mild',
    symptoms: '',
    diagnosis_details: '',
    follow_up_date: '',
    notes: '',
    walking: '',
    running: '',
    swimming: '',
    cycling: '',
    yoga: '',
    diet_plan: '',
  });

  useEffect(() => {
    async function load() {
      const response = await getDoctorDiagnosisFormData();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load diagnosis form');
        setLoading(false);
        return;
      }

      const dataPatients = response.data?.patients || [];
      setDoctorId(String(response.data?.doctor_id || ''));
      setPatients(dataPatients);
      if (dataPatients.length > 0) {
        setForm((prev) => ({
          ...prev,
          patient: String(dataPatients[0].patient_id),
          patient_type: String(dataPatients[0].patient_type || 'appointment').toLowerCase(),
        }));
      }
      setLoading(false);
    }

    load();
  }, []);

  const patientMap = useMemo(() => {
    const map = new Map();
    patients.forEach((p) => map.set(String(p.patient_id), String(p.patient_type || '').toLowerCase()));
    return map;
  }, [patients]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPatientChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      patient: value,
      patient_type: patientMap.get(value) || prev.patient_type,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      ...form,
      doctor_id: doctorId,
    };

    const response = await submitDoctorDiagnosis(payload);
    if (!response.ok) {
      setError(response.data?.message || 'Failed to save diagnosis');
      return;
    }

    setSuccess(response.data?.message || 'Diagnosis saved');
    const redirect = response.data?.redirect;
    if (redirect) {
      navigate(redirect);
    }
  };

  return (
    <DoctorShell title="Diagnosis Entry">
      <section className="card doctor-rx">
        <h3 className="card-title">New Diagnosis</h3>
        {loading && <p className="muted">Loading form...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && (
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <div>
                <label className="field-label" htmlFor="patient">Patient</label>
                <select id="patient" name="patient" value={form.patient} onChange={onPatientChange} required>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.patient_name} ({patient.patient_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="patient_type">Patient Type</label>
                <select id="patient_type" name="patient_type" value={form.patient_type} onChange={onChange} required>
                  <option value="appointment">Appointment</option>
                  <option value="admitted">Admitted</option>
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="diagnosis_date">Diagnosis Date</label>
                <input className="field" id="diagnosis_date" name="diagnosis_date" type="date" value={form.diagnosis_date} onChange={onChange} required />
              </div>

              <div>
                <label className="field-label" htmlFor="follow_up_date">Follow-up Date</label>
                <input className="field" id="follow_up_date" name="follow_up_date" type="date" value={form.follow_up_date} onChange={onChange} />
              </div>

              <div>
                <label className="field-label" htmlFor="diagnosis_name">Diagnosis Name</label>
                <input className="field" id="diagnosis_name" name="diagnosis_name" value={form.diagnosis_name} onChange={onChange} required />
              </div>

              <div>
                <label className="field-label" htmlFor="severity">Severity</label>
                <select id="severity" name="severity" value={form.severity} onChange={onChange}>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="walking">Walking</label>
                <input className="field" id="walking" name="walking" value={form.walking} onChange={onChange} />
              </div>

              <div>
                <label className="field-label" htmlFor="running">Running</label>
                <input className="field" id="running" name="running" value={form.running} onChange={onChange} />
              </div>

              <div>
                <label className="field-label" htmlFor="swimming">Swimming</label>
                <input className="field" id="swimming" name="swimming" value={form.swimming} onChange={onChange} />
              </div>

              <div>
                <label className="field-label" htmlFor="cycling">Cycling</label>
                <input className="field" id="cycling" name="cycling" value={form.cycling} onChange={onChange} />
              </div>

              <div>
                <label className="field-label" htmlFor="yoga">Yoga</label>
                <input className="field" id="yoga" name="yoga" value={form.yoga} onChange={onChange} />
              </div>

              <div>
                <label className="field-label" htmlFor="diet_plan">Diet Plan</label>
                <input className="field" id="diet_plan" name="diet_plan" value={form.diet_plan} onChange={onChange} />
              </div>

              <div className="field-full">
                <label className="field-label" htmlFor="symptoms">Symptoms</label>
                <textarea id="symptoms" name="symptoms" rows={3} value={form.symptoms} onChange={onChange} required />
              </div>

              <div className="field-full">
                <label className="field-label" htmlFor="diagnosis_details">Diagnosis Details</label>
                <textarea id="diagnosis_details" name="diagnosis_details" rows={4} value={form.diagnosis_details} onChange={onChange} required />
              </div>

              <div className="field-full">
                <label className="field-label" htmlFor="notes">Notes</label>
                <textarea id="notes" name="notes" rows={3} value={form.notes} onChange={onChange} />
              </div>
            </div>

            <button className="btn" type="submit">Save Diagnosis</button>
          </form>
        )}
      </section>
    </DoctorShell>
  );
}

export default DoctorDiagnosisPage;

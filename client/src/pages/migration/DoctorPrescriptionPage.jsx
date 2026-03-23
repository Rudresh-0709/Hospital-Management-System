import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DoctorShell from '../../components/migration/DoctorShell';
import {
  getDoctorPrescriptionFormData,
  submitDoctorPrescription,
} from '../../services/doctorApi';
import { getPatientFullName } from '../../utils/patientName';
import '../../styles/doctor-prescription-migrate.css';

function blankMedicine() {
  return { medicine_name: '', dosage: '', time_of_intake: '' };
}

function DoctorPrescriptionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const diagnosisId = searchParams.get('diagnosis_id') || '';
  const patientId = searchParams.get('patient_id') || '';
  const patientType = searchParams.get('patient_type') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patient, setPatient] = useState(null);
  const [rows, setRows] = useState([blankMedicine()]);

  useEffect(() => {
    async function load() {
      if (!diagnosisId || !patientId || !patientType) {
        setError('Missing diagnosis context. Start from diagnosis page.');
        setLoading(false);
        return;
      }

      const response = await getDoctorPrescriptionFormData({
        diagnosis_id: diagnosisId,
        patient_id: patientId,
        patient_type: patientType,
      });

      if (!response.ok) {
        setError(response.data?.message || 'Failed to load prescription form');
        setLoading(false);
        return;
      }

      setPatient(response.data?.patient || null);
      setLoading(false);
    }

    load();
  }, [diagnosisId, patientId, patientType]);

  const setRow = (index, key, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, blankMedicine()]);
  const removeRow = (index) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const medicines = rows.filter((row) => row.medicine_name.trim());
    const response = await submitDoctorPrescription({
      diagnosis_id: diagnosisId,
      patient_id: patientId,
      patient_type: patientType,
      medicines,
    });

    if (!response.ok) {
      setError(response.data?.message || 'Failed to save prescription');
      return;
    }

    setSuccess(response.data?.message || 'Prescription saved');
    setRows([blankMedicine()]);
    setTimeout(() => navigate('/migrate/doctor/dashboard'), 700);
  };

  return (
    <DoctorShell title="Prescription Entry">
      <section className="card doctor-rx">
        <h3 className="card-title">Prescription for Diagnosis</h3>
        {loading && <p className="muted">Loading form...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && !error && (
          <form onSubmit={onSubmit}>
            <p className="muted" style={{ marginTop: 0 }}>
              Patient: {getPatientFullName(patient)}
            </p>

            <div className="table-wrap medicine-table">
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`medicine-${index}`}>
                      <td>
                        <input
                          value={row.medicine_name}
                          onChange={(event) => setRow(index, 'medicine_name', event.target.value)}
                          placeholder="Medicine name"
                          required={index === 0}
                        />
                      </td>
                      <td>
                        <input
                          value={row.dosage}
                          onChange={(event) => setRow(index, 'dosage', event.target.value)}
                          placeholder="Dosage"
                        />
                      </td>
                      <td>
                        <input
                          value={row.time_of_intake}
                          onChange={(event) => setRow(index, 'time_of_intake', event.target.value)}
                          placeholder="Morning / Night"
                        />
                      </td>
                      <td>
                        <button className="mini-btn warn" type="button" onClick={() => removeRow(index)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="toolbar">
              <button className="mini-btn" type="button" onClick={addRow}>+ Add Medicine</button>
              <button className="btn" type="submit">Save Prescription</button>
            </div>
          </form>
        )}
      </section>
    </DoctorShell>
  );
}

export default DoctorPrescriptionPage;

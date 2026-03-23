import { useEffect, useMemo, useState } from 'react';
import DoctorShell from '../../components/migration/DoctorShell';
import {
  getDoctorNewPrescriptionFormData,
  submitDoctorNewPrescription,
} from '../../services/doctorApi';
import '../../styles/doctor-prescription-migrate.css';

function blankMedicine() {
  return { medicine_name: '', dosage: '', time_of_intake: '' };
}

function DoctorNewPrescriptionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [patientType, setPatientType] = useState('appointment');
  const [rows, setRows] = useState([blankMedicine()]);

  useEffect(() => {
    async function load() {
      const response = await getDoctorNewPrescriptionFormData();
      if (!response.ok) {
        setError(response.data?.message || 'Failed to load form');
        setLoading(false);
        return;
      }

      const dataPatients = response.data?.patients || [];
      setPatients(dataPatients);
      if (dataPatients.length) {
        setSelectedPatient(String(dataPatients[0].patient_id));
        setPatientType(String(dataPatients[0].patient_type || 'appointment').toLowerCase());
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

  const onPatientChange = (value) => {
    setSelectedPatient(value);
    setPatientType(patientMap.get(value) || 'appointment');
  };

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
    const response = await submitDoctorNewPrescription({
      patient_id: selectedPatient,
      patient_type: patientType,
      medicines,
    });

    if (!response.ok) {
      setError(response.data?.message || 'Failed to save prescription');
      return;
    }

    setSuccess(response.data?.message || 'Prescription saved');
    setRows([blankMedicine()]);
  };

  return (
    <DoctorShell title="Standalone Prescription Entry">
      <section className="card doctor-rx">
        <h3 className="card-title">New Prescription</h3>
        {loading && <p className="muted">Loading form...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && (
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <div>
                <label className="field-label" htmlFor="patient">Patient</label>
                <select id="patient" value={selectedPatient} onChange={(event) => onPatientChange(event.target.value)} required>
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.patient_name} ({patient.patient_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="patientType">Patient Type</label>
                <select id="patientType" value={patientType} onChange={(event) => setPatientType(event.target.value)}>
                  <option value="appointment">Appointment</option>
                  <option value="admitted">Admitted</option>
                </select>
              </div>
            </div>

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
                    <tr key={`np-medicine-${index}`}>
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

export default DoctorNewPrescriptionPage;

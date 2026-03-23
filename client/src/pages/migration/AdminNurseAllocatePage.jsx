import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/migration/AdminShell';
import {
  assignNurse,
  getAvailableNurses,
  getNurseAllocationOverview,
} from '../../services/adminApi';
import { getPatientFullName } from '../../utils/patientName';

function AdminNurseAllocatePage() {
  const [searchParams] = useSearchParams();
  const preselectedAdmitId = searchParams.get('admit_id') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedAdmitId, setSelectedAdmitId] = useState('');
  const [nurses, setNurses] = useState([]);
  const [loadingNurses, setLoadingNurses] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    const response = await getNurseAllocationOverview();
    if (!response.ok) {
      setError(response.data?.message || 'Failed to load patient allocation list');
      setPatients([]);
      setLoading(false);
      return;
    }

    setPatients(response.data.patients || []);
    if (response.data.flashMessage) {
      setSuccess(response.data.flashMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (preselectedAdmitId) {
      findNurses(preselectedAdmitId);
    }
  }, [preselectedAdmitId]);

  const findNurses = async (admitId) => {
    setSelectedAdmitId(admitId);
    setLoadingNurses(true);
    setError('');
    setSuccess('');

    const response = await getAvailableNurses(admitId);
    setLoadingNurses(false);

    if (!response.ok) {
      setError(response.data?.message || 'Failed to load available nurses');
      setNurses([]);
      return;
    }

    setNurses(response.data.nurses || []);
  };

  const onAllocate = async (nurseid) => {
    const response = await assignNurse({ admit_id: selectedAdmitId, nurseid });
    if (!response.ok) {
      setError(response.data?.message || 'Failed to allocate nurse');
      return;
    }

    setSuccess(response.data?.message || 'Nurse allocated successfully!');
    setNurses([]);
    setSelectedAdmitId('');
    await loadPatients();
  };

  return (
    <AdminShell title="Nurse Allocation">
      <section className="card">
        <h3 className="card-title">Patients Requiring Allocation</h3>

        {loading && <p className="muted">Loading patients...</p>}
        {!loading && error && <p className="error">{error}</p>}
        {!loading && success && <p className="success">{success}</p>}

        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Patient History</th>
                  <th>Room No.</th>
                  <th>Doctor Assigned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? patients.map((patient, idx) => (
                  <tr key={`${patient.admit_id || idx}-${idx}`}>
                    <td>{getPatientFullName(patient)}</td>
                    <td>{patient.reason_for_admission}</td>
                    <td>{patient.room_number}</td>
                    <td>{patient.doctor_assigned}</td>
                    <td>
                      <button className="btn" type="button" onClick={() => findNurses(patient.admit_id)}>Find</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5}>No patients require nurse allocation at the moment.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Available Nurses {selectedAdmitId ? `(Admit ID: ${selectedAdmitId})` : ''}</h3>
        {loadingNurses && <p className="muted">Loading nurses...</p>}
        {!loadingNurses && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nurse Name</th>
                  <th>Specialization</th>
                  <th>Shift</th>
                  <th>Role</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {nurses.length > 0 ? nurses.map((nurse, idx) => (
                  <tr key={`${nurse.nurse_id || idx}-${idx}`}>
                    <td>{nurse.name}</td>
                    <td>{nurse.specialization}</td>
                    <td>{nurse.shift}</td>
                    <td>{nurse.role}</td>
                    <td>{nurse.remarks}</td>
                    <td>
                      <button className="btn" type="button" onClick={() => onAllocate(nurse.nurse_id)}>
                        Allocate
                      </button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={6}>Pick a patient and click Find to load available nurses.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default AdminNurseAllocatePage;

import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { decodeVisitQrImage } from '../../services/adminApi';
import '../../styles/visit-qr-ejs.css';

function AdminVisitQrPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [processing, setProcessing] = useState(false);

  const processQr = async () => {
    if (!file) {
      setStatus('Please select an image.');
      setStatusType('error');
      return;
    }

    setProcessing(true);
    setStatus('');
    setStatusType('');

    const response = await decodeVisitQrImage(file);
    setProcessing(false);

    if (!response.ok) {
      setStatus(response.data?.message || 'Error decoding QR code.');
      setStatusType('error');
      return;
    }

    setStatus(response.data?.message || 'Visit recorded successfully.');
    setStatusType('success');
  };

  return (
    <AdminShell title="QR Visit">
      <section className="migrate-visitqr-page">
        <div className="migrate-visitqr-container">
          <h3>QR Visit</h3>
          <div className="migrate-visitqr-form">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button type="button" onClick={processQr} disabled={processing}>
              {processing ? 'Decoding...' : 'Upload & Decode'}
            </button>
          </div>
          <p className={`migrate-visitqr-status ${statusType}`}>{status}</p>
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminVisitQrPage;

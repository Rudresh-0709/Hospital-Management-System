import { useState } from 'react';
import AdminShell from '../../components/migration/AdminShell';
import { decodeVisitQrImage } from '../../services/adminApi';
import '../../styles/modern-form-migrate.css';

function AdminVisitQrPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [processing, setProcessing] = useState(false);

  const onFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setStatus('');
    setStatusType('');
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const processQr = async () => {
    if (!file) {
      setStatus('Please select a QR code image first.');
      setStatusType('warning');
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
    setFile(null);
    setPreview(null);
  };

  return (
    <AdminShell title="QR Visit">
      <div className="modern-form-page">
        <div className="form-main">
          <div className="form-header">
            <div className="form-header-content">
              <h1 className="form-title">QR Visit Scanner</h1>
              <p className="form-subtitle">Upload a visitor badge QR code to log the visit automatically.</p>
            </div>
          </div>

          {statusType === 'success' && <div className="form-alert success"><span className="form-alert-icon">✓</span><span>{status}</span></div>}
          {statusType === 'error' && <div className="form-alert error"><span className="form-alert-icon">!</span><span>{status}</span></div>}
          {statusType === 'warning' && <div className="form-alert warning"><span className="form-alert-icon">⚠</span><span>{status}</span></div>}

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Upload QR Code</h3></div>

            <div className="form-field-row full">
              <div>
                <label className="form-label required" htmlFor="qr_file">QR Code Image</label>
                <input
                  id="qr_file"
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={onFileChange}
                  style={{ padding: '10px' }}
                />
              </div>
            </div>

            {preview && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                margin: '12px 0',
                background: 'var(--form-bg-light)',
                borderRadius: '12px',
                border: '2px dashed var(--form-border-line)',
              }}>
                <img src={preview} alt="QR Preview" style={{ maxWidth: '240px', maxHeight: '240px', borderRadius: '8px' }} />
              </div>
            )}

            {!preview && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                margin: '12px 0',
                background: 'var(--form-bg-light)',
                borderRadius: '12px',
                border: '2px dashed var(--form-border-line)',
                color: 'var(--form-text-muted)',
              }}>
                <span style={{ fontSize: '48px', marginBottom: '8px' }}>📷</span>
                <p style={{ margin: 0, fontSize: '14px' }}>Select a QR code image to preview</p>
              </div>
            )}

            <div className="form-button-group right">
              <button
                className="form-button primary"
                type="button"
                onClick={processQr}
                disabled={processing || !file}
              >
                {processing ? 'Decoding...' : '📤 Upload & Decode'}
              </button>
            </div>
          </section>
        </div>

        <aside className="form-aside">
          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">How It Works</h3></div>
            <div className="form-tip-card">
              <strong>Step 1</strong>
              <p>Select a visitor badge QR code image from your device.</p>
            </div>
            <div className="form-tip-card">
              <strong>Step 2</strong>
              <p>Preview the image to ensure it's the correct QR code.</p>
            </div>
            <div className="form-tip-card">
              <strong>Step 3</strong>
              <p>Click "Upload & Decode" to log the visit.</p>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-header"><h3 className="form-section-title">Supported Formats</h3></div>
            <div className="form-info-card">
              <strong>Accepted Image Types</strong>
              <p>PNG, JPG, JPEG, WebP, BMP — maximum 5MB file size recommended.</p>
            </div>
          </section>
        </aside>

        <aside className="form-sidebar">
          <div className="form-sidebar-section">
            <div className="form-sidebar-title">QR Scan</div>
            <div className="form-sidebar-item">📤 Upload badge image</div>
            <div className="form-sidebar-item">🔍 Auto-decode QR</div>
            <div className="form-sidebar-item">✅ Visit logged to DB</div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

export default AdminVisitQrPage;

import { useEffect, useState } from 'react';
import './Toast.css';

/**
 * Toast notification popup component.
 *
 * @param {{ type: 'success'|'error'|'info'|'warning', message: string, onClose: () => void, duration?: number }} props
 */
function Toast({ type = 'info', message, onClose, duration = 4000 }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!message) return;

    const autoClose = setTimeout(() => {
      setExiting(true);
    }, duration);

    return () => clearTimeout(autoClose);
  }, [message, duration]);

  useEffect(() => {
    if (!exiting) return;

    const remove = setTimeout(() => {
      onClose?.();
      setExiting(false);
    }, 400); // match CSS exit animation duration

    return () => clearTimeout(remove);
  }, [exiting, onClose]);

  if (!message) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <div className="toast-overlay">
      <div
        className={`toast-popup toast-${type} ${exiting ? 'toast-exit' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`toast-icon-circle toast-icon-${type}`}>
          <span className="toast-icon">{icons[type]}</span>
        </div>
        <div className="toast-body">
          <h4 className="toast-title">{titles[type]}</h4>
          <p className="toast-message">{message}</p>
        </div>
        <button className="toast-close" onClick={() => setExiting(true)} aria-label="Close notification">
          ✕
        </button>
        <div className={`toast-progress toast-progress-${type}`} style={{ animationDuration: `${duration}ms` }} />
      </div>
    </div>
  );
}

export default Toast;

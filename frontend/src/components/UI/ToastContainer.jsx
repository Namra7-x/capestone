import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { Icons } from '../../utils/icons.jsx';

const ICONS = {
  success: Icons.check,
  error: Icons.alertCircle,
  info: Icons.info,
};

function ToastItem({ toast }) {
  const { dismiss } = useToast();
  const [leaving, setLeaving] = useState(false);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => dismiss(toast.id), 180);
  };

  return (
    <div
      className={`toast toast-${toast.type}${leaving ? ' leaving' : ''}`}
      role="status"
      onClick={handleDismiss}
    >
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button className="icon-btn" style={{ width: 22, height: 22 }} aria-label="Dismiss notification">
        {Icons.x}
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // let individual toasts handle their own dismissal
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

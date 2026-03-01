import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onDismiss?: () => void;
}

export default function Toast({ message, type = 'success', onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div
      data-testid="success-toast"
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 text-white shadow-lg transition-all ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <span>{message}</span>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="ml-2 text-white/80 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

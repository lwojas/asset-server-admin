import { useToast } from "../hooks/useToast.jsx";
import { CloseIcon } from "./icons.jsx";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast tone-${toast.tone}`}>
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
          >
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

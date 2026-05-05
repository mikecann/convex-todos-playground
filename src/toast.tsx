import { useCallback, useMemo, useRef, useState } from "react";
import {
  ToastContext,
  type Toast,
  type ToastApi,
  type ToastKind,
} from "./toast-context";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      const ttl = kind === "error" ? 7000 : 4000;
      setTimeout(() => dismiss(id), ttl);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      error: (m) => show("error", m),
      success: (m) => show("success", m),
      info: (m) => show("info", m),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const styles: Record<ToastKind, string> = {
    error: "border-rose-400/40 bg-rose-500/15 text-rose-100",
    success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
    info: "border-sky-400/40 bg-sky-500/15 text-sky-100",
  };
  const icons: Record<ToastKind, string> = {
    error: "!",
    success: "✓",
    info: "i",
  };
  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      className={`pointer-events-auto animate-fade-in flex items-start gap-3 rounded-xl border ${styles[toast.kind]} backdrop-blur-md shadow-lg px-3 py-2.5`}
    >
      <div
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
          toast.kind === "error"
            ? "bg-rose-400/20 text-rose-200"
            : toast.kind === "success"
              ? "bg-emerald-400/20 text-emerald-200"
              : "bg-sky-400/20 text-sky-200"
        }`}
      >
        {icons[toast.kind]}
      </div>
      <p className="flex-1 text-sm leading-snug whitespace-pre-wrap">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-white/40 hover:text-white text-base leading-none"
      >
        ×
      </button>
    </div>
  );
}

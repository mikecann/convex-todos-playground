import { createContext, useContext } from "react";

export type ToastKind = "error" | "success" | "info";

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export type ToastApi = {
  show: (kind: ToastKind, message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
  info: (message: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

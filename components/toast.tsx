"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

type ToastVariant = "success" | "error"

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** Milliseconds before auto-dismiss. 0 keeps it up until dismissed. */
  duration?: number
}

interface Toast extends ToastOptions {
  id: number
}

const DEFAULT_DURATION = 5000

const ToastContext = createContext<((options: ToastOptions) => void) | null>(
  null
)

export function useToast() {
  const showToast = useContext(ToastContext)
  if (!showToast) {
    throw new Error("useToast must be used inside <ToastProvider>")
  }
  return showToast
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-accent/60",
  error: "border-red-500/60",
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "error") {
    return (
      <svg
        className="w-5 h-5 text-red-500 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    )
  }

  return (
    <svg
      className="w-5 h-5 text-accent shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++
      setToasts((current) => [...current, { ...options, id }])

      const duration = options.duration ?? DEFAULT_DURATION
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        )
      }
    },
    [dismiss]
  )

  // Clear any timers still pending if the tree unmounts mid-toast.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      <div
        // `aria-live` on the container (not the toast) so screen readers
        // announce toasts that are inserted after the page has settled.
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border bg-theme-card p-4 shadow-lg ${
              VARIANT_STYLES[toast.variant ?? "success"]
            }`}
          >
            <ToastIcon variant={toast.variant ?? "success"} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-theme-primary">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-sm text-theme-secondary">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 -m-1 p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-hover transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

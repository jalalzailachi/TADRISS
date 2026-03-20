'use client';

import { useState, useCallback, createContext, useContext } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const ToastContext = createContext<{
  success: (msg: string) => void;
  error: (msg: string) => void;
}>({ success: () => {}, error: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = useCallback((type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const success = useCallback((msg: string) => add('success', msg), [add]);
  const error = useCallback((msg: string) => add('error', msg), [add]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-[slideIn_0.3s_ease] ${
              t.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {t.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

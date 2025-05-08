import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    // Evitar duplicar mensajes de error idénticos
    const isDuplicate = toasts.some(toast => 
      toast.message === message && toast.type === type
    );
    
    if (isDuplicate) return;
    
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(toast => toast.id !== id));
    }, duration);
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            minWidth: 220,
            background: toast.type === 'error' ? '#fee2e2' : '#e0fcef',
            color: toast.type === 'error' ? '#b91c1c' : '#166534',
            borderLeft: `6px solid ${toast.type === 'error' ? '#ef4444' : '#22c55e'}`,
            borderRadius: 8,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: 16,
            pointerEvents: 'auto',
            transition: 'all 0.2s',
            opacity: 0.97
          }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

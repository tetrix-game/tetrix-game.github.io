import React, { useState, useEffect } from 'react';
import './ToastOverlay.css';

interface ToastMessage {
  id: number;
  text: string;
}

export const ToastOverlay: React.FC = (): JSX.Element => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect((): (() => void) => {
    const handleShowToast = (event: CustomEvent<{ message: string }>): void => {
      const newToast = {
        id: Date.now(),
        text: event.detail.message,
      };

      setToasts((prev) => [...prev, newToast]);

      // Remove toast after 3 seconds
      setTimeout((): void => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);
    };

    window.addEventListener('tetrix-show-toast', handleShowToast as EventListener);

    return (): void => {
      window.removeEventListener('tetrix-show-toast', handleShowToast as EventListener);
    };
  }, []);

  return (
    <div className="toast-overlay-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-message">
          {toast.text}
        </div>
      ))}
    </div>
  );
};

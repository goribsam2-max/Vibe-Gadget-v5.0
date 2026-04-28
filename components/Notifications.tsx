
import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);

  const notify = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const confirm = (options: ConfirmOptions) => {
    setConfirmModal(options);
  };

  return (
    <ToastContext.Provider value={{ notify, confirm }}>
      {children}
      
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-fit max-w-[240px]">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              className={`pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 border backdrop-blur-md ${
                toast.type === 'success' ? 'bg-zinc-50 dark:bg-zinc-900/95 border-green-100 text-green-700' : 
                toast.type === 'error' ? 'bg-zinc-50 dark:bg-zinc-900/95 border-red-100 text-red-700' : 
                'bg-zinc-50 dark:bg-zinc-900/95 border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-green-50' : 
                toast.type === 'error' ? 'bg-red-50' : 
                'bg-zinc-50 dark:bg-zinc-800'
              }`}>
                <Icon name={toast.type === 'success' ? 'check' : toast.type === 'error' ? 'exclamation' : 'info'} className="text-[7px]" />
              </div>
              <p className="font-bold text-[10px] tracking-tight leading-tight">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 text-center border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xl font-black mb-2 tracking-tight">{confirmModal.title}</h3>
              <p className="text-xs text-zinc-500 font-medium mb-8 leading-relaxed">{confirmModal.message}</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="w-full py-4 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg">
                  {confirmModal.confirmText || 'Confirm'}
                </button>
                <button onClick={() => setConfirmModal(null)} className="w-full py-4 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useNotify must be used within ToastProvider");
  return context.notify;
};

export const useConfirm = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useConfirm must be used within ToastProvider");
  return context.confirm;
};

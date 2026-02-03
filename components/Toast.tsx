import React, { useEffect } from 'react';
import { Check, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto dismiss after 3s
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const baseStyles = "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-500 ease-out transform";
  
  const stateStyles = isVisible 
    ? "translate-y-0 opacity-100 scale-100" 
    : "translate-y-8 opacity-0 scale-95 pointer-events-none";

  const typeStyles = {
    success: "bg-zinc-900/90 border-emerald-500/20 text-zinc-100",
    error: "bg-zinc-900/90 border-red-500/20 text-red-50",
    info: "bg-zinc-900/90 border-zinc-700/50 text-zinc-100"
  };

  const icons = {
    success: <Check size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-indigo-500" />
  };

  return (
    <div className={`${baseStyles} ${stateStyles} ${typeStyles[type]}`}>
      <div className={`p-1 rounded-full bg-white/5`}>
        {icons[type]}
      </div>
      <span className="text-sm font-medium pr-2">{message}</span>
      <button 
        onClick={onClose}
        className="ml-auto p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
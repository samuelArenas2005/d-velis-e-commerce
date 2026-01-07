
import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 z-[200] animate-fade-in-up">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
        type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'
      }`}>
        <CheckCircle2 size={20} className={type === 'success' ? 'text-green-500' : 'text-red-500'} />
        <p className="font-bold text-sm">{message}</p>
        <button onClick={onClose} className="ml-4 p-1 hover:bg-gray-100 rounded-full">
          <X size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default Toast;

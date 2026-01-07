
import React from 'react';
import { ShieldCheck, LayoutDashboard, Package, TrendingUp } from 'lucide-react';
import { AppView } from '../types';

interface AdminFloatingAccessProps {
  pendingOrdersCount: number;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
}

const AdminFloatingAccess: React.FC<AdminFloatingAccessProps> = ({ 
  pendingOrdersCount, 
  activeView, 
  onNavigate 
}) => {
  if (activeView === 'admin') return null;

  return (
    <div className="fixed bottom-6 left-6 z-[90] animate-fade-in-up">
      <div className="group relative">
        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-[#4A3728] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap mb-1">
            Modo Administrador
          </div>
          <div className="bg-white border border-[#EADED2] p-3 rounded-2xl shadow-xl space-y-2 min-w-[180px]">
            <div className="flex justify-between items-center text-[9px] font-bold text-[#8C7A6B] uppercase tracking-tighter">
              <span>Pedidos Pendientes</span>
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pendingOrdersCount}</span>
            </div>
            <div className="h-[1px] bg-[#F3EFEA]" />
            <p className="text-[10px] text-[#4A3728] font-medium leading-tight">Haz clic para gestionar ventas e inventario rápidamente.</p>
          </div>
        </div>

        {/* Floating Button */}
        <button
          onClick={() => onNavigate('admin')}
          className="relative bg-[#7C5E47] hover:bg-[#4A3728] text-white w-14 h-14 rounded-2xl shadow-[0_10px_30px_rgba(124,94,71,0.3)] flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group-hover:rounded-[1.5rem]"
        >
          <ShieldCheck size={28} />
          
          {/* Notification Badge */}
          {pendingOrdersCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#FDFBF9] shadow-md animate-pulse">
              {pendingOrdersCount}
            </span>
          )}
          
          {/* Decorative ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 scale-90 group-hover:scale-100 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default AdminFloatingAccess;

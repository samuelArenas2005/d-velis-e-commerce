
import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, User as UserIcon, ShieldCheck, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  cartCount: number;
  onCartClick: () => void;
  onSearchClick: () => void;
  onLoginClick: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  isSearchActive?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  user, cartCount, onCartClick, onSearchClick, onLoginClick, activeSection, setActiveSection, isSearchActive 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'catalog', label: 'Catálogo' },
    { id: 'about', label: 'Sobre Nosotros' },
    { id: 'contact', label: 'Contacto' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserAction = () => {
    if (user) {
      setIsUserMenuOpen(!isUserMenuOpen);
    } else {
      onLoginClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF9]/90 backdrop-blur-md border-b border-[#EADED2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button className="md:hidden p-2 text-[#4A3728]" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-shrink-0 cursor-pointer" onClick={() => setActiveSection('home')}>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-[#7C5E47] italic">D'Velis</h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all py-2 ${
                  activeSection === item.id ? 'text-[#7C5E47] border-b-2 border-[#7C5E47]' : 'text-[#8C7A6B] hover:text-[#7C5E47]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-1 md:space-x-4">
            <button 
              onClick={onSearchClick} 
              className={`p-2 transition-colors relative ${isSearchActive ? 'text-[#7C5E47]' : 'text-[#4A3728] hover:text-[#7C5E47]'}`}
              title="Buscar velas"
            >
              <Search size={22} />
              {isSearchActive && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#7C5E47] rounded-full border-2 border-[#FDFBF9]" />
              )}
            </button>
            
            <button 
              onClick={onCartClick} 
              className="p-2 text-[#4A3728] hover:text-[#7C5E47] relative group"
              title="Ver mi bolsa"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 transform translate-x-1/2 -translate-y-1/2 bg-[#A68972] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-sm ring-2 ring-[#FDFBF9] animate-fade-in group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={handleUserAction}
                className="flex items-center gap-2 p-1 md:pl-3 bg-white border border-[#EADED2] rounded-full hover:shadow-md transition-all active:scale-95"
                aria-label={user ? `Cuenta de ${user.name}` : 'Iniciar sesión'}
              >
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-[#4A3728] mr-1">
                  {user ? user.name.split(' ')[0] : 'Ingresar'}
                </span>
                {user ? (
                  <div className="w-8 h-8 bg-[#7C5E47] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#7C5E47]">
                    <UserIcon size={16} />
                  </div>
                )}
              </button>

              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#EADED2] overflow-hidden animate-fade-in-up z-[60]">
                  <div className="p-5 bg-[#FDFBF9] border-b border-[#EADED2]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-[#7C5E47] rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.role === 'admin' && (
                          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1 rounded-full border-2 border-white shadow-sm">
                            <ShieldCheck size={10} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#4A3728] text-base truncate">{user.name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#A68972]">{user.role === 'admin' ? 'Gestor d\'velis' : 'Cliente preferencial'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 space-y-2">
                    {user.role === 'admin' && (
                      <div className="p-1">
                        <button 
                          onClick={() => { setActiveSection('admin'); setIsUserMenuOpen(false); }}
                          className="w-full group flex items-center justify-between gap-3 px-4 py-4 bg-[#F3EFEA] border border-[#EADED2] text-[#4A3728] hover:bg-[#7C5E47] hover:text-white rounded-2xl transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <LayoutDashboard size={20} className="text-[#7C5E47] group-hover:text-white" />
                            <span className="text-xs font-black uppercase tracking-widest">Panel de Control</span>
                          </div>
                          <ChevronRight size={16} className="opacity-50 group-hover:opacity-100" />
                        </button>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => { onLoginClick(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut size={18} />
                      Cerrar Sesión
                    </button>
                  </div>
                  
                  <div className="bg-[#FDFBF9] p-3 text-center border-t border-[#EADED2]">
                     <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A68972]">D'Velis Artisanal Candles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-[#FDFBF9] border-b border-[#EADED2] animate-fade-in shadow-xl">
          <div className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setIsMenuOpen(false); }}
                className={`text-left px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                  activeSection === item.id ? 'bg-[#7C5E47] text-white shadow-lg scale-[1.02]' : 'text-[#8C7A6B] hover:bg-[#F3EFEA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

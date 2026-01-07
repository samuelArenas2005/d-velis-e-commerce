
import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { supabase } from '../supabase';

interface LoginOverlayProps {
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onClose, onShowToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        if (onShowToast) {
          onShowToast('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.', 'success');
        }
        setIsRegister(false);
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#FDFBF9] rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full text-center space-y-8 animate-fade-in-up">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[#F3EFEA] rounded-full">
          <X size={24} />
        </button>
        
        <div className="space-y-2 pt-4">
          <div className="w-16 h-16 bg-[#F3EFEA] rounded-full flex items-center justify-center mx-auto text-[#7C5E47] mb-4">
            {isRegister ? <UserPlus size={32} /> : <LogIn size={32} />}
          </div>
          <h2 className="text-3xl font-bold font-serif italic text-[#4A3728]">
            {isRegister ? 'Crear Cuenta' : 'Bienvenido'}
          </h2>
          <p className="text-[#8C7A6B] text-sm leading-relaxed">
            {isRegister ? 'Únete a D\'Velis con tu cuenta personal' : 'Inicia sesión para comprar o gestionar la tienda.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-4 bg-white border border-[#EADED2] rounded-2xl">
                <User size={20} className="text-[#7C5E47]" />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="flex-1 outline-none text-[#4A3728] placeholder-[#8C7A6B]"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 bg-white border border-[#EADED2] rounded-2xl">
              <Mail size={20} className="text-[#7C5E47]" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 outline-none text-[#4A3728] placeholder-[#8C7A6B]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-4 bg-white border border-[#EADED2] rounded-2xl">
              <Lock size={20} className="text-[#7C5E47]" />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="flex-1 outline-none text-[#4A3728] placeholder-[#8C7A6B]"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#7C5E47] hover:bg-[#5A4A3A] text-white p-4 rounded-2xl font-bold transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Cargando...' : (isRegister ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="space-y-4">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#7C5E47] hover:text-[#5A4A3A] text-sm font-medium underline"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>

        <p className="text-[10px] text-[#8C7A6B] leading-tight">
          Al continuar, aceptas que D'Velis acceda a tu nombre y correo electrónico para gestionar tus pedidos.
        </p>
      </div>
    </div>
  );
};

export default LoginOverlay;

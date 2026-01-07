
import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, Send, Info, CreditCard, Banknote, Wallet, Eraser, Ticket, CheckCircle2, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';
import { CONTACT_WHATSAPP } from '../constants';
import { supabase } from '../supabase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (index: number) => void;
  onUpdateQty: (index: number, delta: number) => void;
  onClear: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onRemove, onUpdateQty, onClear }) => {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi' | 'tarjeta'>('nequi');
  const [paymentPercentage, setPaymentPercentage] = useState<50 | 75 | 100>(50);
  
  // Estado para cupones
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, percent: number} | null>(null);
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [couponMessage, setCouponMessage] = useState('');

  // Bloquear el scroll del body cuando el carrito está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const subtotal = items.reduce((acc, item) => acc + (item.finalUnitPrice * item.quantity), 0);
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.percent) / 100 : 0;
  const totalAfterDiscount = subtotal - discountAmount;
  const upfrontPayment = (totalAfterDiscount * paymentPercentage) / 100;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    setCouponStatus('loading');
    setCouponMessage('');

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponInput.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setCouponStatus('error');
        setCouponMessage('Cupón no encontrado o inactivo');
        setAppliedCoupon(null);
      } else if (data.usage_count >= data.usage_limit) {
        setCouponStatus('error');
        setCouponMessage('Este cupón ya alcanzó su límite de uso');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code, percent: data.discount_percent });
        setCouponStatus('success');
        setCouponMessage(`¡Cupón aplicado! -${data.discount_percent}%`);
        setCouponInput('');
      }
    } catch (err) {
      setCouponStatus('error');
      setCouponMessage('Error al validar el cupón');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponStatus('idle');
    setCouponMessage('');
  };

  const handleCheckout = () => {
    const text = `¡Hola D'Velis! 🛍️ Me gustaría hacer un pedido:\n\n` + 
      items.map(i => `- ${i.name} (${i.selectedColor}, ${i.selectedAroma}) x${i.quantity} ($${(i.finalUnitPrice * i.quantity).toLocaleString('es-CO')})`).join('\n') +
      `\n\n*Subtotal:* $${subtotal.toLocaleString('es-CO')}` +
      (appliedCoupon ? `\n*Cupón aplicado:* ${appliedCoupon.code} (-${appliedCoupon.percent}%)` : '') +
      (appliedCoupon ? `\n*Descuento:* -$${discountAmount.toLocaleString('es-CO')}` : '') +
      `\n*Total:* $${totalAfterDiscount.toLocaleString('es-CO')}` +
      `\n\n*Método de Pago:* ${paymentMethod.toUpperCase()}` +
      `\n*Abono Elegido:* ${paymentPercentage}% ($${upfrontPayment.toLocaleString('es-CO')})` +
      `\n\n_Nota: Entiendo que el costo de domicilio varía según mi ubicación._` +
      `\n\n¿Podemos coordinar los detalles del envío? ✅`;
    
    window.open(`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#FDFBF9] shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-6 border-b border-[#EADED2] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#7C5E47]" />
            <h2 className="text-xl font-bold text-[#4A3728]">Tu Bolsa</h2>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button 
                onClick={onClear}
                title="Vaciar Bolsa"
                className="p-2 text-[#A68972] hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
              >
                <Eraser size={18} />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-[#F3EFEA] rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-4">
              <div className="w-24 h-24 bg-[#F3EFEA] rounded-full flex items-center justify-center animate-bounce-short">
                <ShoppingBag size={48} className="text-[#A68972]" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-[#4A3728]">¡Tu bolsa está esperando!</p>
                <p className="text-sm text-[#8C7A6B]">Explora nuestro catálogo y elige las velas que iluminarán tu hogar.</p>
              </div>
              <button 
                onClick={onClose}
                className="bg-[#7C5E47] text-white px-8 py-3 rounded-full font-bold hover:bg-[#634937] transition-all"
              >
                Comenzar a comprar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-[#F3EFEA] hover:shadow-sm transition-shadow">
                  <img 
                    src={item.images[0]} 
                    alt={item.name} 
                    className="w-20 h-20 rounded-xl object-cover border border-[#EADED2]" 
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-[#4A3728] leading-tight text-sm">{item.name}</h3>
                    <p className="text-[10px] text-[#8C7A6B] uppercase tracking-wider font-semibold mt-0.5">
                      {item.selectedColor} • {item.selectedAroma}
                    </p>
                    <p className="text-sm text-[#7C5E47] font-black mt-1">$ {item.finalUnitPrice.toLocaleString('es-CO')}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border border-[#EADED2] rounded-lg overflow-hidden bg-[#FDFBF9]">
                        <button 
                          onClick={() => onUpdateQty(idx, -1)}
                          className="px-2 py-1 bg-[#F3EFEA] hover:bg-[#EADED2] transition-colors font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-black min-w-[30px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQty(idx, 1)}
                          className="px-2 py-1 bg-[#F3EFEA] hover:bg-[#EADED2] transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemove(idx)}
                        className="text-[#A68972] hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-[#EADED2] space-y-6">
                {/* Sección de Cupón */}
                <div className="bg-white border border-[#EADED2] p-4 rounded-2xl shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A3728] mb-3 flex items-center gap-2">
                    <Ticket size={14} className="text-[#7C5E47]" /> Cupón de Descuento
                  </h4>
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Ej: DVELIS10"
                          className="flex-1 px-4 py-2 bg-[#F3EFEA] border border-[#EADED2] rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-[#7C5E47] transition-all"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={couponStatus === 'loading'}
                          className="bg-[#4A3728] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-[#7C5E47] active:scale-95 disabled:opacity-50"
                        >
                          {couponStatus === 'loading' ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponMessage && (
                        <p className={`text-[9px] font-bold flex items-center gap-1 ${couponStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                          {couponStatus === 'error' ? <AlertCircle size={10} /> : <CheckCircle2 size={10} />}
                          {couponMessage}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border border-green-100 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                          {appliedCoupon.code} (-{appliedCoupon.percent}%)
                        </span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-600 p-1">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A3728] mb-4 flex items-center gap-2">
                    <CreditCard size={14} /> Método de Pago
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'nequi', label: 'Nequi', icon: <Wallet size={16} /> },
                      { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={16} /> },
                      { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={16} /> },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === method.id 
                          ? 'border-[#7C5E47] bg-white text-[#7C5E47] shadow-sm' 
                          : 'border-[#F3EFEA] text-[#8C7A6B] hover:border-[#EADED2]'
                        }`}
                      >
                        {method.icon}
                        <span className="text-[9px] font-black mt-1 uppercase">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4A3728] mb-4">Abono Inicial Requerido</h4>
                  <div className="flex gap-2">
                    {[50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => setPaymentPercentage(p as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          paymentPercentage === p 
                          ? 'border-[#7C5E47] bg-[#7C5E47] text-white shadow-md' 
                          : 'border-[#EADED2] text-[#8C7A6B] hover:border-[#7C5E47]'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FFF8F0] p-4 rounded-2xl border border-[#FFE7CC] flex gap-3">
                  <Info className="text-[#E67E22] shrink-0" size={18} />
                  <p className="text-[10px] text-[#8C7A6B] leading-relaxed">
                    <strong className="text-[#4A3728]">Nota:</strong> El costo del envío se calcula por separado según tu ubicación exacta.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#EADED2] bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-[#8C7A6B]">
                <span className="text-xs font-bold uppercase tracking-widest">Valor de la Bolsa</span>
                <span className="font-bold">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-xs font-bold uppercase tracking-widest">Descuento ({appliedCoupon.percent}%)</span>
                  <span className="font-bold">-${discountAmount.toLocaleString('es-CO')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#7C5E47] bg-[#F3EFEA] p-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider">Monto a Abonar ({paymentPercentage}%)</span>
                  {appliedCoupon && (
                    <span className="text-[8px] font-bold text-green-600 uppercase">¡Cupón aplicado al total!</span>
                  )}
                </div>
                <span className="text-2xl font-black">${upfrontPayment.toLocaleString('es-CO')}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl active:scale-95"
            >
              <Send size={20} /> Solicitar por WhatsApp
            </button>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default Cart;

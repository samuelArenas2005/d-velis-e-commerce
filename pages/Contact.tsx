
import React, { useState } from 'react';
import { Phone, MapPin, CreditCard, Send, Instagram, MessageSquare } from 'lucide-react';
import { CONTACT_WHATSAPP, OWNER_NAME, LOCATION } from '../constants';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: ''
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) return;

    // Emojis actualizados para máxima compatibilidad (Vela y Sobre de mensaje)
    const whatsappMessage = `¡Hola D'Velis! 📩 Mi nombre es *${formData.name}*.\n\nMe comunico por el siguiente motivo: *${formData.subject || 'Asesoría General'}*.\n\nMi mensaje es el siguiente:\n"${formData.message}"\n\nQuedo atento(a) a su respuesta. 🕯️`;
    
    window.open(`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid md:grid-cols-2 gap-16 items-start">
        <div className="space-y-10">
          <div>
            <h1 className="text-5xl font-bold mb-6 italic">Conecta con <br />D'Velis</h1>
            <p className="text-[#8C7A6B] text-lg leading-relaxed">
              ¿Tienes una duda, queja o necesitas una asesoría personalizada? Estamos aquí para escucharte y brindarte la mejor atención.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-center p-4 bg-white rounded-2xl border border-[#EADED2] hover:border-[#7C5E47] transition-colors group">
              <div className="w-12 h-12 bg-[#F3EFEA] group-hover:bg-[#7C5E47] group-hover:text-white transition-colors rounded-full flex items-center justify-center text-[#7C5E47]">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">WhatsApp Directo</p>
                <p className="text-lg font-semibold text-[#4A3728]">+57 {CONTACT_WHATSAPP.substring(2)}</p>
              </div>
            </div>

            <div className="flex gap-4 items-center p-4 bg-white rounded-2xl border border-[#EADED2]">
              <div className="w-12 h-12 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#7C5E47]">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">Ubicación Principal</p>
                <p className="text-lg font-semibold text-[#4A3728]">{LOCATION}</p>
              </div>
            </div>

            <div className="flex gap-4 items-center p-4 bg-white rounded-2xl border border-[#EADED2]">
              <div className="w-12 h-12 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#7C5E47]">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider">Medios de Pago</p>
                <p className="text-lg font-semibold text-[#4A3728]">Nequi / Daviplata: {CONTACT_WHATSAPP.substring(2)}</p>
                <p className="text-xs text-[#8C7A6B] font-medium">A nombre de: {OWNER_NAME}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#EADED2]/20 p-8 md:p-12 rounded-[2rem] border border-[#EADED2] shadow-sm">
          <h2 className="text-2xl font-bold mb-8">Envíanos un mensaje rápido</h2>
          <form className="space-y-6" onSubmit={handleSendMessage}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4A3728]">Tu Nombre</label>
                <input 
                  required
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Laura Pérez" 
                  className="w-full px-4 py-3 rounded-xl border border-[#EADED2] bg-white focus:ring-2 focus:ring-[#7C5E47] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#4A3728]">Motivo (Asunto)</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Ej: Asesoría, Reclamo..." 
                  className="w-full px-4 py-3 rounded-xl border border-[#EADED2] bg-white focus:ring-2 focus:ring-[#7C5E47] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4A3728]">Mensaje</label>
              <textarea 
                required
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4} 
                placeholder="Escribe tu consulta aquí..." 
                className="w-full px-4 py-3 rounded-xl border border-[#EADED2] bg-white focus:ring-2 focus:ring-[#7C5E47] focus:border-transparent outline-none transition-all resize-none"
              ></textarea>
            </div>
            <button 
              type="submit"
              className="w-full bg-[#7C5E47] hover:bg-[#634937] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md"
            >
              <MessageSquare size={20} /> Consultar por WhatsApp
            </button>
            <p className="text-[10px] text-center text-[#8C7A6B] font-bold uppercase tracking-widest">
              Tu mensaje se enviará directamente a nuestra línea de atención
            </p>
          </form>
          
          <div className="mt-12 pt-8 border-t border-[#EADED2] flex justify-center gap-6">
            <a href="https://instagram.com" target="_blank" className="text-[#8C7A6B] hover:text-[#7C5E47] flex items-center gap-2 font-medium transition-colors">
              <Instagram size={20} /> @dvelis_artesanal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

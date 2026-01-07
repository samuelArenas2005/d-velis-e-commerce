
import React from 'react';
import { MessageSquare, CreditCard, Package, Truck, Sparkles } from 'lucide-react';
import MagicCandle from '../components/MagicCandle';

const About: React.FC = () => {
  const steps = [
    {
      icon: <MessageSquare className="text-[#7C5E47]" />,
      title: "1. Haz tu pedido",
      desc: "Contáctanos por WhatsApp con tus ideas. Juntos definimos diseño, color y aroma."
    },
    {
      icon: <CreditCard className="text-[#7C5E47]" />,
      title: "2. Abono Inicial",
      desc: "Solicitamos un 50% de abono para asegurar materiales y reservar el tiempo de creación."
    },
    {
      icon: <Package className="text-[#7C5E47]" />,
      title: "3. Elaboración",
      desc: "Tardamos de 5 a 10 días hábiles en crear tus piezas con todo el detalle que merecen."
    },
    {
      icon: <Truck className="text-[#7C5E47]" />,
      title: "4. Entrega y Pago Final",
      desc: "Coordinamos la entrega. Pagas el 50% restante al recibir o previo al envío."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-bold">D'Velis Artisanal</h1>
        <p className="text-[#8C7A6B] text-lg max-w-2xl mx-auto">
          Creamos experiencias luminosas y aromáticas. Cada pieza es elaborada bajo pedido, garantizando exclusividad y frescura.
        </p>
      </div>

      <div className="grid gap-12">
        {/* Seccion Interactiva de la Vela */}
        <section className="bg-[#F3EFEA] rounded-[3rem] p-12 border border-[#EADED2] relative overflow-hidden">
          <div className="absolute top-8 left-8 text-[#A68972] opacity-20">
             <Sparkles size={120} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-2 text-[#4A3728] italic font-serif">Nuestra Esencia</h2>
            <p className="text-[#8C7A6B] text-sm text-center mb-4 max-w-md">
              Encendemos momentos, iluminamos recuerdos. Toca la vela para sentir la calidez de D'Velis.
            </p>
            <MagicCandle />
          </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-3xl border border-[#EADED2] shadow-sm">
          <h2 className="text-2xl font-bold mb-8 text-center">Nuestro Proceso de Compra</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#F3EFEA] rounded-xl flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-[#6B5A4D] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#A68972] text-white p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-4 italic">Ubicación</h3>
            <p className="opacity-90 text-sm leading-relaxed">
              Estamos orgullosamente ubicados en Jamundí, Valle del Cauca. Realizamos entregas personales y envíos nacionales según la zona.
            </p>
          </div>
          <div className="bg-[#EADED2] p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-4 italic text-[#4A3728]">Pagos Seguros</h3>
            <p className="text-[#4A3728]/80 text-sm leading-relaxed">
              Aceptamos transferencias por Nequi y Daviplata para tu comodidad y seguridad.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

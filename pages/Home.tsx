
import React from 'react';
import { ArrowRight, Star, Heart, Clock, Sparkles } from 'lucide-react';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';


interface HomeProps {
  products: Product[];
  onExplore: (category?: Category) => void;
  onProductClick: (product: Product) => void;
}

const Home: React.FC<HomeProps> = ({ products, onExplore, onProductClick }) => {
  // Filtrar productos destacados marcados por el admin
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-candle.webp" 
            alt="Handmade Candles Hero" 
            className="w-full h-full object-cover"
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-[#4A3728]/30 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF9] via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-2xl animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg leading-tight">
              Luz artesanal <br /> <span className="text-[#EADED2]">hecha con amor.</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 opacity-90 font-light leading-relaxed">
              En D'Velis creamos recordatorios únicos y velas decorativas personalizadas para cada momento especial de tu vida.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => onExplore()}
                className="group bg-[#7C5E47] hover:bg-[#634937] text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 transition-all transform hover:translate-x-1"
              >
                Ver Todo el Catálogo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#7C5E47] font-bold mb-2 uppercase tracking-widest text-xs">
              <Sparkles size={14} /> Selección Especial
            </div>
            <h2 className="text-4xl font-bold text-[#4A3728]">Los más destacados</h2>
          </div>
          <button 
            onClick={() => onExplore()}
            className="text-[#7C5E47] font-bold border-b-2 border-transparent hover:border-[#7C5E47] transition-all"
          >
            Ver catálogo completo
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => onProductClick(product)}
                className="cursor-pointer"
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={(p) => onProductClick(p)} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-[#F3EFEA] rounded-[2.5rem] border border-dashed border-[#EADED2]">
             <Star className="mx-auto text-[#A68972] mb-4 opacity-50" size={40} />
             <p className="text-[#4A3728] italic">Explora nuestro catálogo para descubrir nuestras creaciones únicas.</p>
          </div>
        )}
      </section>

      {/* Categories Fast Filter */}
      <section className="bg-[#F3EFEA] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Explora por Categoría</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.values(Category).filter(c => c !== Category.ALL).map(cat => (
              <button
                key={cat}
                onClick={() => onExplore(cat)}
                className="px-8 py-4 bg-white border border-[#EADED2] rounded-2xl hover:shadow-md hover:border-[#7C5E47] transition-all group"
              >
                <p className="font-bold text-[#4A3728] group-hover:text-[#7C5E47]">{cat}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#7C5E47]">
              <Heart size={32} />
            </div>
            <h3 className="text-xl font-bold">100% Personalizado</h3>
            <p className="text-[#4A3728] text-sm leading-relaxed">Elige el diseño, color y aroma que más te gusten para tus velas.</p>
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#7C5E47]">
              <Star size={32} />
            </div>
            <h3 className="text-xl font-bold">Velas Artesanales</h3>
            <p className="text-[#4A3728] text-sm leading-relaxed">Elaboradas a mano con materiales de alta calidad y mucho detalle.</p>
          </div>
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F3EFEA] rounded-full flex items-center justify-center text-[#7C5E47]">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold">Bajo Pedido</h3>
            <p className="text-[#4A3728] text-sm leading-relaxed">Creamos tus velas frescas tras confirmar tu abono (5-10 días hábiles).</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

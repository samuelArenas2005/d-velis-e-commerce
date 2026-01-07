
import React, { useState, useMemo, useEffect } from 'react';
import { Category, Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Search as SearchIcon, MessageSquare, X, FilterX, Sparkles, Zap, Gift } from 'lucide-react';
import { CONTACT_WHATSAPP } from '../constants';

interface CatalogProps {
  products: Product[]; // Recibimos los productos filtrados desde App.tsx
  onAddToCart: (p: Product) => void;
  searchQuery: string;
  onClearSearch?: () => void;
  initialCategory?: Category;
}

const Catalog: React.FC<CatalogProps> = ({ products, onAddToCart, searchQuery, onClearSearch, initialCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(initialCategory || Category.ALL);
  const [customRequest, setCustomRequest] = useState('');
  const categories = Object.values(Category);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === Category.ALL || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRequest.trim()) return;
    const message = `¡Hola D'Velis! 🕯️ Tengo una idea para un diseño personalizado:\n\n"${customRequest}"\n\n¿Podrían decirme si es posible? ✅`;
    window.open(`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header y Categorías */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Nuestro Catálogo</h1>
            <p className="text-[#8C7A6B]">Velas artesanales bajo pedido. Elige tu diseño favorito.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat ? 'bg-[#7C5E47] text-white shadow-md' : 'bg-white text-[#8C7A6B] border border-[#EADED2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {searchQuery && (
          <div className="bg-[#F3EFEA] border border-[#EADED2] p-4 rounded-2xl mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <SearchIcon size={20} className="text-[#7C5E47]" />
               <p className="text-lg font-serif italic font-bold text-[#4A3728]">"{searchQuery}"</p>
            </div>
            <button onClick={onClearSearch} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-bold border border-[#EADED2]">
              <X size={16} /> Borrar
            </button>
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-[#EADED2] max-w-2xl mx-auto">
            <FilterX className="text-[#A68972] mx-auto mb-6" size={40} />
            <h3 className="text-2xl font-bold text-[#4A3728] mb-2">No encontramos resultados</h3>
            <button onClick={onClearSearch} className="px-8 py-3 bg-[#7C5E47] text-white rounded-full font-bold">Ver todas</button>
          </div>
        )}

        {/* Banner de Precio Mayorista */}
        <div className="bg-gradient-to-r from-[#F3EFEA] to-white border border-[#EADED2] p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in mt-12">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-[#7C5E47] rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
              <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-[#4A3728] uppercase tracking-tighter text-lg">Beneficio Mayorista D'Velis</p>
              <p className="text-[#8C7A6B] text-sm">Por la compra de <span className="text-[#7C5E47] font-bold">12 unidades o más</span> del mismo producto, accede automáticamente a precios de mayorista.</p>
            </div>
          </div>
          <div className="bg-[#25D366]/10 text-[#128C7E] px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-[#25D366]/20">
            ¡Ahorra hasta un 30%!
          </div>
        </div>
      </div>

      {/* Sección Personalización Rediseñada - Responsive Update */}
      <div className="relative overflow-hidden bg-[#FDFBF9] rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 border border-[#EADED2] max-w-4xl mx-auto shadow-[0_20px_50px_rgba(124,94,71,0.1)] group">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 p-8 text-[#EADED2] opacity-20 pointer-events-none group-hover:rotate-12 transition-transform duration-1000 hidden sm:block">
          <Sparkles size={200} />
        </div>
        <div className="absolute -bottom-10 -left-10 p-8 text-[#EADED2] opacity-10 pointer-events-none hidden sm:block">
          <Gift size={150} />
        </div>

        <div className="relative z-10 text-center space-y-6 sm:space-y-8">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[#A68972] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Servicio Personalizado</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif italic font-bold text-[#4A3728]">¿Tienes una idea en mente?</h2>
            <p className="text-[#8C7A6B] text-sm sm:text-base max-w-lg mx-auto leading-relaxed px-2 sm:px-0">
              Si no encuentras el diseño perfecto, ¡lo creamos para ti! Cuéntanos tu idea para recordatorios o decoración especial.
            </p>
          </div>

          <form onSubmit={handleCustomRequest} className="space-y-4 sm:space-y-6 max-w-xl mx-auto">
            <div className="relative">
              <textarea 
                value={customRequest}
                onChange={(e) => setCustomRequest(e.target.value)}
                rows={3}
                placeholder="Describe aquí tu idea de diseño... (Ej: Vela en forma de oso con corona de flores)"
                className="w-full bg-white/80 backdrop-blur-sm border-2 border-[#F3EFEA] rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 outline-none focus:border-[#7C5E47] transition-all shadow-inner text-[#4A3728] placeholder-[#A68972]/60 resize-none text-sm sm:text-base"
              />
              <div className="absolute bottom-3 right-5 sm:bottom-4 sm:right-6 text-[8px] sm:text-[10px] font-bold text-[#A68972] uppercase tracking-widest pointer-events-none">
                Diseño D'Velis
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-[#7C5E47] hover:bg-[#4A3728] text-white py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-lg sm:text-xl flex items-center justify-center gap-3 sm:gap-4 transition-all transform hover:scale-[1.02] active:scale-95 shadow-2xl"
            >
              <MessageSquare size={20} className="sm:w-6 sm:h-6" /> 
              Consultar Personalización
            </button>
            
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#A68972] opacity-60">
              Atención inmediata vía WhatsApp • Jamundí, Valle
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Catalog;

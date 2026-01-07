import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { ChevronLeft, Minus, Plus, ShoppingBag, Sparkles, Droplets, Palette, ChevronRight, Info, Check, Tag, Box } from 'lucide-react';
import ProductCard from '../components/ProductCard';

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onAddToCart: (item: CartItem) => void;
  onProductClick: (p: Product) => void;
}

const DEFAULT_COLORS = ['Blanco'];
const DEFAULT_AROMAS = [ 'Sin Aroma'];
const DEFAULT_PRESENTATIONS = ['Presentación Estándar'];

const ProductDetail: React.FC<ProductDetailProps> = ({ product, allProducts, onBack, onAddToCart, onProductClick }) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  
  const availableColors = product.colors?.length ? product.colors : DEFAULT_COLORS;
  const availableAromas = product.aromas?.length ? product.aromas : DEFAULT_AROMAS;
  const availablePresentations = product.presentationOptions?.length ? product.presentationOptions : DEFAULT_PRESENTATIONS;

  const [color, setColor] = useState(availableColors[0]);
  const [aroma, setAroma] = useState(availableAromas[0]);
  const [presentation, setPresentation] = useState(availablePresentations[0]);

  const isBulk = product.bulkPrice && quantity >= product.bulkPrice.threshold;
  const unitPrice = isBulk ? product.bulkPrice!.price : product.price;
  const totalPrice = unitPrice * quantity;
  
  const discountPercentage = product.bulkPrice 
    ? Math.round((1 - product.bulkPrice.price / product.price) * 100) 
    : 0;

  // SEO dinámico: actualizar título, meta descripción y etiquetas sociales según el producto
  useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const previousDescription = metaDescription?.getAttribute('content') || '';

    const ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    const previousOgTitle = ogTitle?.getAttribute('content') || '';

    const ogDescription = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    const previousOgDescription = ogDescription?.getAttribute('content') || '';

    const ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    const previousOgUrl = ogUrl?.getAttribute('content') || '';

    const twitterTitle = document.querySelector('meta[property="twitter:title"]') as HTMLMetaElement | null;
    const previousTwitterTitle = twitterTitle?.getAttribute('content') || '';

    const twitterDescription = document.querySelector('meta[property="twitter:description"]') as HTMLMetaElement | null;
    const previousTwitterDescription = twitterDescription?.getAttribute('content') || '';

    const canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const previousCanonical = canonicalLink?.href || '';

    const keywordsText = product.keywords?.length ? product.keywords.join(', ') : '';
    const cleanDescription = (product.description || '').trim();
    const descriptionWithKeywords = keywordsText 
      ? `${cleanDescription} ${keywordsText}`.trim()
      : cleanDescription;
    const seoDescription = descriptionWithKeywords.length > 160 
      ? `${descriptionWithKeywords.slice(0, 157)}...`
      : descriptionWithKeywords || `Vela artesanal personalizada ${product.name} de D'Velis.`;

    const currentUrl = window.location.href;
    
    const metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    const previousKeywords = metaKeywords?.getAttribute('content') || '';

    document.title = `D'Velis | ${product.name}`;
    if (metaDescription) metaDescription.content = seoDescription;
    if (metaKeywords) {
      metaKeywords.content = keywordsText || `velas artesanales, ${product.name}, ${product.category}`;
    } else {
      const newMetaKeywords = document.createElement('meta');
      newMetaKeywords.name = 'keywords';
      newMetaKeywords.content = keywordsText || `velas artesanales, ${product.name}, ${product.category}`;
      document.head.appendChild(newMetaKeywords);
    }
    if (ogTitle) ogTitle.content = `D'Velis | ${product.name}`;
    if (ogDescription) ogDescription.content = seoDescription;
    if (ogUrl) ogUrl.content = currentUrl;
    
    // Meta tag para imagen de Open Graph
    const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
    const previousOgImage = ogImage?.getAttribute('content') || '';
    if (ogImage) {
      ogImage.content = product.images[0] || '';
    } else {
      const newOgImage = document.createElement('meta');
      newOgImage.setAttribute('property', 'og:image');
      newOgImage.content = product.images[0] || '';
      document.head.appendChild(newOgImage);
    }
    
    // Meta tag para imagen de Twitter
    const twitterImage = document.querySelector('meta[property="twitter:image"]') as HTMLMetaElement | null;
    const previousTwitterImage = twitterImage?.getAttribute('content') || '';
    if (twitterImage) {
      twitterImage.content = product.images[0] || '';
    } else {
      const newTwitterImage = document.createElement('meta');
      newTwitterImage.setAttribute('property', 'twitter:image');
      newTwitterImage.content = product.images[0] || '';
      document.head.appendChild(newTwitterImage);
    }
    
    if (twitterTitle) twitterTitle.content = `D'Velis | ${product.name}`;
    if (twitterDescription) twitterDescription.content = seoDescription;
    if (canonicalLink) canonicalLink.href = currentUrl;

    return () => {
      document.title = previousTitle;
      if (metaDescription) metaDescription.content = previousDescription;
      if (metaKeywords) metaKeywords.content = previousKeywords;
      if (ogTitle) ogTitle.content = previousOgTitle;
      if (ogDescription) ogDescription.content = previousOgDescription;
      if (ogUrl) ogUrl.content = previousOgUrl;
      const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
      if (ogImage && previousOgImage) ogImage.content = previousOgImage;
      const twitterImage = document.querySelector('meta[property="twitter:image"]') as HTMLMetaElement | null;
      if (twitterImage && previousTwitterImage) twitterImage.content = previousTwitterImage;
      if (twitterTitle) twitterTitle.content = previousTwitterTitle;
      if (twitterDescription) twitterDescription.content = previousTwitterDescription;
      if (canonicalLink) canonicalLink.href = previousCanonical;
    };
  }, [product]);

  const productStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description + product.keywords?.join(', ') || '',
    image: product.images[0] || '',
    sku: product.id,
    category: product.category,
    keywords: product.keywords?.join(', ') || '',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'COP',
      price: unitPrice,
      availability: 'https://schema.org/InStock',
    },
  };

  // Lógica para productos relacionados
  const relatedProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => 
      p.category === product.category && 
      p.id !== product.id && 
      p.isActive
    ).slice(0, 4); // Mostrar máximo 4 relacionados
  }, [allProducts, product.category, product.id]);

  const handleAdd = () => {
    setIsAdded(true);
    const item: CartItem = {
      ...product,
      quantity,
      selectedColor: color,
      selectedAroma: aroma,
      selectedPresentation: presentation,
      finalUnitPrice: unitPrice
    };
    onAddToCart(item);
    
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 animate-fade-in space-y-24">
      <div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#7C5E47] font-semibold mb-8 hover:translate-x-[-4px] transition-transform"
        >
          <ChevronLeft size={20} /> Volver al catálogo
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Galería de imágenes */}
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-[#EADED2] aspect-square relative group bg-white">
              <img 
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {product.images.length > 1 && (
                <div className="absolute inset-x-4 bottom-4 flex justify-between pointer-events-none">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev > 0 ? prev - 1 : product.images.length - 1)) }}
                    className="pointer-events-auto w-10 h-10 bg-white/80 backdrop-blur shadow-md rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev < product.images.length - 1 ? prev + 1 : 0)) }}
                    className="pointer-events-auto w-10 h-10 bg-white/80 backdrop-blur shadow-md rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === idx ? 'border-[#7C5E47] scale-95 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Información de Producto */}
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[#A68972] uppercase tracking-widest text-[10px] font-black">{product.category}</span>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#4A3728] mt-1 mb-4">{product.name}</h1>
                </div>
              </div>
              <p className="text-[#6B5A4D] text-lg leading-relaxed">{product.description}</p>
              {product.weight && <p className="mt-2 text-sm text-[#4A3728] font-bold">Peso: {product.weight}</p>}
            </div>

            <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 shadow-sm ${isBulk ? 'bg-[#ECFDF5] border-[#10B981]' : 'bg-[#F3EFEA] border-[#EADED2]'}`}>
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isBulk ? 'text-[#065F46]' : 'text-[#8C7A6B]'}`}>
                    {isBulk ? 'Precio Mayorista' : 'Precio Unitario'}
                  </span>
                  {isBulk && (
                    <div className="flex items-center gap-1 text-[#10B981] font-bold text-[10px] uppercase tracking-tighter animate-bounce-short">
                      <Tag size={10} /> ¡Ahorro aplicado!
                    </div>
                  )}
                </div>

                <div className="text-right">
                  {isBulk ? (
                    <div className="flex flex-col items-end animate-in fade-in zoom-in duration-300">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-lg line-through text-red-400 font-bold opacity-70">
                          ${product.price.toLocaleString('es-CO')}
                        </span>
                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                          -{discountPercentage}%
                        </span>
                      </div>
                      <span className="text-5xl font-black text-[#10B981] tracking-tighter">
                        ${unitPrice.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-4xl font-black text-[#7C5E47] tracking-tighter">
                      ${unitPrice.toLocaleString('es-CO')}
                    </span>
                  )}
                </div>
              </div>
              
              {product.bulkPrice && !isBulk && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest w-fit px-3 py-1 rounded-full mt-4 bg-white/50 text-[#7C5E47] border border-[#EADED2]/50">
                  <Sparkles size={12} className="text-amber-500" />
                  Lleva {product.bulkPrice.threshold} uds. y paga solo ${product.bulkPrice.price.toLocaleString('es-CO')} c/u
                </div>
              )}
              {isBulk && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest w-fit px-3 py-1 rounded-full mt-4 bg-[#10B981] text-white shadow-sm">
                  <Check size={12} /> Descuento Mayorista Activado
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4A3728] mb-4">
                  <Box size={14} /> Presentación
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePresentations.map(p => (
                    <button
                      key={p}
                      onClick={() => setPresentation(p)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                        presentation === p ? 'bg-[#7C5E47] text-white border-[#7C5E47] shadow-lg scale-105' : 'bg-white text-[#8C7A6B] border-[#EADED2] hover:border-[#7C5E47]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4A3728] mb-4">
                  <Palette size={14} /> Color de la cera
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                        color === c ? 'bg-[#7C5E47] text-white border-[#7C5E47] shadow-lg scale-105' : 'bg-white text-[#8C7A6B] border-[#EADED2] hover:border-[#7C5E47]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#4A3728] mb-4">
                  <Droplets size={14} /> Aroma de esencia
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableAromas.map(a => (
                    <button
                      key={a}
                      onClick={() => setAroma(a)}
                      className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                        aroma === a ? 'bg-[#4A3728] text-white border-[#4A3728] shadow-lg scale-105' : 'bg-white text-[#8C7A6B] border-[#EADED2] hover:border-[#7C5E47]'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-8 py-6 border-y border-[#EADED2]">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#4A3728]">Cantidad</label>
                  <div className="flex items-center border-2 border-[#EADED2] rounded-2xl overflow-hidden bg-white w-fit shadow-inner">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 hover:bg-[#F3EFEA] transition-colors"><Minus size={18} /></button>
                    <span className="px-6 font-black text-xl min-w-[60px] text-center text-[#7C5E47]">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="p-3 hover:bg-[#F3EFEA] transition-colors"><Plus size={18} /></button>
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-[#4A3728] mb-1">Total acumulado</p>
                  <p className={`text-4xl font-black tracking-tighter transition-colors ${isBulk ? 'text-[#10B981]' : 'text-[#4A3728]'}`}>
                    ${totalPrice.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleAdd}
                disabled={isAdded}
                className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl transition-all transform active:scale-95 ${
                  isAdded 
                  ? 'bg-[#25D366] text-white animate-pulse' 
                  : 'bg-[#7C5E47] hover:bg-[#634937] text-white hover:shadow-xl'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={28} className="animate-bounce" />
                    ¡Añadido con éxito!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={28} />
                    Agregar a mi Bolsa
                  </>
                )}
              </button>
              
              <div className="flex gap-3 p-4 bg-[#F3EFEA] rounded-2xl border border-[#EADED2]">
                <Info className="text-[#A68972] shrink-0" size={18} />
                <p className="text-[11px] text-[#6B5A4D] leading-relaxed italic">
                  Cada una de nuestras velas es elaborada a mano con amor. El color y acabado pueden variar ligeramente, lo que hace que tu pieza sea única y especial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Otros productos que te pueden interesar */}
      {relatedProducts.length > 0 && (
        <section className="pt-16 border-t border-[#EADED2] space-y-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#7C5E47] font-black text-[10px] uppercase tracking-widest">
              <Sparkles size={14} /> Recomendaciones
            </div>
            <h2 className="text-3xl font-serif italic font-bold text-[#4A3728]">Otros productos que te pueden interesar</h2>
            <p className="text-[#4A3728] text-sm">Más creaciones únicas de nuestra categoría de <strong>{product.category}</strong>.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(relProduct => (
              <div 
                key={relProduct.id} 
                className="transition-all hover:scale-[1.02] cursor-pointer"
                onClick={() => onProductClick(relProduct)}
              >
                <ProductCard 
                  product={relProduct} 
                  onAddToCart={onProductClick} 
                />
              </div>
            ))}
          </div>
        </section>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out infinite;
        }
      `}} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
    </div>
  );
};

export default ProductDetail;

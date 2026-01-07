
import React from 'react';
import { Product } from '../types';
import { Plus, Info, Share2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const getProductSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = getProductSlug(product.name);
    const url = `${window.location.origin}/productos/${slug}?product=${encodeURIComponent(product.id)}`;
    const shortDescription = product.description.length > 160
      ? `${product.description.slice(0, 157)}...`
      : product.description;
    const shareData = {
      title: `D'Velis - ${product.name}`,
      text: `¡Mira esta vela artesanal de D'Velis! ${product.name}: ${shortDescription}`,
      url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => { });
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('¡Enlace del producto copiado al portapapeles!');
    }
  };

  return (
    <div
      onClick={() => onAddToCart(product)}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-[#EADED2] cursor-pointer flex flex-col h-full"
      itemScope
      itemType="https://schema.org/Product"
    >
      <div className="relative aspect-square overflow-hidden shrink-0">
        <img
          src={product.images[0]}
          alt={product.name}
          itemProp="image"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <span className="bg-[#7C5E47]/90 text-white text-[10px] px-2.5 py-1.5 rounded-full uppercase tracking-wider font-bold backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3
            className="text-lg font-serif font-bold text-[#4A3728] leading-tight group-hover:text-[#7C5E47] transition-colors line-clamp-2"
            title={product.name}
          >
            <span itemProp="name">{product.name}</span>
          </h3>
          <span className="text-[#7C5E47] font-bold shrink-0 text-lg" itemProp="offers" itemScope itemType="https://schema.org/Offer">
            <meta itemProp="priceCurrency" content="COP" />
            <span itemProp="price">
              {product.price.toLocaleString('es-CO')}
            </span>
          </span>
        </div>

        {product.weight && (
          <p className="text-[10px] text-[#4A3728] mb-3 font-semibold uppercase tracking-widest opacity-60">Peso: {product.weight}</p>
        )}

        <p
          className="text-sm text-[#4A3728]/80 line-clamp-3 mb-4 leading-relaxed"
          itemProp="description"
        >
          {product.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#F3EFEA]">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#7C5E47] flex items-center gap-1">
              <Info size={12} /> Ver detalles
            </span>
            <button
              onClick={handleShare}
              className="text-[#7C5E47] hover:text-[#4A3728] transition-all p-1.5 rounded-full hover:bg-[#F3EFEA]"
              title="Compartir producto"
            >
              <Share2 size={14} />
            </button>
          </div>
          <div className="bg-[#7C5E47] text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
            <Plus size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

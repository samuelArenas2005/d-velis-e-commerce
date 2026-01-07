
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Image as ImageIcon, 
  X as CloseIcon, 
  Upload, 
  Loader2,
  AlertTriangle,
  Star,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  SearchX,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Weight,
  Mail,
  Box,
  User as UserIcon,
  Tag,
  Ticket,
  Percent,
  Hash
} from 'lucide-react';
import { Product, Order, User, Category } from '../types';
import { supabase } from '../supabase';

// Utility function to generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] / 255) * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  users: User[];
  maybeRLSProfiles?: boolean;
  onSaveProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void; 
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
  onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  products, orders, users, maybeRLSProfiles, onSaveProduct, onDeleteProduct, onUpdateOrderStatus, onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'customers' | 'coupons'>('sales');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de cupones
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  // Estados de filtros para Ventas
  const [searchOrderName, setSearchOrderName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');

  // Estados de filtros para Productos
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Estados auxiliares para el formulario
  const [colorString, setColorString] = useState('');
  const [aromaString, setAromaString] = useState('');
  const [presentationString, setPresentationString] = useState('');
  const [keywordsString, setKeywordsString] = useState('');
  const [tempImages, setTempImages] = useState<string[]>([]);

  useEffect(() => {
    if (editingProduct) {
      setColorString(editingProduct.colors?.join(', ') || '');
      setAromaString(editingProduct.aromas?.join(', ') || '');
      setPresentationString(editingProduct.presentationOptions?.join(', ') || '');
      setKeywordsString(editingProduct.keywords?.join(', ') || '');
      setTempImages(editingProduct.images || []);
    }
  }, [editingProduct?.id]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
  };

  const totalSales = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesName = order.userName.toLowerCase().includes(searchOrderName.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesMinPrice = minPrice === '' || order.total >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || order.total <= Number(maxPrice);
      return matchesName && matchesStatus && matchesMinPrice && matchesMaxPrice;
    });
  }, [orders, searchOrderName, statusFilter, minPrice, maxPrice]);

  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return products;
    const query = searchProductQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [products, searchProductQuery]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      await fetchCoupons();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const uploadedUrls: string[] = [...tempImages];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateUUID()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error } = await supabase.storage.from('imagenes productos').upload(filePath, file);
      
      if (error) {
        console.error("Error subiendo imagen:", error);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('imagenes productos').getPublicUrl(filePath);
      uploadedUrls.push(publicUrl);
    }
    
    setTempImages(uploadedUrls);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const finalProduct: Product = {
        ...(editingProduct as Product),
        images: tempImages,
        colors: colorString.split(',').map(s => s.trim()).filter(s => s !== ''),
        aromas: aromaString.split(',').map(s => s.trim()).filter(s => s !== ''),
        presentationOptions: presentationString.split(',').map(s => s.trim()).filter(s => s !== ''),
        keywords: keywordsString.split(',').map(s => s.trim()).filter(s => s !== ''),
        isFeatured: editingProduct.isFeatured || false,
        isActive: editingProduct.isActive !== false,
        bulkPrice: editingProduct.bulkPrice?.price ? {
          threshold: editingProduct.bulkPrice?.threshold || 12,
          price: editingProduct.bulkPrice?.price
        } : undefined
      };
      onSaveProduct(finalProduct);
      setEditingProduct(null);
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCouponLoading(true);
    const { error } = await supabase.from('coupons').upsert({
      id: editingCoupon.id,
      code: editingCoupon.code.toUpperCase(),
      discount_percent: editingCoupon.discount_percent,
      usage_limit: editingCoupon.usage_limit,
      is_active: editingCoupon.is_active
    });
    
    if (!error) {
      fetchCoupons();
      setEditingCoupon(null);
    }
    setIsCouponLoading(false);
  };

  const toggleCouponStatus = async (coupon: any) => {
    await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cupón?')) {
      await supabase.from('coupons').delete().eq('id', id);
      fetchCoupons();
    }
  };

  const handleNewProduct = () => {
    setTempImages([]);
    setColorString('');
    setAromaString('');
    setPresentationString('');
    setKeywordsString('');
    setEditingProduct({
      id: generateUUID(), 
      name: '', 
      description: '', 
      price: 0, 
      category: Category.SPECIAL, 
      images: [], 
      colors: [], 
      aromas: [],
      presentationOptions: [],
      keywords: [],
      isFeatured: false,
      isActive: true,
      weight: '',
      bulkPrice: { threshold: 12, price: 0 }
    });
  };

  const handleNewCoupon = () => {
    setEditingCoupon({
      code: '',
      discount_percent: 10,
      usage_limit: 100,
      is_active: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        {/* Navegación lateral */}
        <div className="w-full md:w-64 space-y-2">
          <h1 className="text-2xl font-bold mb-6 italic font-serif text-[#4A3728]">Panel Admin</h1>
          {[
            { id: 'sales', label: 'Ventas y Pedidos', icon: <BarChart3 size={18} /> },
            { id: 'products', label: 'Inventario', icon: <Package size={18} /> },
            { id: 'coupons', label: 'Cupones', icon: <Ticket size={18} /> },
            { id: 'customers', label: 'Clientes', icon: <Users size={18} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-[#7C5E47] text-white shadow-md scale-[1.02]' : 'text-[#8C7A6B] hover:bg-[#F3EFEA]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div className="pt-6">
            <button 
              onClick={handleRefresh}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-[#A68972] hover:text-[#7C5E47] py-2 border border-dashed border-[#EADED2] rounded-xl transition-all"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Sincronizar Datos
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 space-y-8 animate-fade-in">
          
          {/* SECCIÓN VENTAS */}
          {activeTab === 'sales' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-[#EADED2] shadow-sm">
                  <div className="text-[#A68972] mb-1"><TrendingUp size={20} /></div>
                  <p className="text-sm font-bold text-[#8C7A6B] uppercase tracking-wider">Ventas Totales</p>
                  <p className="text-3xl font-black text-[#7C5E47]">${totalSales.toLocaleString('es-CO')}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-[#EADED2] shadow-sm">
                  <div className="text-[#A68972] mb-1"><Clock size={20} /></div>
                  <p className="text-sm font-bold text-[#8C7A6B] uppercase tracking-wider">Pendientes</p>
                  <p className="text-3xl font-black text-[#4A3728]">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-[#EADED2] shadow-sm">
                  <div className="text-[#A68972] mb-1"><CheckCircle2 size={20} /></div>
                  <p className="text-sm font-bold text-[#8C7A6B] uppercase tracking-wider">Completados</p>
                  <p className="text-3xl font-black text-[#25D366]">{orders.filter(o => o.status === 'completed').length}</p>
                </div>
              </div>

              <div className="bg-[#F3EFEA] p-6 rounded-[2rem] border border-[#EADED2] shadow-inner space-y-4">
                <div className="flex items-center gap-2 text-[#7C5E47] font-bold text-xs uppercase tracking-widest mb-2">
                  <Filter size={14} /> Filtrar Historial
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A68972]" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar por cliente..."
                      value={searchOrderName}
                      onChange={(e) => setSearchOrderName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#EADED2] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C5E47] transition-all"
                    />
                  </div>
                  <div>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white border border-[#EADED2] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C5E47] transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Solo Pendientes</option>
                      <option value="completed">Solo Completados</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      placeholder="Min $"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-1/2 px-4 py-3 bg-white border border-[#EADED2] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C5E47] transition-all"
                    />
                    <input 
                      type="number"
                      placeholder="Max $"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-1/2 px-4 py-3 bg-white border border-[#EADED2] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7C5E47] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-[#EADED2] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#EADED2] flex justify-between items-center">
                  <h2 className="font-bold text-lg">Historial de Pedidos</h2>
                  <span className="text-[10px] font-black uppercase text-[#8C7A6B] tracking-widest bg-[#F3EFEA] px-3 py-1 rounded-full">
                    Mostrando {filteredOrders.length} resultados
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F3EFEA] text-[10px] uppercase tracking-widest text-[#8C7A6B]">
                      <tr>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan={5} className="p-20 text-center text-[#8C7A6B]">No se encontraron pedidos con estos filtros.</td></tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id} className="border-t border-[#EADED2] hover:bg-[#FDFBF9]">
                            <td className="p-4 font-bold text-[#4A3728]">{order.userName}</td>
                            <td className="p-4 font-black text-[#7C5E47]">${order.total.toLocaleString('es-CO')}</td>
                            <td className="p-4 text-[#8C7A6B] text-xs">
                              {new Date(order.createdAt).toLocaleDateString('es-CO')}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {order.status === 'pending' ? 'Pendiente' : 'Listo'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                                  className="bg-[#7C5E47] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-[#4A3728]"
                                >
                                  Marcar Listo
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN PRODUCTOS */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#4A3728]">Gestión de Velas</h2>
                  <p className="text-xs font-bold text-[#8C7A6B] uppercase mt-1">{filteredProducts.length} velas registradas</p>
                </div>
                <button onClick={handleNewProduct} className="flex items-center gap-2 bg-[#7C5E47] text-white px-6 py-3 rounded-2xl font-bold shadow-lg">
                  <Plus size={20} /> Nueva Vela
                </button>
              </div>

              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A68972]" size={20} />
                <input 
                  type="text" 
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  placeholder="Buscar velas por nombre, categoría o descripción..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#EADED2] rounded-[1.5rem] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className={`bg-white p-5 rounded-[2rem] border border-[#EADED2] flex gap-4 items-center transition-all ${!product.isActive ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                    <div className="relative shrink-0">
                      <img src={product.images[0]} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                      {!product.isActive && (
                        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white">
                           <EyeOff size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black uppercase text-[#A68972] mb-1">{product.category}</p>
                      <p className="font-bold text-[#4A3728] truncate">{product.name}</p>
                      <p className="text-sm text-[#7C5E47] font-black">${product.price.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setEditingProduct(product)} className="p-2.5 text-[#A68972] hover:text-[#7C5E47] bg-white border border-[#F3EFEA] rounded-xl">
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteProduct(product.id)} 
                        className={`p-2.5 rounded-xl border transition-all ${
                          product.isActive ? 'text-red-500 border-red-50 hover:bg-red-50' : 'text-green-500 border-green-50 hover:bg-green-50'
                        }`}
                        title={product.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {product.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN CUPONES */}
          {activeTab === 'coupons' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#4A3728]">Cupones de Descuento</h2>
                  <p className="text-xs font-bold text-[#8C7A6B] uppercase mt-1">{coupons.length} cupones creados</p>
                </div>
                <button onClick={handleNewCoupon} className="flex items-center gap-2 bg-[#7C5E47] text-white px-6 py-3 rounded-2xl font-bold shadow-lg">
                  <Plus size={20} /> Nuevo Cupón
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#EADED2] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F3EFEA] text-[10px] uppercase tracking-widest text-[#8C7A6B]">
                      <tr>
                        <th className="p-6">Código</th>
                        <th className="p-6">Descuento</th>
                        <th className="p-6">Uso (Actual / Límite)</th>
                        <th className="p-6">Estado</th>
                        <th className="p-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {coupons.length === 0 ? (
                        <tr><td colSpan={5} className="p-20 text-center text-[#8C7A6B]">No hay cupones activos. Crea uno para empezar.</td></tr>
                      ) : (
                        coupons.map(coupon => (
                          <tr key={coupon.id} className="border-t border-[#EADED2] hover:bg-[#FDFBF9]">
                            <td className="p-6">
                              <span className="font-black text-[#4A3728] uppercase tracking-widest bg-[#F3EFEA] px-3 py-1 rounded-lg border border-[#EADED2]">
                                {coupon.code}
                              </span>
                            </td>
                            <td className="p-6">
                              <span className="font-black text-[#7C5E47] text-lg">-{coupon.discount_percent}%</span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#4A3728]">{coupon.usage_count}</span>
                                <span className="text-[#A68972]">/</span>
                                <span className="text-[#8C7A6B]">{coupon.usage_limit}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <button 
                                onClick={() => toggleCouponStatus(coupon)}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase transition-colors ${
                                  coupon.is_active ? 'text-green-500' : 'text-red-400'
                                }`}
                              >
                                {coupon.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                {coupon.is_active ? 'Activo' : 'Inactivo'}
                              </button>
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingCoupon(coupon)} className="p-2 text-[#A68972] hover:text-[#7C5E47] bg-white border border-[#F3EFEA] rounded-lg">
                                  <Edit3 size={16} />
                                </button>
                                <button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-red-400 hover:text-red-600 bg-white border border-red-50 rounded-lg">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN CLIENTES */}
          {activeTab === 'customers' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-[#4A3728]">Lista de Clientes</h2>
                <p className="text-xs font-bold text-[#8C7A6B] uppercase mt-1">{users.length} usuarios registrados</p>
                
              </div>

              <div className="bg-white rounded-3xl border border-[#EADED2] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F3EFEA] text-[10px] uppercase tracking-widest text-[#8C7A6B]">
                      <tr>
                        <th className="p-6">Usuario</th>
                        <th className="p-6">Rol</th>
                        <th className="p-6">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {users.length === 0 ? (
                        <tr><td colSpan={3} className="p-20 text-center text-[#8C7A6B]">No hay usuarios registrados aún.</td></tr>
                      ) : (
                        users.map(user => (
                          <tr key={user.id} className="border-t border-[#EADED2] hover:bg-[#FDFBF9]">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#7C5E47] rounded-full flex items-center justify-center text-white font-bold">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-[#4A3728]">{user.name}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#8C7A6B] font-medium">
                                    <Mail size={10} />
                                    {user.email || 'Sin correo asociado'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-[#F3EFEA] text-[#8C7A6B]'
                              }`}>
                                {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                              </span>
                            </td>
                            <td className="p-6">
                              <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-green-500">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Activo
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CUPONES */}
      {editingCoupon && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingCoupon(null)} />
          <div className="relative bg-[#FDFBF9] rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold font-serif italic text-[#4A3728]">
                {editingCoupon.id ? 'Editar Cupón' : 'Nuevo Cupón'}
              </h3>
              <button onClick={() => setEditingCoupon(null)} className="p-2 hover:bg-[#F3EFEA] rounded-full transition-colors">
                <CloseIcon size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} /> Código del Cupón
                </label>
                <input 
                  required 
                  placeholder="Ej: NAVIDAD20"
                  value={editingCoupon.code} 
                  onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value.toUpperCase()})} 
                  className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none font-black tracking-widest" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest flex items-center gap-2">
                    <Percent size={12} /> Descuento (%)
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1" max="100"
                    value={editingCoupon.discount_percent} 
                    onChange={e => setEditingCoupon({...editingCoupon, discount_percent: parseInt(e.target.value) || 0})} 
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#8C7A6B] uppercase tracking-widest flex items-center gap-2">
                    <Users size={12} /> Límite de Uso
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={editingCoupon.usage_limit} 
                    onChange={e => setEditingCoupon({...editingCoupon, usage_limit: parseInt(e.target.value) || 0})} 
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none font-bold" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button type="submit" disabled={isCouponLoading} className="flex-1 bg-[#7C5E47] hover:bg-[#4A3728] text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 disabled:opacity-50">
                  {isCouponLoading ? 'Guardando...' : 'Guardar Cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PRODUCTO (Existente) */}
      {editingProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
          <div className="relative bg-[#FDFBF9] rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold font-serif italic text-[#4A3728]">
                {editingProduct.id ? 'Editar Vela' : 'Nueva Creación'}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-[#F3EFEA] rounded-full transition-colors">
                <CloseIcon size={24} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-8">
              {/* Sección Imágenes */}
              <div className="space-y-4">
                <label className="text-xs font-black text-[#8C7A6B] uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon size={14} /> Galería de Imágenes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {tempImages.map((url, idx) => (
                    <div key={idx} className="relative aspect-square group">
                      <img src={url} className="w-full h-full object-cover rounded-2xl border border-[#EADED2]" alt="" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={async () => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    disabled={isUploading}
                    className="aspect-square rounded-2xl border-2 border-dashed border-[#EADED2] flex flex-col items-center justify-center text-[#A68972] hover:bg-[#F3EFEA] hover:border-[#7C5E47] transition-all"
                  >
                    {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
                    <span className="text-[10px] font-bold mt-2 uppercase">Subir</span>
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
              </div>

              {/* Datos básicos */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Nombre de la Vela</label>
                  <input 
                    required 
                    value={editingProduct.name || ''} 
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none focus:ring-2 focus:ring-[#7C5E47]" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Categoría</label>
                  <select 
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none focus:ring-2 focus:ring-[#7C5E47] bg-white"
                  >
                    {Object.values(Category).filter(c => c !== Category.ALL).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Precio Unitario ($)</label>
                  <input 
                    type="number" 
                    required 
                    value={editingProduct.price || ''} 
                    onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} 
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Precio x Mayor ($)</label>
                  <input 
                    type="number" 
                    value={editingProduct.bulkPrice?.price || ''} 
                    onChange={e => setEditingProduct({
                      ...editingProduct, 
                      bulkPrice: { 
                        threshold: editingProduct.bulkPrice?.threshold || 12, 
                        price: parseInt(e.target.value) || 0 
                      }
                    })} 
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Mínimo Mayorista (Uds)</label>
                  <input 
                    type="number" 
                    value={editingProduct.bulkPrice?.threshold || ''} 
                    onChange={e => setEditingProduct({
                      ...editingProduct, 
                      bulkPrice: { 
                        price: editingProduct.bulkPrice?.price || 0, 
                        threshold: parseInt(e.target.value) || 12 
                      }
                    })} 
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#8C7A6B] uppercase">Descripción del Producto</label>
                <textarea 
                  rows={3}
                  value={editingProduct.description || ''} 
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                  className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none resize-none" 
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Peso (Ej: 150g)</label>
                  <div className="relative">
                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A68972]" size={16} />
                    <input 
                      value={editingProduct.weight || ''} 
                      onChange={e => setEditingProduct({...editingProduct, weight: e.target.value})} 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#EADED2] outline-none" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase flex items-center gap-2">
                    <Box size={14} /> Presentaciones (Separar por comas)
                  </label>
                  <input 
                    value={presentationString} 
                    onChange={e => setPresentationString(e.target.value)} 
                    placeholder="Caja de regalo, Sencillo, Bolsa de yute..."
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Colores (Separar por comas)</label>
                  <input 
                    value={colorString} 
                    onChange={e => setColorString(e.target.value)} 
                    placeholder="Blanco, Crema, Rosa..."
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8C7A6B] uppercase">Aromas (Separar por comas)</label>
                  <input 
                    value={aromaString} 
                    onChange={e => setAromaString(e.target.value)} 
                    placeholder="Vainilla, Lavanda..."
                    className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#8C7A6B] uppercase flex items-center gap-2">
                  <Tag size={14} /> Palabras Clave SEO (Separar por comas)
                </label>
                <input 
                  value={keywordsString} 
                  onChange={e => setKeywordsString(e.target.value)} 
                  placeholder="velas decorativas, recordatorios jamundi, cera de soja..."
                  className="w-full p-4 rounded-2xl border border-[#EADED2] outline-none" 
                />
              </div>

              {/* Toggles */}
              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setEditingProduct({...editingProduct, isFeatured: !editingProduct.isFeatured})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${editingProduct.isFeatured ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-[#EADED2]'}`}
                >
                  <div className="flex items-center gap-3">
                    <Star size={18} fill={editingProduct.isFeatured ? 'currentColor' : 'none'} />
                    <span className="text-sm font-bold">Producto Destacado</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${editingProduct.isFeatured ? 'bg-amber-500' : 'bg-[#EADED2]'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingProduct.isFeatured ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => setEditingProduct({...editingProduct, isActive: !editingProduct.isActive})}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${editingProduct.isActive !== false ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
                >
                  <div className="flex items-center gap-3">
                    {editingProduct.isActive !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                    <span className="text-sm font-bold">Visible al Público</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${editingProduct.isActive !== false ? 'bg-green-500' : 'bg-red-400'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingProduct.isActive !== false ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>
              </div>

              <div className="flex gap-4 pt-8 border-t border-[#EADED2]">
                <button type="submit" className="flex-1 bg-[#7C5E47] hover:bg-[#4A3728] text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95">
                  Guardar Cambios
                </button>
                <button type="button" onClick={() => setEditingProduct(null)} className="px-8 border border-[#EADED2] rounded-2xl font-bold hover:bg-[#F3EFEA] transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FDFBF9;
          border-radius: 0 2.5rem 2.5rem 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #EADED2;
          border-radius: 10px;
          border: 2px solid #FDFBF9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #A68972;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #EADED2 #FDFBF9;
        }
      `}} />
    </div>
  );
};

export default AdminDashboard;

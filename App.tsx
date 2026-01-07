import React, { useState, useEffect, Suspense } from 'react';
import { Product, CartItem, Category, AppView, User, Order } from './types';
import HeaderComp from './components/Header';
import Cart from './components/Cart';
import AdminDashboard from './components/AdminDashboard';
import LoginOverlay from './components/LoginOverlay';
import Toast from './components/Toast';
import AdminFloatingAccess from './components/AdminFloatingAccess';
import { CONTACT_WHATSAPP, LOCATION } from './constants';
import { supabase } from './supabase';
import { X, Search, Loader2, Instagram, MessageCircle, Music2, MapPin, ArrowLeft } from 'lucide-react';

// Lazy load pages
const Home = React.lazy(() => import('./pages/Home'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));

const CART_STORAGE_KEY = 'dvelis_shopping_cart_v2';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [maybeRLSProfiles, setMaybeRLSProfiles] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Función para cargar el perfil del usuario desde la sesión
  const loadUserFromSession = async (session: any) => {
    if (!session?.user) {
      setCurrentUser(null);
      return;
    }

    // Función helper para determinar el rol
    const determineRole = (profileRole?: string, userMetadata?: any): 'admin' | 'customer' => {
      // Primero intentar desde el perfil
      if (profileRole) {
        const normalized = String(profileRole).toLowerCase().trim();
        if (normalized === 'admin') return 'admin';
      }
      
      // Intentar desde los metadatos del usuario (app_metadata o user_metadata)
      if (userMetadata?.role) {
        const normalized = String(userMetadata.role).toLowerCase().trim();
        if (normalized === 'admin') return 'admin';
      }
      
      // Por defecto customer
      return 'customer';
    };

    try {
      let profile = null;
      let profileError = null;

      // Intentar leer el perfil
      try {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        profile = result.data;
        profileError = result.error;
      } catch (err: any) {
        profileError = err;
        console.warn('Error reading profile (RLS may be blocking):', err);
      }

      // Si hay error pero no es "not found", puede ser RLS
      const isRLSError = profileError && (
        profileError.code === '42501' || // RLS policy violation
        profileError.code === 'PGRST301' || // Not Acceptable (406)
        profileError.message?.includes('row-level security') ||
        profileError.message?.includes('policy')
      );

      if (profile) {
        // Perfil encontrado exitosamente
        const normalizedRole = typeof profile.role === 'string' 
          ? profile.role.toLowerCase().trim() 
          : String(profile.role || '').toLowerCase().trim();
        const userRole = normalizedRole === 'admin' ? 'admin' : 'customer';
        
        /* console.log('Profile loaded successfully:', {
          id: profile.id,
          name: profile.full_name,
          email: session.user.email,
          rawRole: profile.role,
          finalRole: userRole
        }); */
        
        const userData = {
          id: profile.id,
          name: profile.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          role: userRole
        };
        
        setCurrentUser(userData);
        return;
      }

      // Si hay error RLS o no se encontró perfil, usar datos de la sesión
      if (isRLSError || !profile) {
        console.warn('Cannot access profile (RLS or not found), using session metadata');
        
        // Intentar determinar rol desde metadatos de la sesión
        const userRole = determineRole(
          undefined, 
          { ...session.user.user_metadata, ...session.user.app_metadata }
        );

        const userData = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                session.user.email?.split('@')[0] || 
                'Usuario',
          email: session.user.email || '',
          role: userRole
        };

        console.log('User set from session (RLS fallback):', userData);
        setCurrentUser(userData);
        return;
      }

      // Si llegamos aquí, intentar crear perfil (aunque probablemente falle por RLS)
      try {
        const newProfile = {
          id: session.user.id,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Cliente D\'Velis',
          role: 'customer'
        };
        
        const { error: insertError } = await supabase.from('profiles').insert(newProfile);
        
        if (!insertError) {
          setCurrentUser({
            id: newProfile.id,
            name: newProfile.full_name,
            email: session.user.email || '',
            role: 'customer' as any
          });
        } else {
          throw insertError;
        }
      } catch (createError: any) {
        console.warn('Cannot create profile (RLS blocking), using session data');
        // Fallback final: usar datos de sesión, intentar obtener rol desde metadatos
        const userRole = determineRole(
          undefined,
          { ...session.user.user_metadata, ...session.user.app_metadata }
        );
        
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          role: userRole
        });
      }
      
    } catch (error) {
      console.error('Unexpected error loading user:', error);
      // Último fallback: usar datos básicos de la sesión
      const userRole = determineRole(
        undefined,
        { ...session.user.user_metadata, ...session.user.app_metadata }
      );
      
      setCurrentUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
        email: session.user.email || '',
        avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
        role: userRole
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    let sessionChecked = false;

    // Load initial data immediately, regardless of auth state
    if (!isDataLoaded) {
      setIsDataLoaded(true);
      fetchInitialData();
    }

    // Escuchar cambios en el estado de autenticación (incluye sesión inicial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      // El evento INITIAL_SESSION se dispara automáticamente cuando Supabase inicializa
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        sessionChecked = true;
        if (session) {
          await loadUserFromSession(session);
          
          // Si es un inicio de sesión nuevo, cerrar el overlay y mostrar mensaje
          if (event === 'SIGNED_IN') {
            setIsLoginOpen(false);
            setToast({ message: '¡Bienvenido! Sesión iniciada correctamente', type: 'success' });
          }
        } else {
          setCurrentUser(null);
        }
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setToast({ message: 'Sesión cerrada correctamente', type: 'success' });
        setAuthLoading(false);
      }
    });

    // Fallback: Si después de 1 segundo no se ha recibido INITIAL_SESSION, verificar manualmente
    const timeoutId = setTimeout(async () => {
      if (!sessionChecked && isMounted) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && isMounted) {
            await loadUserFromSession(session);
          } else if (isMounted) {
            // Data already loaded above
          }
        } catch (error) {
          console.error('Error in fallback session check:', error);
          // Data loading is handled above, no need to set isLoading here
        }
      }
      setAuthLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUsers() {
    const { data: profilesData, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.warn('Error fetching profiles:', error);
      setUsers([]);
      setMaybeRLSProfiles(true);
      return;
    }

    if (profilesData) {
      const mapped = profilesData.map(p => ({
        id: p.id,
        name: p.full_name || 'Sin nombre',
        email: '',
        role: p.role || 'customer'
      }));
      setUsers(mapped);

      // If only a single profile (often the current user) is returned, it's likely due to RLS policies.
      if (mapped.length <= 1) {
        console.warn('Only one or zero profiles returned; this may be caused by Supabase RLS policies.');
        setMaybeRLSProfiles(true);
      } else {
        setMaybeRLSProfiles(false);
      }
    }
  }

  async function fetchInitialData() {
    setIsLoading(true);
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productsData) {
        const mappedProducts = productsData.map(p => ({
          ...p,
          isFeatured: p.is_featured,
          isActive: p.is_active !== false,
          presentationOptions: p.presentation_options || [],
          keywords: p.keywords || [],
          bulkPrice: p.bulk_price ? {
            threshold: p.bulk_threshold || 12,
            price: p.bulk_price
          } : undefined
        }));
        setProducts(mappedProducts);
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersData) {
        const mappedOrders: Order[] = ordersData.map(o => ({
          id: o.id,
          userId: o.user_id,
          userName: o.user_name || 'Cliente',
          total: o.total,
          status: o.status,
          createdAt: o.created_at,
          items: []
        }));
        setOrders(mappedOrders);
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const saveProduct = async (product: Product) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id);
    const payload: any = {
      name: product.name || 'Vela Artesanal',
      description: product.description || '',
      category: product.category,
      price: product.price,
      weight: product.weight || '',
      images: product.images,
      colors: product.colors,
      aromas: product.aromas,
      presentation_options: product.presentationOptions,
      keywords: product.keywords,
      bulk_threshold: product.bulkPrice?.threshold || 12,
      bulk_price: product.bulkPrice?.price || null,
      is_featured: product.isFeatured || false,
      is_active: product.isActive
    };

    if (isUUID) payload.id = product.id;

    const { error } = await supabase.from('products').upsert(payload);

    if (error) {
      console.error('Error Supabase Upsert:', error);
      showToast(`Error: ${error.message || 'No se pudo guardar'}`, 'error');
    } else {
      showToast(isUUID ? 'Vela actualizada' : 'Vela creada');
      fetchInitialData();
    }
  };

  const toggleProductStatus = async (id: string, newStatus: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: newStatus } : p));

    try {
      const { error } = await supabase.from('products').update({ is_active: newStatus }).eq('id', id);
      
      if (error) {
        showToast('Error al cambiar estado', 'error');
        fetchInitialData();
      } else {
        showToast(newStatus ? 'Vela activada' : 'Vela desactivada');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
      fetchInitialData();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveView('home');
    showToast('Sesión cerrada correctamente');
  };

  const handleAdminBypass = () => {
    setCurrentUser({
      id: 'debug-admin',
      name: 'Admin Demo',
      email: 'admin@dvelis.com',
      role: 'admin'
    });
    setIsLoginOpen(false);
    showToast('Dashboard Activado');
  };

  const onAddToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => 
        i.id === item.id && 
        i.selectedColor === item.selectedColor && 
        i.selectedAroma === item.selectedAroma &&
        i.selectedPresentation === item.selectedPresentation
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + item.quantity;
        
        let unitPrice = next[existingIndex].price;
        if (next[existingIndex].bulkPrice && newQty >= next[existingIndex].bulkPrice.threshold) {
          unitPrice = next[existingIndex].bulkPrice.price;
        }

        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          finalUnitPrice: unitPrice
        };
        showToast(`${item.name} actualizado`);
        return next;
      }

      showToast(`${item.name} añadido a tu bolsa`);
      return [...prev, item];
    });
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCartItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        let unitPrice = item.price;
        if (item.bulkPrice && newQty >= item.bulkPrice.threshold) {
          unitPrice = item.bulkPrice.price;
        }
        return { ...item, quantity: newQty, finalUnitPrice: unitPrice };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    showToast('Bolsa vaciada');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const activeProducts = products.filter(p => p.isActive);

  const renderSection = () => {
    if (isLoading || authLoading) return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#7C5E47]" size={48} />
        <p className="text-[#4A3728] font-medium animate-pulse">Cargando magia de D'Velis...</p>
      </div>
    );

    switch (activeView) {
      case 'home':
        return <Home products={activeProducts} onExplore={(c) => { setSelectedCategory(c || Category.ALL); setActiveView('catalog'); }} onProductClick={(p) => { setSelectedProduct(p); setActiveView('product-detail'); }} />;
      case 'catalog':
        return <Catalog 
          products={activeProducts}
          onAddToCart={(p) => { setSelectedProduct(p); setActiveView('product-detail'); }} 
          searchQuery={searchQuery} 
          onClearSearch={handleClearSearch}
          initialCategory={selectedCategory} 
        />;
      case 'admin':
        const adminRole = currentUser?.role ? String(currentUser.role).toLowerCase().trim() : '';
        return adminRole === 'admin' ? (
          <AdminDashboard 
            products={products}
            orders={orders}
            users={users}
            maybeRLSProfiles={maybeRLSProfiles}
            onSaveProduct={saveProduct}
            onDeleteProduct={(id) => {
              const prod = products.find(p => p.id === id);
              if (prod) toggleProductStatus(id, !prod.isActive);
            }}
            onRefresh={fetchInitialData}
            onUpdateOrderStatus={async (id, status) => {
              const { error } = await supabase.from('orders').update({ status }).eq('id', id);
              if (error) {
                showToast('Error al actualizar pedido', 'error');
              } else {
                showToast('Estado de pedido actualizado');
                fetchInitialData();
              }
            }}
          />
        ) : <Home products={activeProducts} onExplore={() => setActiveView('catalog')} onProductClick={(p) => { setSelectedProduct(p); setActiveView('product-detail'); }} />;
      case 'product-detail':
        return selectedProduct ? (
          <ProductDetail 
            product={selectedProduct} 
            allProducts={activeProducts}
            onBack={() => setActiveView('catalog')} 
            onAddToCart={onAddToCart} 
            onProductClick={(p) => { setSelectedProduct(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        ) : null;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      default:
        return <Home products={activeProducts} onExplore={() => setActiveView('catalog')} onProductClick={(p) => { setSelectedProduct(p); setActiveView('product-detail'); }} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF9]">
      <HeaderComp 
        user={currentUser}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onSearchClick={() => setIsSearchOpen(true)}
        onLoginClick={() => currentUser ? logout() : setIsLoginOpen(true)}
        activeSection={activeView}
        setActiveSection={(v) => setActiveView(v as AppView)}
        isSearchActive={searchQuery.length > 0}
      />

      <main className="flex-grow">
        <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-[#7C5E47]" size={48} /></div>}>
          {renderSection()}
        </Suspense>
      </main>

      <footer className="bg-[#4A3728] text-[#FDFBF9] pt-20 pb-10 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="space-y-6">
              <h2 className="text-5xl font-serif italic font-bold tracking-tighter">D'Velis</h2>
              <p className="text-[#EADED2]/80 text-lg leading-relaxed italic font-serif max-w-xs">
                "Iluminando tus momentos más especiales con luz artesanal y amor en cada detalle."
              </p>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF9]">Navegación</h3>
              <ul className="space-y-3 text-sm font-medium">
                <li><button onClick={() => setActiveView('home')} className="hover:text-[#A68972] transition-colors">Inicio</button></li>
                <li><button onClick={() => setActiveView('catalog')} className="hover:text-[#A68972] transition-colors">Catálogo Completo</button></li>
                <li><button onClick={() => setActiveView('about')} className="hover:text-[#A68972] transition-colors">Nuestro Proceso</button></li>
                <li><button onClick={() => setActiveView('contact')} className="hover:text-[#A68972] transition-colors">Contacto Directo</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FDFBF9]">Conéctate con Nosotros</h3>
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#7C5E47] transition-all group" aria-label="Síguenos en Instagram">
                  <Instagram size={20} className="text-[#EADED2] group-hover:scale-110 transition-transform" />
                </a>
                <a href={`https://wa.me/${CONTACT_WHATSAPP}`} target="_blank" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#25D366] transition-all group" aria-label="Contáctanos por WhatsApp">
                  <MessageCircle size={20} className="text-[#EADED2] group-hover:scale-110 transition-transform" />
                </a>
                <a href="https://tiktok.com" target="_blank" className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-black transition-all group" aria-label="Síguenos en TikTok">
                  <Music2 size={20} className="text-[#EADED2] group-hover:scale-110 transition-transform" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-[#EADED2]/60 text-xs">
                <MapPin size={14} />
                <span>{LOCATION}</span>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <p>© {new Date().getFullYear()} D'Velis Velas Artesanales. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <span>Jamundí, Valle del Cauca</span>
              <span className="text-white/20">|</span>
              <span>Hecho a mano en Colombia</span>
            </div>
          </div>
        </div>
      </footer>

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={(index) => setCartItems(prev => prev.filter((_, i) => i !== index))}
        onUpdateQty={updateCartItemQty}
        onClear={clearCart}
      />

      {isLoginOpen && <LoginOverlay onClose={() => setIsLoginOpen(false)} onShowToast={showToast} />}
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {(() => {
        // Normalizar el rol para la comparación (case-insensitive)
        const userRole = currentUser?.role ? String(currentUser.role).toLowerCase().trim() : '';
        const isAdmin = userRole === 'admin';
        
        return isAdmin ? (
          <AdminFloatingAccess 
            activeView={activeView}
            onNavigate={setActiveView}
            pendingOrdersCount={orders.filter(o => o.status === 'pending').length}
          />
        ) : null;
      })()}

      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] bg-[#FDFBF9] flex flex-col animate-fade-in sm:px-12">
          <div className="flex items-center justify-between h-20 px-6 border-b border-[#EADED2]">
             <button onClick={() => setIsSearchOpen(false)} className="md:hidden flex items-center gap-2 text-[#7C5E47] font-bold text-xs uppercase">
               <ArrowLeft size={20} /> Volver
             </button>
             <h2 className="hidden md:block font-serif italic text-2xl text-[#4A3728]">Buscador D'Velis</h2>
             <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-[#F3EFEA] rounded-full transition-colors">
               <X size={28} />
             </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full">
            <div className="w-full relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#7C5E47]" size={32} />
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe el nombre de una vela..."
                className="w-full bg-transparent border-b-2 border-[#EADED2] focus:border-[#7C5E47] py-6 pl-12 pr-12 text-2xl md:text-5xl outline-none font-serif italic transition-all"
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') { 
                    setIsSearchOpen(false); 
                    setActiveView('catalog'); 
                  }
                }}
              />
              {searchQuery.length > 0 && (
                <button 
                  onClick={handleClearSearch}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#A68972] hover:text-[#7C5E47]"
                >
                  <X size={24} />
                </button>
              )}
            </div>
            <div className="mt-8 text-center space-y-4">
               <p className="text-[#4A3728] text-sm font-medium">Pulsa "Enter" para ver todos los resultados</p>
               <div className="flex flex-wrap justify-center gap-2">
                 <button onClick={() => { setSearchQuery('Burbuja'); setIsSearchOpen(false); setActiveView('catalog'); }} className="px-3 py-1 bg-[#F3EFEA] rounded-full text-[10px] font-bold text-[#7C5E47] uppercase">#Burbuja</button>
                 <button onClick={() => { setSearchQuery('Navidad'); setIsSearchOpen(false); setActiveView('catalog'); }} className="px-3 py-1 bg-[#F3EFEA] rounded-full text-[10px] font-bold text-[#7C5E47] uppercase">#Navidad</button>
                 <button onClick={() => { setSearchQuery('Oso'); setIsSearchOpen(false); setActiveView('catalog'); }} className="px-3 py-1 bg-[#F3EFEA] rounded-full text-[10px] font-bold text-[#7C5E47] uppercase">#Oso</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

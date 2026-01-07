import React, { useState, useEffect, useRef, Suspense } from 'react';
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
  
  const [maybeRLSProfiles, setMaybeRLSProfiles] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Refs para evitar ejecuciones duplicadas
  const dataFetchRef = useRef(false);
  const loadUserRef = useRef<string | null>(null);
  const initialProductHandledRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  // Manejar callback de OAuth: limpiar URL después del redirect
  useEffect(() => {
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    
    // Solo limpiar si hay parámetros de OAuth
    const hasAuthParams = hash && (
      hash.includes('access_token') || 
      hash.includes('error') ||
      searchParams.has('code') ||
      searchParams.has('access_token')
    );

    if (hasAuthParams) {
      // console.log('🔗 OAuth callback detected, cleaning URL...');
      // Limpiar URL después de que Supabase procese el hash
      // Usar un delay más largo para asegurar que Supabase lo procese
      setTimeout(() => {
        const cleanUrl = window.location.pathname + window.location.search.replace(/[?&](code|access_token|error)=[^&]*/g, '');
        window.history.replaceState({}, document.title, cleanUrl || '/');
        // console.log('✅ URL cleaned');
      }, 500);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Función para cargar el perfil del usuario desde la sesión
  const loadUserFromSession = async (session: any) => {
    const userId = session?.user?.id;
    
    // Evitar cargar el mismo usuario múltiples veces simultáneamente
    if (loadUserRef.current === userId) {
      // console.log('⏭️ Skipping duplicate loadUserFromSession for user:', session.user.email);
      return;
    }
    
    loadUserRef.current = userId;
    // console.log('👤 loadUserFromSession called for:', session.user.email);
    
    if (!session?.user) {
      // console.warn('⚠️ No user in session');
      setCurrentUser(null);
      loadUserRef.current = null;
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

      // Intentar leer el perfil con timeout
      // console.log('📖 Attempting to read profile from database...');
      try {
        // Crear una promesa con timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout after 2 seconds')), 2000)
        );
        
        const result = await Promise.race([profilePromise, timeoutPromise]) as any;
        
        profile = result.data;
        profileError = result.error;
        
        if (profileError) {
          // console.warn('⚠️ Profile query returned error:', profileError);
        } else if (profile) {
          // console.log('✅ Profile loaded from database');
        }
      } catch (err: any) {
        profileError = err;
        if (err.message?.includes('timeout')) {
          // console.warn('⏱️ Profile fetch timed out (RLS may be blocking)');
        } else {
          // console.warn('⚠️ Error reading profile (RLS may be blocking):', err);
        }
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
        // console.log('✅ Profile found, processing...');
        const normalizedRole = typeof profile.role === 'string' 
          ? profile.role.toLowerCase().trim() 
          : String(profile.role || '').toLowerCase().trim();
        const userRole = normalizedRole === 'admin' ? 'admin' : 'customer';
        
        const userData = {
          id: profile.id,
          name: profile.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          role: userRole
        };
        
        // console.log('✅ Setting currentUser from profile:', { email: userData.email, role: userData.role });
        setCurrentUser(userData);
        // console.log('✅ loadUserFromSession completed (profile)');
        loadUserRef.current = null;
        return;
      }

      // Si hay error RLS o no se encontró perfil, usar datos de la sesión
      // console.log('⚠️ No profile found, using session metadata as fallback');
      
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

      // console.log('✅ Setting currentUser from session metadata:', { email: userData.email, role: userData.role });
      setCurrentUser(userData);
      // console.log('✅ loadUserFromSession completed (session metadata)');
      loadUserRef.current = null;
      return;

    } catch (error) {
      // console.error('❌ Unexpected error in loadUserFromSession:', error);
      // Último fallback: usar datos básicos de la sesión
      const userRole = determineRole(
        undefined,
        { ...session.user.user_metadata, ...session.user.app_metadata }
      );
      
      const fallbackUser = {
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
        email: session.user.email || '',
        role: userRole
      };
      
      // console.log('✅ Setting currentUser from error fallback:', { email: fallbackUser.email, role: fallbackUser.role });
      setCurrentUser(fallbackUser);
      // console.log('✅ loadUserFromSession completed (error fallback)');
      loadUserRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let hasProcessedInitialSession = false;

    // 1️⃣ Leer sesión DIRECTAMENTE desde storage (no depender de eventos)
    const initAuth = async () => {
      try {
        // console.log('🔐 Initializing auth, origin:', window.location.origin);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) {
          // console.log('❌ Component unmounted, aborting');
          return;
        }

        if (error) {
          // console.error('❌ Error getting session:', error);
          setCurrentUser(null);
          setAuthLoading(false);
          return;
        }

        if (session) {
          // console.log('✅ Session found on init:', {
          //   email: session.user.email,
          //   expiresAt: session.expires_at,
          //   origin: window.location.origin
          // });
          
          hasProcessedInitialSession = true;
          try {
            await loadUserFromSession(session);
          } catch (loadError) {
            // console.error('❌ Error loading user from session:', loadError);
            // Continuar aunque falle loadUserFromSession
          }
        } else {
          // console.log('⚠️ No session found on init, origin:', window.location.origin);
          setCurrentUser(null);
        }
      } catch (err) {
        // console.error('❌ Unexpected error in initAuth:', err);
        setCurrentUser(null);
      } finally {
        if (mounted) {
          // console.log('✅ Auth loading complete');
          setAuthLoading(false);
        } else {
          // console.log('⚠️ Component unmounted before completing auth');
        }
      }
    };

    // Ejecutar inmediatamente
    initAuth();

    // Timeout de seguridad: asegurar que authLoading se establezca en false después de 3 segundos máximo
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setAuthLoading((prev) => {
          if (prev) {
            // console.warn('⚠️ Auth initialization timeout after 3s, forcing authLoading to false');
          }
          return false;
        });
      }
    }, 3000);

    // 2️⃣ Escuchar cambios (login/logout reales, no para carga inicial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Ignorar INITIAL_SESSION si ya procesamos la sesión en initAuth
      if (event === 'INITIAL_SESSION' && hasProcessedInitialSession) {
        // console.log('⏭️ Skipping INITIAL_SESSION (already processed in initAuth)');
        return;
      }

      // console.log('🔔 Auth state changed:', event, session?.user?.email);

      if (session) {
        // Cualquier evento con sesión (SIGNED_IN, TOKEN_REFRESHED, etc.)
        try {
          // console.log('🔄 Loading user from session (onAuthStateChange)...');
          await loadUserFromSession(session);
          // console.log('✅ User loaded successfully from onAuthStateChange');
        } catch (loadError) {
          // console.error('❌ Error loading user in onAuthStateChange:', loadError);
          // No bloquear, continuar aunque falle
        }
        
        // Solo mostrar toast en login nuevo
        if (event === 'SIGNED_IN') {
          setIsLoginOpen(false);
          setToast({ message: '¡Bienvenido! Sesión iniciada correctamente', type: 'success' });
        }
      } else {
        // Sin sesión = logout
        // console.log('🚪 No session, setting user to null');
        setCurrentUser(null);
        if (event === 'SIGNED_OUT') {
          setToast({ message: 'Sesión cerrada correctamente', type: 'success' });
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUsers() {
    const { data: profilesData, error } = await supabase.from('profiles').select('*');
    if (error) {
      // console.warn('Error fetching profiles:', error);
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
        // console.warn('Only one or zero profiles returned; this may be caused by Supabase RLS policies.');
        setMaybeRLSProfiles(true);
      } else {
        setMaybeRLSProfiles(false);
      }
    }
  }

  async function fetchInitialData() {
    // console.log('📦 Fetching initial data...');
    setIsLoading(true);
    
    try {
      // Cargar productos
      // console.log('📦 Loading products...');
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (productsError) {
        // console.error('❌ Error loading products:', productsError);
        // Continuar aunque falle, usar array vacío
        setProducts([]);
      } else if (productsData) {
        // console.log(`✅ Loaded ${productsData.length} products`);
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
      } else {
        // console.warn('⚠️ No products data returned');
        setProducts([]);
      }

      // Cargar órdenes (opcional, puede fallar por RLS)
      try {
        // console.log('📦 Loading orders...');
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          // console.warn('⚠️ Error loading orders (may be RLS):', ordersError);
          setOrders([]);
        } else if (ordersData) {
          // console.log(`✅ Loaded ${ordersData.length} orders`);
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
        } else {
          setOrders([]);
        }
      } catch (ordersErr) {
        // console.warn('⚠️ Error in orders fetch (non-critical):', ordersErr);
        setOrders([]);
      }

      // Cargar usuarios (opcional, puede fallar por RLS)
      try {
        await fetchUsers();
      } catch (usersErr) {
        // console.warn('⚠️ Error fetching users (non-critical):', usersErr);
      }

      // console.log('✅ Initial data fetch complete');
    } catch (error) {
      // console.error('❌ Critical error loading data:', error);
      // Asegurar que al menos productos sea un array vacío
      setProducts([]);
    } finally {
      setIsLoading(false);
      // console.log('📦 Data loading finished, isLoading set to false');
    }
  }

  // Load application data once on mount (independent of auth resolution)
  useEffect(() => {
    if (dataFetchRef.current) {
      // console.log('⏭️ Skipping duplicate fetchInitialData call');
      return;
    }
    dataFetchRef.current = true;
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // console.error('Error Supabase Upsert:', error);
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

  // Si la URL tiene ?product=ID, abrir directamente la ficha de ese producto al cargar
  useEffect(() => {
    if (initialProductHandledRef.current) return;
    if (!products.length) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (!productId) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    initialProductHandledRef.current = true;
    setSelectedProduct(product);
    setActiveView('product-detail');
  }, [products]);

  const renderSection = () => {
    if (authLoading) return (
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

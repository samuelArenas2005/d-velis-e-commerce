
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  bulkPrice?: {
    threshold: number;
    price: number;
  };
  weight?: string;
  images: string[];
  presentationOptions?: string[];
  colors?: string[];
  aromas?: string[];
  keywords?: string[];
  isFeatured?: boolean;
  isActive: boolean; // Atributo para activar/desactivar
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedAroma?: string;
  selectedPresentation?: string;
  finalUnitPrice: number;
}

export enum Category {
  ALL = 'Todas',
  CHRISTMAS = 'Edición Navideña',
  ANIMALS = 'Animalitos',
  FLOWERS = 'Flores',
  GEOMETRIC = 'Geométricas',
  SPECIAL = 'Especiales'
}

export type AppView = 'home' | 'catalog' | 'about' | 'contact' | 'product-detail' | 'admin';

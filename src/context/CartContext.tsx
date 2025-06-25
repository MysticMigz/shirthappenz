'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  color?: string;
  customization?: {
    name?: string;
    number?: string;
    isCustomized: boolean;
    nameCharacters?: number;
    numberCharacters?: number;
    customizationCost?: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems(currentItems => {
      // If item has customization, treat it as unique
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === newItem.productId && 
               item.size === newItem.size &&
               (!item.customization?.isCustomized || 
                (item.customization?.name === newItem.customization?.name &&
                 item.customization?.number === newItem.customization?.number))
      );

      if (existingItemIndex > -1 && !newItem.customization?.isCustomized) {
        // Only combine non-customized items
        const updatedItems = [...currentItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = Math.min(10, existingItem.quantity + newItem.quantity);
        
        if (existingItem.quantity >= 10) {
          return currentItems;
        }
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        return updatedItems;
      }

      // For customized items or new items, add as new entry
      return [...currentItems, {
        ...newItem,
        customization: newItem.customization ? {
          ...newItem.customization,
          nameCharacters: newItem.customization.name?.length || 0,
          numberCharacters: newItem.customization.number?.length || 0,
          customizationCost: ((newItem.customization.name?.length || 0) + 
                            (newItem.customization.number?.length || 0)) * 2
        } : undefined
      }];
    });
  };

  const removeItem = (productId: string, size: string) => {
    setItems(currentItems =>
      currentItems.filter(item => !(item.productId === productId && item.size === size))
    );
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: Math.min(10, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 
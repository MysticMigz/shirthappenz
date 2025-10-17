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
  baseProductName?: string;
  baseProductImage?: string;
  orderSource?: string;
  customization?: {
    name?: string;
    number?: string;
    isCustomized: boolean;
    nameCharacters?: number;
    numberCharacters?: number;
    customizationCost?: number;
    frontImage?: string;
    backImage?: string;
    frontPosition?: { x: number; y: number };
    backPosition?: { x: number; y: number };
    frontScale?: number;
    backScale?: number;
    frontRotation?: number;
    backRotation?: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem, availableStock?: number) => { success: boolean; message?: string; addedQuantity?: number; requestedQuantity?: number };
  removeItem: (productId: string, size: string, customization?: { name?: string; number?: string }) => void;
  updateQuantity: (productId: string, size: string, quantity: number, availableStock?: number, customization?: { name?: string; number?: string }) => { success: boolean; message?: string; finalQuantity?: number };
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Load cart from localStorage on mount
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available (private browsing mode)');
      return;
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loading cart from localStorage:', parsedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        // Clear corrupted localStorage
        localStorage.removeItem('cart');
      }
    } else {
      console.log('No saved cart found in localStorage');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, cart will not persist');
      return;
    }

    if (items.length > 0) {
      console.log('Saving cart to localStorage:', items);
      localStorage.setItem('cart', JSON.stringify(items));
    } else {
      console.log('Clearing cart from localStorage');
      localStorage.removeItem('cart');
    }
  }, [items]);

  const addItem = (newItem: CartItem, availableStock?: number) => {
    let result = { success: false, message: '', addedQuantity: 0, requestedQuantity: newItem.quantity };
    
    setItems(currentItems => {
      // If item has customization, treat it as unique
      const existingItemIndex = currentItems.findIndex(
        item => item.productId === newItem.productId && 
               item.size === newItem.size &&
               item.color === newItem.color &&
               (!item.customization?.isCustomized || 
                (item.customization?.name === newItem.customization?.name &&
                 item.customization?.number === newItem.customization?.number))
      );

      if (existingItemIndex > -1 && !newItem.customization?.isCustomized) {
        // Only combine non-customized items
        const updatedItems = [...currentItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Calculate new quantity with stock validation
        let newQuantity = existingItem.quantity + newItem.quantity;
        const requestedTotal = newQuantity;
        
        // Apply stock limit if available
        if (availableStock !== undefined) {
          newQuantity = Math.min(newQuantity, availableStock);
        }
        
        // Apply maximum cart limit
        newQuantity = Math.min(newQuantity, 10);
        
        // Calculate how much was actually added
        const addedQuantity = newQuantity - existingItem.quantity;
        
        // Set result message
        if (addedQuantity === 0) {
          result = { 
            success: false, 
            message: availableStock !== undefined && requestedTotal > availableStock 
              ? `Cannot add more items. Only ${availableStock} available in stock.`
              : 'Maximum quantity (10) already in cart.',
            addedQuantity: 0,
            requestedQuantity: newItem.quantity
          };
          return currentItems;
        } else if (addedQuantity < newItem.quantity) {
          result = { 
            success: true, 
            message: availableStock !== undefined && requestedTotal > availableStock
              ? `Added ${addedQuantity} items. Only ${availableStock} available in stock.`
              : `Added ${addedQuantity} items. Maximum cart limit is 10.`,
            addedQuantity,
            requestedQuantity: newItem.quantity
          };
        } else {
          result = { 
            success: true, 
            message: `Added ${addedQuantity} items to cart.`,
            addedQuantity,
            requestedQuantity: newItem.quantity
          };
        }
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity
        };
        return updatedItems;
      }

      // For customized items or new items, validate quantity against stock
      let finalQuantity = newItem.quantity;
      if (availableStock !== undefined) {
        finalQuantity = Math.min(finalQuantity, availableStock);
      }
      finalQuantity = Math.min(finalQuantity, 10);

      // Don't add if quantity is 0 or less
      if (finalQuantity <= 0) {
        result = { 
          success: false, 
          message: availableStock !== undefined && newItem.quantity > availableStock
            ? `Cannot add items. Only ${availableStock} available in stock.`
            : 'Cannot add 0 items.',
          addedQuantity: 0,
          requestedQuantity: newItem.quantity
        };
        return currentItems;
      }

      // Set result message for new items
      if (finalQuantity < newItem.quantity) {
        result = { 
          success: true, 
          message: availableStock !== undefined && newItem.quantity > availableStock
            ? `Added ${finalQuantity} items. Only ${availableStock} available in stock.`
            : `Added ${finalQuantity} items. Maximum cart limit is 10.`,
          addedQuantity: finalQuantity,
          requestedQuantity: newItem.quantity
        };
      } else {
        result = { 
          success: true, 
          message: `Added ${finalQuantity} items to cart.`,
          addedQuantity: finalQuantity,
          requestedQuantity: newItem.quantity
        };
      }

      // For customized items or new items, add as new entry
      return [...currentItems, {
        ...newItem,
        quantity: finalQuantity,
        customization: newItem.customization ? {
          ...newItem.customization,
          nameCharacters: newItem.customization.name?.length || 0,
          numberCharacters: newItem.customization.number?.length || 0,
                  customizationCost: ((newItem.customization.name?.replace(/\s/g, '').length || 0) + 
                          (newItem.customization.number?.length || 0)) * 2
        } : undefined
      }];
    });
    
    return result;
  };

  const removeItem = (productId: string, size: string, customization?: { name?: string; number?: string }) => {
    setItems(currentItems =>
      currentItems.filter(item => {
        // Basic product and size match
        const basicMatch = item.productId === productId && item.size === size;
        
        // If no customization specified, remove all items with this product and size
        if (!customization) {
          return !basicMatch;
        }
        
        // If customization specified, also check customization details
        if (basicMatch) {
          const itemCustomization = item.customization;
          
          // If item has no customization but we're looking for one, don't remove
          if (!itemCustomization?.isCustomized && (customization.name || customization.number)) {
            return true;
          }
          
          // If item has customization but we're not looking for one, don't remove
          if (itemCustomization?.isCustomized && !customization.name && !customization.number) {
            return true;
          }
          
          // Check customization match
          const nameMatch = !customization.name || itemCustomization?.name === customization.name;
          const numberMatch = !customization.number || itemCustomization?.number === customization.number;
          
          return !(nameMatch && numberMatch);
        }
        
        return true;
      })
    );
  };

  const updateQuantity = (productId: string, size: string, quantity: number, availableStock?: number, customization?: { name?: string; number?: string }) => {
    if (quantity <= 0) {
      removeItem(productId, size, customization);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item => {
        // Basic product and size match
        const basicMatch = item.productId === productId && item.size === size;
        
        if (!basicMatch) return item;
        
        // Calculate final quantity with stock validation
        let finalQuantity = quantity;
        if (availableStock !== undefined) {
          finalQuantity = Math.min(finalQuantity, availableStock);
        }
        finalQuantity = Math.min(finalQuantity, 10);
        
        // If no customization specified, update all items with this product and size
        if (!customization) {
          return { ...item, quantity: finalQuantity };
        }
        
        // If customization specified, also check customization details
        const itemCustomization = item.customization;
        
        // If item has no customization but we're looking for one, don't update
        if (!itemCustomization?.isCustomized && (customization.name || customization.number)) {
          return item;
        }
        
        // If item has customization but we're not looking for one, don't update
        if (itemCustomization?.isCustomized && !customization.name && !customization.number) {
          return item;
        }
        
        // Check customization match
        const nameMatch = !customization.name || itemCustomization?.name === customization.name;
        const numberMatch = !customization.number || itemCustomization?.number === customization.number;
        
        if (nameMatch && numberMatch) {
          return { ...item, quantity: Math.min(10, quantity) };
        }
        
        return item;
      })
    );
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setItems([]);
    if (isLocalStorageAvailable()) {
      localStorage.removeItem('cart');
    }
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
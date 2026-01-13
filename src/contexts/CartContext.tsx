'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { cartApi, type CartItem, type CartSummary, type AddToCartInput, type UpdateCartItemInput } from '@/lib/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalItems: number;
  total: number;
  currency: string;
  isLoading: boolean;
  error: string | null;
  addToCart: (item: AddToCartInput) => Promise<CartItem>;
  updateItem: (id: number, data: UpdateCartItemInput) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartSummary>({
    items: [],
    item_count: 0,
    total_items: 0,
    total: 0,
    currency: 'MXN',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from backend
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({
        items: [],
        item_count: 0,
        total_items: 0,
        total: 0,
        currency: 'MXN',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await cartApi.get();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      setError('Failed to load cart');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load cart when user changes
  useEffect(() => {
    if (!authLoading) {
      refreshCart();
    }
  }, [user, authLoading, refreshCart]);

  // Add item to cart
  const addToCart = async (item: AddToCartInput): Promise<CartItem> => {
    setError(null);
    try {
      const newItem = await cartApi.add(item);
      await refreshCart();
      return newItem;
    } catch (err) {
      console.error('Failed to add to cart:', err);
      setError('Failed to add item to cart');
      throw err;
    }
  };

  // Update cart item
  const updateItem = async (id: number, data: UpdateCartItemInput): Promise<void> => {
    setError(null);
    try {
      await cartApi.update(id, data);
      await refreshCart();
    } catch (err) {
      console.error('Failed to update cart item:', err);
      setError('Failed to update item');
      throw err;
    }
  };

  // Remove item from cart
  const removeItem = async (id: number): Promise<void> => {
    setError(null);
    try {
      await cartApi.remove(id);
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove cart item:', err);
      setError('Failed to remove item');
      throw err;
    }
  };

  // Clear cart
  const clearCart = async (): Promise<void> => {
    setError(null);
    try {
      await cartApi.clear();
      setCart({
        items: [],
        item_count: 0,
        total_items: 0,
        total: 0,
        currency: 'MXN',
      });
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError('Failed to clear cart');
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        itemCount: cart.item_count,
        totalItems: cart.total_items,
        total: cart.total,
        currency: cart.currency,
        isLoading,
        error,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
        refreshCart,
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

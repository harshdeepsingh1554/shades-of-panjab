"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Define what a Cart Item looks like
type CartItem = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  category?: string; // Optional category
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: any) => void;
  decreaseQuantity: (id: number) => void; // Function to lower quantity
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from LocalStorage on startup (Client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCart = localStorage.getItem("shades_cart");
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (error) {
          console.error("Failed to parse cart", error);
        }
      }
    }
  }, []);

  // Save to LocalStorage whenever cart changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shades_cart", JSON.stringify(cart));
    }
  }, [cart]);

  // Add Item or Increase Quantity
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Decrease Quantity (Remove if hits 0)
  const decreaseQuantity = (id: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter((item) => item.quantity > 0); // Filter out items with 0 quantity
    });
  };

  // Remove Item Completely
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear All
  const clearCart = () => setCart([]);

  // Calculate Total Price
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, decreaseQuantity, removeFromCart, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
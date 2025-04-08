import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { PizzaConfig } from "@shared/schema";

interface CartItem extends PizzaConfig {
  totalPrice: number;
  quantity?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateItemQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  calculateCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem("pizzaCart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("pizzaCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    const itemWithQuantity = { ...item, quantity: 1 };
    setCartItems((prev) => [...prev, itemWithQuantity]);
  };

  const removeFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    setCartItems((prev) => {
      const newItems = [...prev];
      if (newItems[index]) {
        newItems[index] = { ...newItems[index], quantity };
      }
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum + (item.totalPrice * quantity);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        clearCart,
        calculateCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

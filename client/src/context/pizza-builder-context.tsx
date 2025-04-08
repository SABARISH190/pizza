import { createContext, useContext, useState, ReactNode } from "react";
import { PizzaBase, PizzaSauce, PizzaCheese, PizzaTopping, PizzaConfig } from "@shared/schema";
import { useCart } from "./cart-context";

interface PizzaWithTotal extends PizzaConfig {
  totalPrice: number;
}

interface PizzaBuilderContextType {
  pizzaConfig: PizzaConfig;
  selectBase: (base: PizzaBase) => void;
  selectSauce: (sauce: PizzaSauce) => void;
  selectCheese: (cheese: PizzaCheese) => void;
  addTopping: (topping: PizzaTopping) => void;
  removeTopping: (toppingId: number) => void;
  calculateTotal: () => number;
  resetPizza: () => void;
  addToCart: (pizza: PizzaWithTotal) => void;
}

const PizzaBuilderContext = createContext<PizzaBuilderContextType | undefined>(undefined);

export function PizzaBuilderProvider({ children }: { children: ReactNode }) {
  const [pizzaConfig, setPizzaConfig] = useState<PizzaConfig>({
    base: null,
    sauce: null,
    cheese: null,
    toppings: [],
  });

  const { addToCart: addToCartContext } = useCart();

  const selectBase = (base: PizzaBase) => {
    setPizzaConfig((prev) => ({ ...prev, base }));
  };

  const selectSauce = (sauce: PizzaSauce) => {
    setPizzaConfig((prev) => ({ ...prev, sauce }));
  };

  const selectCheese = (cheese: PizzaCheese) => {
    setPizzaConfig((prev) => ({ ...prev, cheese }));
  };

  const addTopping = (topping: PizzaTopping) => {
    // Check if topping is already added
    if (pizzaConfig.toppings.some((t) => t.id === topping.id)) {
      return;
    }
    setPizzaConfig((prev) => ({
      ...prev,
      toppings: [...prev.toppings, topping],
    }));
  };

  const removeTopping = (toppingId: number) => {
    setPizzaConfig((prev) => ({
      ...prev,
      toppings: prev.toppings.filter((t) => t.id !== toppingId),
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Add base price
    if (pizzaConfig.base) {
      total += pizzaConfig.base.price;
    }
    
    // Add sauce price
    if (pizzaConfig.sauce) {
      total += pizzaConfig.sauce.price;
    }
    
    // Add cheese price
    if (pizzaConfig.cheese) {
      total += pizzaConfig.cheese.price;
    }
    
    // Add toppings prices
    pizzaConfig.toppings.forEach((topping) => {
      total += topping.price;
    });
    
    return total;
  };

  const resetPizza = () => {
    setPizzaConfig({
      base: null,
      sauce: null,
      cheese: null,
      toppings: [],
    });
  };

  const addToCart = (pizza: PizzaWithTotal) => {
    addToCartContext(pizza);
  };

  return (
    <PizzaBuilderContext.Provider
      value={{
        pizzaConfig,
        selectBase,
        selectSauce,
        selectCheese,
        addTopping,
        removeTopping,
        calculateTotal,
        resetPizza,
        addToCart,
      }}
    >
      {children}
    </PizzaBuilderContext.Provider>
  );
}

export function usePizzaBuilder() {
  const context = useContext(PizzaBuilderContext);
  if (context === undefined) {
    throw new Error("usePizzaBuilder must be used within a PizzaBuilderProvider");
  }
  return context;
}

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAuthenticated } from "./middleware";

export function registerRecommendationRoutes(app: Express) {
  // Get recommended toppings for a user based on order history
  app.get("/api/recommendations/toppings", ensureAuthenticated, async (req, res) => {
    try {
      const toppings = await storage.getRecommendedToppingsForUser(req.user!.id);
      res.json(toppings);
    } catch (error) {
      console.error("Error fetching recommended toppings:", error);
      res.status(500).json({ message: "Error fetching recommended toppings" });
    }
  });
  
  // Get popular pizza configurations
  app.get("/api/recommendations/popular", async (req, res) => {
    try {
      const popularConfigs = await storage.getPopularPizzaConfigs();
      res.json(popularConfigs);
    } catch (error) {
      console.error("Error fetching popular pizza configurations:", error);
      res.status(500).json({ message: "Error fetching popular pizza configurations" });
    }
  });
  
  // Get similar pizza configurations based on a given configuration
  app.post("/api/recommendations/similar", async (req, res) => {
    try {
      const { base, sauce, cheese, toppings } = req.body;
      
      if (!base || !sauce || !cheese || !Array.isArray(toppings)) {
        return res.status(400).json({ message: "Invalid pizza configuration" });
      }
      
      const config = {
        base,
        sauce,
        cheese,
        toppings
      };
      
      const similarConfigs = await storage.getSimilarPizzaConfigs(config);
      res.json(similarConfigs);
    } catch (error) {
      console.error("Error fetching similar pizza configurations:", error);
      res.status(500).json({ message: "Error fetching similar pizza configurations" });
    }
  });
  
  // Get recommended pizzas based on user's dietary preferences and previous orders
  app.get("/api/recommendations/personalized", ensureAuthenticated, async (req, res) => {
    try {
      // Get user's order history
      const orders = await storage.getOrdersByUser(req.user!.id);
      
      // If user has no order history, return popular configurations
      if (!orders || orders.length === 0) {
        const popularConfigs = await storage.getPopularPizzaConfigs();
        return res.json({
          type: "popular",
          recommendations: popularConfigs
        });
      }
      
      // Get all order items
      const orderIds = orders.map(order => order.id);
      const orderItems = [];
      
      for (const orderId of orderIds) {
        const items = await storage.getOrderItems(orderId);
        orderItems.push(...items);
      }
      
      // Collect all toppings the user has ordered
      const toppingIds = new Set<number>();
      const toppingFrequency: Record<number, number> = {};
      
      orderItems.forEach(item => {
        if (item.pizzaDetails && item.pizzaDetails.toppings) {
          item.pizzaDetails.toppings.forEach(topping => {
            toppingIds.add(topping.id);
            toppingFrequency[topping.id] = (toppingFrequency[topping.id] || 0) + 1;
          });
        }
      });
      
      // Get the user's preferred base, sauce, and cheese
      const baseFrequency: Record<number, number> = {};
      const sauceFrequency: Record<number, number> = {};
      const cheeseFrequency: Record<number, number> = {};
      
      orderItems.forEach(item => {
        if (item.pizzaDetails) {
          if (item.pizzaDetails.base) {
            const baseId = item.pizzaDetails.base.id;
            baseFrequency[baseId] = (baseFrequency[baseId] || 0) + 1;
          }
          
          if (item.pizzaDetails.sauce) {
            const sauceId = item.pizzaDetails.sauce.id;
            sauceFrequency[sauceId] = (sauceFrequency[sauceId] || 0) + 1;
          }
          
          if (item.pizzaDetails.cheese) {
            const cheeseId = item.pizzaDetails.cheese.id;
            cheeseFrequency[cheeseId] = (cheeseFrequency[cheeseId] || 0) + 1;
          }
        }
      });
      
      // Get favorite base, sauce, and cheese (most frequently ordered)
      const favoriteBaseId = Object.entries(baseFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];
      const favoriteSauceId = Object.entries(sauceFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];
      const favoriteCheeseId = Object.entries(cheeseFrequency).sort((a, b) => b[1] - a[1])[0]?.[0];
      
      // Get favorite toppings (top 3 most frequently ordered)
      const favoriteToppingIds = Object.entries(toppingFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => parseInt(entry[0]));
      
      // Get the actual objects
      const favoriteBase = favoriteBaseId ? await storage.getPizzaBase(parseInt(favoriteBaseId)) : null;
      const favoriteSauce = favoriteSauceId ? await storage.getPizzaSauce(parseInt(favoriteSauceId)) : null;
      const favoriteCheese = favoriteCheeseId ? await storage.getPizzaCheese(parseInt(favoriteCheeseId)) : null;
      
      const favoriteToppings = [];
      for (const id of favoriteToppingIds) {
        const topping = await storage.getPizzaTopping(id);
        if (topping) {
          favoriteToppings.push(topping);
        }
      }
      
      // Construct favorite pizza configuration
      const favoritePizza = {
        base: favoriteBase,
        sauce: favoriteSauce,
        cheese: favoriteCheese,
        toppings: favoriteToppings
      };
      
      // Get similar configurations to the favorite
      const similarConfigs = await storage.getSimilarPizzaConfigs(favoritePizza);
      
      // Also include the user's favorite configuration
      const totalPrice = (favoriteBase?.price || 0) + 
                         (favoriteSauce?.price || 0) + 
                         (favoriteCheese?.price || 0) + 
                         favoriteToppings.reduce((sum, t) => sum + t.price, 0);
                         
      const recommendations = [
        {
          ...favoritePizza,
          totalPrice,
          name: "Your Favorite",
          description: "Based on your order history, we think you'll love this!"
        },
        ...similarConfigs
      ];
      
      res.json({
        type: "personalized",
        recommendations
      });
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      res.status(500).json({ message: "Error generating personalized recommendations" });
    }
  });
}
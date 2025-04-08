import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAuthenticated } from "./middleware";
import { insertCustomPizzaSchema } from "@shared/schema";
import { z } from "zod";

export function registerSocialRoutes(app: Express) {
  // Get all custom pizzas (community creations)
  app.get("/api/custom-pizzas", async (req, res) => {
    try {
      // If user is logged in, get their custom pizzas
      // Otherwise, get all public custom pizzas
      const userId = req.isAuthenticated() ? req.user?.id : undefined;
      const customPizzas = await storage.getCustomPizzas(userId);
      res.json(customPizzas);
    } catch (error) {
      console.error("Error fetching custom pizzas:", error);
      res.status(500).json({ message: "Error fetching custom pizzas" });
    }
  });
  
  // Get a specific custom pizza
  app.get("/api/custom-pizzas/:id", async (req, res) => {
    try {
      const pizzaId = parseInt(req.params.id);
      const pizza = await storage.getCustomPizza(pizzaId);
      
      if (!pizza) {
        return res.status(404).json({ message: "Custom pizza not found" });
      }
      
      // If pizza is private, ensure user has access
      if (!pizza.isPublic && (!req.isAuthenticated() || req.user?.id !== pizza.userId)) {
        return res.status(403).json({ message: "Unauthorized access to this custom pizza" });
      }
      
      res.json(pizza);
    } catch (error) {
      console.error("Error fetching custom pizza:", error);
      res.status(500).json({ message: "Error fetching custom pizza" });
    }
  });
  
  // Create a new custom pizza
  app.post("/api/custom-pizzas", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = insertCustomPizzaSchema.safeParse({
        ...req.body,
        userId: req.user!.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid custom pizza data", 
          errors: validationResult.error.errors 
        });
      }
      
      const customPizza = await storage.createCustomPizza(validationResult.data);
      res.status(201).json(customPizza);
    } catch (error) {
      console.error("Error creating custom pizza:", error);
      res.status(500).json({ message: "Error creating custom pizza" });
    }
  });
  
  // Update a custom pizza
  app.patch("/api/custom-pizzas/:id", ensureAuthenticated, async (req, res) => {
    try {
      const pizzaId = parseInt(req.params.id);
      const pizza = await storage.getCustomPizza(pizzaId);
      
      if (!pizza) {
        return res.status(404).json({ message: "Custom pizza not found" });
      }
      
      // Ensure user owns the pizza
      if (pizza.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this custom pizza" });
      }
      
      const updateSchema = z.object({
        name: z.string().min(3).max(50).optional(),
        description: z.string().optional(),
        baseId: z.number().positive().int().optional(),
        sauceId: z.number().positive().int().optional(),
        cheeseId: z.number().positive().int().optional(),
        toppingIds: z.array(z.number().positive().int()).optional(),
        isPublic: z.boolean().optional(),
        image: z.string().url().optional()
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid custom pizza data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updatedPizza = await storage.updateCustomPizza(
        pizzaId,
        validationResult.data
      );
      
      res.json(updatedPizza);
    } catch (error) {
      console.error("Error updating custom pizza:", error);
      res.status(500).json({ message: "Error updating custom pizza" });
    }
  });
  
  // Delete a custom pizza
  app.delete("/api/custom-pizzas/:id", ensureAuthenticated, async (req, res) => {
    try {
      const pizzaId = parseInt(req.params.id);
      const pizza = await storage.getCustomPizza(pizzaId);
      
      if (!pizza) {
        return res.status(404).json({ message: "Custom pizza not found" });
      }
      
      // Ensure user owns the pizza
      if (pizza.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this custom pizza" });
      }
      
      const success = await storage.deleteCustomPizza(pizzaId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete custom pizza" });
      }
    } catch (error) {
      console.error("Error deleting custom pizza:", error);
      res.status(500).json({ message: "Error deleting custom pizza" });
    }
  });
  
  // Like a custom pizza
  app.post("/api/custom-pizzas/:id/like", ensureAuthenticated, async (req, res) => {
    try {
      const pizzaId = parseInt(req.params.id);
      const pizza = await storage.getCustomPizza(pizzaId);
      
      if (!pizza) {
        return res.status(404).json({ message: "Custom pizza not found" });
      }
      
      const updatedPizza = await storage.likeCustomPizza(pizzaId);
      
      // If the pizza belongs to another user, notify them
      if (pizza.userId !== req.user!.id) {
        await storage.createNotification({
          userId: pizza.userId,
          type: "pizza_liked",
          title: "Your Pizza Got a Like!",
          message: `${req.user!.username} liked your custom pizza "${pizza.name}".`,
          isRead: false
        });
      }
      
      res.json(updatedPizza);
    } catch (error) {
      console.error("Error liking custom pizza:", error);
      res.status(500).json({ message: "Error liking custom pizza" });
    }
  });
  
  // Share a custom pizza
  app.post("/api/custom-pizzas/:id/share", ensureAuthenticated, async (req, res) => {
    try {
      const pizzaId = parseInt(req.params.id);
      const pizza = await storage.getCustomPizza(pizzaId);
      
      if (!pizza) {
        return res.status(404).json({ message: "Custom pizza not found" });
      }
      
      // Ensure user has access to share the pizza
      const hasAccess = pizza.userId === req.user!.id || pizza.isPublic;
      if (!hasAccess) {
        return res.status(403).json({ message: "Unauthorized access to this custom pizza" });
      }
      
      // Generate a shareable link or token (in a real app)
      const shareableLink = `${req.protocol}://${req.get('host')}/shared-pizza/${pizzaId}`;
      
      // If user is sharing someone else's pizza, notify the creator
      if (pizza.userId !== req.user!.id) {
        await storage.createNotification({
          userId: pizza.userId,
          type: "pizza_shared",
          title: "Your Pizza Was Shared!",
          message: `${req.user!.username} shared your custom pizza "${pizza.name}".`,
          isRead: false
        });
      }
      
      res.json({
        success: true,
        shareableLink
      });
    } catch (error) {
      console.error("Error sharing custom pizza:", error);
      res.status(500).json({ message: "Error sharing custom pizza" });
    }
  });
  
  // Get most popular custom pizzas
  app.get("/api/custom-pizzas/popular", async (req, res) => {
    try {
      // This would need to be implemented in storage
      // For now, we'll just get all and sort by likes
      const customPizzas = await storage.getCustomPizzas();
      
      // Sort by likes count (descending)
      const popularPizzas = customPizzas
        .filter(pizza => pizza.isPublic)
        .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
        .slice(0, 10); // Top 10
      
      res.json(popularPizzas);
    } catch (error) {
      console.error("Error fetching popular custom pizzas:", error);
      res.status(500).json({ message: "Error fetching popular custom pizzas" });
    }
  });
}
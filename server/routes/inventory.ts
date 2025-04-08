import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAdmin } from "./middleware";
import {
  insertPizzaBaseSchema,
  insertPizzaSauceSchema,
  insertPizzaCheeseSchema,
  insertPizzaToppingSchema,
} from "@shared/schema";
import { z } from "zod";

export function registerInventoryRoutes(app: Express) {
  // Get low stock items
  app.get("/api/admin/inventory/low-stock", ensureAdmin, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Error fetching low stock items" });
    }
  });
  
  // Get all pizza bases
  app.get("/api/pizza-bases", async (req, res) => {
    try {
      const bases = await storage.getAllPizzaBases();
      
      // For regular users, only show bases with stock > 0
      const availableBases = req.isAuthenticated() && req.user?.isAdmin
        ? bases
        : bases.filter(base => base.stock > 0);
      
      res.json(availableBases);
    } catch (error) {
      console.error("Error fetching pizza bases:", error);
      res.status(500).json({ message: "Error fetching pizza bases" });
    }
  });
  
  // Create a new pizza base (admin only)
  app.post("/api/admin/pizza-bases", ensureAdmin, async (req, res) => {
    try {
      const validationResult = insertPizzaBaseSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid pizza base data", 
          errors: validationResult.error.errors 
        });
      }
      
      const base = await storage.createPizzaBase(validationResult.data);
      res.status(201).json(base);
    } catch (error) {
      console.error("Error creating pizza base:", error);
      res.status(500).json({ message: "Error creating pizza base" });
    }
  });
  
  // Update pizza base stock (admin only)
  app.patch("/api/admin/pizza-bases/:id/stock", ensureAdmin, async (req, res) => {
    try {
      const baseId = parseInt(req.params.id);
      const stockSchema = z.object({
        stock: z.number().int().min(0)
      });
      
      const validationResult = stockSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid stock data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { stock } = validationResult.data;
      const updatedBase = await storage.updatePizzaBaseStock(baseId, stock);
      
      if (!updatedBase) {
        return res.status(404).json({ message: "Pizza base not found" });
      }
      
      res.json(updatedBase);
    } catch (error) {
      console.error("Error updating pizza base stock:", error);
      res.status(500).json({ message: "Error updating pizza base stock" });
    }
  });
  
  // Get all pizza sauces
  app.get("/api/pizza-sauces", async (req, res) => {
    try {
      const sauces = await storage.getAllPizzaSauces();
      
      // For regular users, only show sauces with stock > 0
      const availableSauces = req.isAuthenticated() && req.user?.isAdmin
        ? sauces
        : sauces.filter(sauce => sauce.stock > 0);
      
      res.json(availableSauces);
    } catch (error) {
      console.error("Error fetching pizza sauces:", error);
      res.status(500).json({ message: "Error fetching pizza sauces" });
    }
  });
  
  // Create a new pizza sauce (admin only)
  app.post("/api/admin/pizza-sauces", ensureAdmin, async (req, res) => {
    try {
      const validationResult = insertPizzaSauceSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid pizza sauce data", 
          errors: validationResult.error.errors 
        });
      }
      
      const sauce = await storage.createPizzaSauce(validationResult.data);
      res.status(201).json(sauce);
    } catch (error) {
      console.error("Error creating pizza sauce:", error);
      res.status(500).json({ message: "Error creating pizza sauce" });
    }
  });
  
  // Update pizza sauce stock (admin only)
  app.patch("/api/admin/pizza-sauces/:id/stock", ensureAdmin, async (req, res) => {
    try {
      const sauceId = parseInt(req.params.id);
      const stockSchema = z.object({
        stock: z.number().int().min(0)
      });
      
      const validationResult = stockSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid stock data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { stock } = validationResult.data;
      const updatedSauce = await storage.updatePizzaSauceStock(sauceId, stock);
      
      if (!updatedSauce) {
        return res.status(404).json({ message: "Pizza sauce not found" });
      }
      
      res.json(updatedSauce);
    } catch (error) {
      console.error("Error updating pizza sauce stock:", error);
      res.status(500).json({ message: "Error updating pizza sauce stock" });
    }
  });
  
  // Get all pizza cheeses
  app.get("/api/pizza-cheeses", async (req, res) => {
    try {
      const cheeses = await storage.getAllPizzaCheeses();
      
      // For regular users, only show cheeses with stock > 0
      const availableCheeses = req.isAuthenticated() && req.user?.isAdmin
        ? cheeses
        : cheeses.filter(cheese => cheese.stock > 0);
      
      res.json(availableCheeses);
    } catch (error) {
      console.error("Error fetching pizza cheeses:", error);
      res.status(500).json({ message: "Error fetching pizza cheeses" });
    }
  });
  
  // Create a new pizza cheese (admin only)
  app.post("/api/admin/pizza-cheeses", ensureAdmin, async (req, res) => {
    try {
      const validationResult = insertPizzaCheeseSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid pizza cheese data", 
          errors: validationResult.error.errors 
        });
      }
      
      const cheese = await storage.createPizzaCheese(validationResult.data);
      res.status(201).json(cheese);
    } catch (error) {
      console.error("Error creating pizza cheese:", error);
      res.status(500).json({ message: "Error creating pizza cheese" });
    }
  });
  
  // Update pizza cheese stock (admin only)
  app.patch("/api/admin/pizza-cheeses/:id/stock", ensureAdmin, async (req, res) => {
    try {
      const cheeseId = parseInt(req.params.id);
      const stockSchema = z.object({
        stock: z.number().int().min(0)
      });
      
      const validationResult = stockSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid stock data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { stock } = validationResult.data;
      const updatedCheese = await storage.updatePizzaCheeseStock(cheeseId, stock);
      
      if (!updatedCheese) {
        return res.status(404).json({ message: "Pizza cheese not found" });
      }
      
      res.json(updatedCheese);
    } catch (error) {
      console.error("Error updating pizza cheese stock:", error);
      res.status(500).json({ message: "Error updating pizza cheese stock" });
    }
  });
  
  // Get all pizza toppings
  app.get("/api/pizza-toppings", async (req, res) => {
    try {
      const toppings = await storage.getAllPizzaToppings();
      
      // For regular users, only show toppings with stock > 0
      const availableToppings = req.isAuthenticated() && req.user?.isAdmin
        ? toppings
        : toppings.filter(topping => topping.stock > 0);
      
      res.json(availableToppings);
    } catch (error) {
      console.error("Error fetching pizza toppings:", error);
      res.status(500).json({ message: "Error fetching pizza toppings" });
    }
  });
  
  // Create a new pizza topping (admin only)
  app.post("/api/admin/pizza-toppings", ensureAdmin, async (req, res) => {
    try {
      const validationResult = insertPizzaToppingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid pizza topping data", 
          errors: validationResult.error.errors 
        });
      }
      
      const topping = await storage.createPizzaTopping(validationResult.data);
      res.status(201).json(topping);
    } catch (error) {
      console.error("Error creating pizza topping:", error);
      res.status(500).json({ message: "Error creating pizza topping" });
    }
  });
  
  // Update pizza topping stock (admin only)
  app.patch("/api/admin/pizza-toppings/:id/stock", ensureAdmin, async (req, res) => {
    try {
      const toppingId = parseInt(req.params.id);
      const stockSchema = z.object({
        stock: z.number().int().min(0)
      });
      
      const validationResult = stockSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid stock data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { stock } = validationResult.data;
      const updatedTopping = await storage.updatePizzaToppingStock(toppingId, stock);
      
      if (!updatedTopping) {
        return res.status(404).json({ message: "Pizza topping not found" });
      }
      
      res.json(updatedTopping);
    } catch (error) {
      console.error("Error updating pizza topping stock:", error);
      res.status(500).json({ message: "Error updating pizza topping stock" });
    }
  });
}
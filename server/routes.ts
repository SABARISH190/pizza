import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { orderStatusEnum } from "@shared/schema";
import { z } from "zod";

// Import all route modules
import { registerProfileRoutes } from "./routes/profile";
import { registerPaymentRoutes } from "./routes/payment";
import { registerOrderRoutes } from "./routes/orders";
import { registerNotificationRoutes } from "./routes/notifications";
import { registerSubscriptionRoutes } from "./routes/subscriptions";
import { registerPromotionRoutes } from "./routes/promotions";
import { registerInventoryRoutes } from "./routes/inventory";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerRecommendationRoutes } from "./routes/recommendations";
import { registerSocialRoutes } from "./routes/social";

// Using middleware from middleware.ts instead
import { ensureAuthenticated, ensureAdmin } from "./routes/middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Create HTTP server for WebSocket support and returning at the end
  const httpServer = createServer(app);
  
  // Register all route modules
  registerProfileRoutes(app);
  registerPaymentRoutes(app);
  
  // Register notification service first (needed by other modules)
  const notificationService = registerNotificationRoutes(app, httpServer);
  
  // Pass notification service to modules that need it
  registerOrderRoutes(app, notificationService);
  registerSubscriptionRoutes(app, notificationService);
  registerPromotionRoutes(app, notificationService);
  registerInventoryRoutes(app);
  registerAnalyticsRoutes(app);
  registerRecommendationRoutes(app);
  registerSocialRoutes(app, notificationService);

  // API routes
  // Get pizza bases
  app.get("/api/pizza-bases", async (req, res) => {
    try {
      const bases = await storage.getAllPizzaBases();
      res.json(bases);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pizza bases" });
    }
  });

  // Get pizza sauces
  app.get("/api/pizza-sauces", async (req, res) => {
    try {
      const sauces = await storage.getAllPizzaSauces();
      res.json(sauces);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pizza sauces" });
    }
  });

  // Get pizza cheeses
  app.get("/api/pizza-cheeses", async (req, res) => {
    try {
      const cheeses = await storage.getAllPizzaCheeses();
      res.json(cheeses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pizza cheeses" });
    }
  });

  // Get pizza toppings
  app.get("/api/pizza-toppings", async (req, res) => {
    try {
      const toppings = await storage.getAllPizzaToppings();
      res.json(toppings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching pizza toppings" });
    }
  });

  // Create order
  app.post("/api/orders", ensureAuthenticated, async (req, res) => {
    try {
      const orderSchema = z.object({
        totalAmount: z.number().positive(),
        deliveryAddress: z.string().min(5),
        contactNumber: z.string().min(10),
        items: z.array(z.object({
          pizzaDetails: z.any(),
          price: z.number().positive(),
          quantity: z.number().int().positive()
        }))
      });

      const validationResult = orderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: validationResult.error.errors 
        });
      }

      const { items, ...orderData } = validationResult.data;
      
      // Create order
      const order = await storage.createOrder({
        ...orderData,
        userId: req.user!.id
      });

      // Create order items
      const orderItems = await Promise.all(
        items.map(item => storage.createOrderItem({
          ...item,
          orderId: order.id
        }))
      );

      // Update inventory for the items used in the order
      // For each item in order, reduce the stock of each component
      for (const item of items) {
        const pizzaDetails = item.pizzaDetails;
        
        // Update base stock
        if (pizzaDetails.base) {
          const base = await storage.getPizzaBase(pizzaDetails.base.id);
          if (base) {
            await storage.updatePizzaBaseStock(
              base.id, 
              base.stock - item.quantity
            );
          }
        }
        
        // Update sauce stock
        if (pizzaDetails.sauce) {
          const sauce = await storage.getPizzaSauce(pizzaDetails.sauce.id);
          if (sauce) {
            await storage.updatePizzaSauceStock(
              sauce.id, 
              sauce.stock - item.quantity
            );
          }
        }
        
        // Update cheese stock
        if (pizzaDetails.cheese) {
          const cheese = await storage.getPizzaCheese(pizzaDetails.cheese.id);
          if (cheese) {
            await storage.updatePizzaCheeseStock(
              cheese.id, 
              cheese.stock - item.quantity
            );
          }
        }
        
        // Update toppings stock
        if (pizzaDetails.toppings && pizzaDetails.toppings.length > 0) {
          for (const topping of pizzaDetails.toppings) {
            const toppingItem = await storage.getPizzaTopping(topping.id);
            if (toppingItem) {
              await storage.updatePizzaToppingStock(
                toppingItem.id, 
                toppingItem.stock - item.quantity
              );
            }
          }
        }
      }

      // Check for low stock items after this order
      const lowStockItems = await storage.getLowStockItems();
      
      // In a real app, this would trigger an email notification
      // to the admin about low stock items

      res.status(201).json({ 
        order,
        items: orderItems,
        lowStockItems: lowStockItems.length > 0 ? lowStockItems : null
      });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Error creating order" });
    }
  });

  // Get user orders
  app.get("/api/user/orders", ensureAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      
      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  // Process payment (simulated RazorPay integration)
  app.post("/api/payment", ensureAuthenticated, async (req, res) => {
    try {
      const { orderId, paymentId } = req.body;
      
      // In a real app, verify payment with RazorPay API
      // For the demo, we'll assume payment is successful
      
      // Update order with payment details
      const updatedOrder = await storage.updateOrderPayment(
        orderId,
        paymentId,
        "completed"
      );
      
      // Update order status to "received"
      const finalOrder = await storage.updateOrderStatus(orderId, "received");
      
      if (!finalOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json({ success: true, order: finalOrder });
    } catch (error) {
      res.status(500).json({ message: "Error processing payment" });
    }
  });

  // ADMIN ROUTES

  // Get all orders (admin only)
  app.get("/api/admin/orders", ensureAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      
      // Get order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          // Get user details but remove sensitive info
          const user = await storage.getUser(order.userId);
          const userSafe = user ? { 
            id: user.id, 
            username: user.username, 
            email: user.email 
          } : null;
          
          return { ...order, items, user: userSafe };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", ensureAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const statusValidation = orderStatusEnum.safeParse(status);
      if (!statusValidation.success) {
        return res.status(400).json({ message: "Invalid order status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(
        parseInt(id), 
        statusValidation.data
      );
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Error updating order status" });
    }
  });

  // Get inventory status (admin only)
  app.get("/api/admin/inventory", ensureAdmin, async (req, res) => {
    try {
      const bases = await storage.getAllPizzaBases();
      const sauces = await storage.getAllPizzaSauces();
      const cheeses = await storage.getAllPizzaCheeses();
      const toppings = await storage.getAllPizzaToppings();
      
      // Get low stock items
      const lowStockItems = await storage.getLowStockItems();
      
      res.json({
        bases,
        sauces,
        cheeses,
        toppings,
        lowStockItems: lowStockItems.length > 0 ? lowStockItems : null
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching inventory" });
    }
  });

  // Update inventory item stock (admin only)
  app.patch("/api/admin/inventory/:type/:id", ensureAdmin, async (req, res) => {
    try {
      const { type, id } = req.params;
      const { stock } = req.body;
      
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: "Invalid stock value" });
      }
      
      let updatedItem;
      
      switch (type) {
        case 'base':
          updatedItem = await storage.updatePizzaBaseStock(parseInt(id), stock);
          break;
        case 'sauce':
          updatedItem = await storage.updatePizzaSauceStock(parseInt(id), stock);
          break;
        case 'cheese':
          updatedItem = await storage.updatePizzaCheeseStock(parseInt(id), stock);
          break;
        case 'topping':
          updatedItem = await storage.updatePizzaToppingStock(parseInt(id), stock);
          break;
        default:
          return res.status(400).json({ message: "Invalid inventory type" });
      }
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating inventory" });
    }
  });

  // Return the already created HTTP server
  return httpServer;
}

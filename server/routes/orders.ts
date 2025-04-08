import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAuthenticated, ensureAdmin } from "./middleware";
import { orderStatusEnum, paymentStatusEnum, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";

export function registerOrderRoutes(app: Express, notificationService: any = null) {
  // Get all orders (admin only)
  app.get("/api/admin/orders", ensureAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });
  
  // Get user orders
  app.get("/api/orders", ensureAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Error fetching user orders" });
    }
  });
  
  // Get order details
  app.get("/api/orders/:id", ensureAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Make sure user can only access their own orders unless they're admin
      if (order.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access to this order" });
      }
      
      // Get order items
      const orderItems = await storage.getOrderItems(orderId);
      
      res.json({
        ...order,
        items: orderItems
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ message: "Error fetching order details" });
    }
  });
  
  // Create a new order
  app.post("/api/orders", ensureAuthenticated, async (req, res) => {
    try {
      const orderData = {
        ...req.body,
        userId: req.user!.id,
        status: "pending",
        paymentStatus: "pending"
      };
      
      const validationResult = insertOrderSchema.safeParse(orderData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: validationResult.error.errors 
        });
      }
      
      const newOrder = await storage.createOrder(validationResult.data);
      
      // Create order items
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          const orderItemData = {
            ...item,
            orderId: newOrder.id
          };
          
          const itemValidationResult = insertOrderItemSchema.safeParse(orderItemData);
          
          if (itemValidationResult.success) {
            await storage.createOrderItem(itemValidationResult.data);
          }
        }
      }
      
      // Get the complete order with items
      const orderItems = await storage.getOrderItems(newOrder.id);
      
      // Create a notification for the user
      await storage.createNotification({
        userId: req.user!.id,
        type: "order_created",
        title: "Order Created",
        message: `Your order #${newOrder.id} has been created successfully.`,
        isRead: false
      });
      
      res.status(201).json({
        ...newOrder,
        items: orderItems
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Error creating order" });
    }
  });
  
  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", ensureAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const statusSchema = z.object({
        status: orderStatusEnum
      });
      
      const validationResult = statusSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid status", 
          errors: validationResult.error.errors 
        });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const { status } = validationResult.data;
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      // Notify the user about the status change
      await storage.createNotification({
        userId: order.userId,
        type: "order_updated",
        title: "Order Status Updated",
        message: `Your order #${orderId} status has been updated to ${status}.`,
        isRead: false
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Error updating order status" });
    }
  });
  
  // Update order tracking information (admin only)
  app.patch("/api/admin/orders/:id/tracking", ensureAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const trackingSchema = z.object({
        trackingUrl: z.string().url(),
        estimatedDeliveryTime: z.string().transform(str => new Date(str))
      });
      
      const validationResult = trackingSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid tracking data", 
          errors: validationResult.error.errors 
        });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const { trackingUrl, estimatedDeliveryTime } = validationResult.data;
      const updatedOrder = await storage.updateOrderTracking(orderId, trackingUrl, estimatedDeliveryTime);
      
      // Notify the user about the tracking info
      await storage.createNotification({
        userId: order.userId,
        type: "order_tracking",
        title: "Order Tracking Available",
        message: `Tracking information is now available for your order #${orderId}.`,
        isRead: false
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order tracking:", error);
      res.status(500).json({ message: "Error updating order tracking" });
    }
  });
  
  // Mark order as delivered
  app.post("/api/admin/orders/:id/delivered", ensureAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const updatedOrder = await storage.setOrderDelivered(orderId);
      
      // Notify the user about delivery
      await storage.createNotification({
        userId: order.userId,
        type: "order_delivered",
        title: "Order Delivered",
        message: `Your order #${orderId} has been delivered. Enjoy your pizza!`,
        isRead: false
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      res.status(500).json({ message: "Error marking order as delivered" });
    }
  });
  
  // Add a review for an order
  app.post("/api/orders/:id/reviews", ensureAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user can only review their own orders
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this order" });
      }
      
      // Make sure the order is delivered before allowing a review
      if (order.status !== "delivered") {
        return res.status(400).json({ message: "Cannot review an order that hasn't been delivered yet" });
      }
      
      const reviewSchema = z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().min(3).max(500),
      });
      
      const validationResult = reviewSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid review data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { rating, comment } = validationResult.data;
      
      const review = await storage.createReview({
        userId: req.user!.id,
        orderId,
        rating,
        comment,
        createdAt: new Date()
      });
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Error creating review" });
    }
  });
  
  // Get order reviews
  app.get("/api/orders/:id/reviews", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const reviews = await storage.getOrderReviews(orderId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching order reviews:", error);
      res.status(500).json({ message: "Error fetching order reviews" });
    }
  });
}
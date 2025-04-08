import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAuthenticated, ensureAdmin } from "./middleware";
import { insertPromotionSchema } from "@shared/schema";
import { z } from "zod";

export function registerPromotionRoutes(app: Express) {
  // Get all active promotions
  app.get("/api/promotions", async (req, res) => {
    try {
      const promotions = await storage.getAllPromotions();
      
      // Only show active promotions to regular users
      const activePromotions = req.isAuthenticated() && req.user?.isAdmin
        ? promotions
        : promotions.filter(p => p.isActive && new Date(p.endDate) >= new Date());
      
      res.json(activePromotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ message: "Error fetching promotions" });
    }
  });
  
  // Create a new promotion (admin only)
  app.post("/api/admin/promotions", ensureAdmin, async (req, res) => {
    try {
      const validationResult = insertPromotionSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid promotion data", 
          errors: validationResult.error.errors 
        });
      }
      
      const promotion = await storage.createPromotion(validationResult.data);
      res.status(201).json(promotion);
    } catch (error) {
      console.error("Error creating promotion:", error);
      res.status(500).json({ message: "Error creating promotion" });
    }
  });
  
  // Update a promotion (admin only)
  app.patch("/api/admin/promotions/:id", ensureAdmin, async (req, res) => {
    try {
      const promotionId = parseInt(req.params.id);
      
      const updateSchema = z.object({
        code: z.string().optional(),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed_amount"]).optional(),
        discountValue: z.number().optional(),
        minOrderAmount: z.number().optional(),
        maxUses: z.number().optional(),
        usedCount: z.number().optional(),
        isActive: z.boolean().optional(),
        startDate: z.string().transform(str => new Date(str)).optional(),
        endDate: z.string().transform(str => new Date(str)).optional()
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid promotion data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updatedPromotion = await storage.updatePromotion(
        promotionId,
        validationResult.data
      );
      
      if (!updatedPromotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }
      
      res.json(updatedPromotion);
    } catch (error) {
      console.error("Error updating promotion:", error);
      res.status(500).json({ message: "Error updating promotion" });
    }
  });
  
  // Validate a promotion code
  app.post("/api/promotions/validate", ensureAuthenticated, async (req, res) => {
    try {
      const { code, orderAmount } = req.body;
      
      if (!code || typeof code !== 'string' || !orderAmount || typeof orderAmount !== 'number') {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      const promotion = await storage.validatePromotion(code, orderAmount);
      
      if (!promotion) {
        return res.status(404).json({ message: "Invalid or expired promotion code" });
      }
      
      // Calculate discount amount
      let discountAmount = 0;
      if (promotion.discountType === "percentage") {
        discountAmount = (orderAmount * promotion.discountValue) / 100;
      } else {
        discountAmount = promotion.discountValue;
      }
      
      // Don't discount more than the order amount
      discountAmount = Math.min(discountAmount, orderAmount);
      
      res.json({
        promotion,
        discountAmount,
        finalAmount: orderAmount - discountAmount
      });
    } catch (error) {
      console.error("Error validating promotion:", error);
      res.status(500).json({ message: "Error validating promotion" });
    }
  });
  
  // Apply a promotion code to an order
  app.post("/api/orders/:id/apply-promotion", ensureAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { code } = req.body;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Invalid promotion code" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user can only apply promotions to their own orders
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this order" });
      }
      
      const promotion = await storage.validatePromotion(code, order.totalAmount);
      
      if (!promotion) {
        return res.status(404).json({ message: "Invalid or expired promotion code" });
      }
      
      // Calculate discount amount
      let discountAmount = 0;
      if (promotion.discountType === "percentage") {
        discountAmount = (order.totalAmount * promotion.discountValue) / 100;
      } else {
        discountAmount = promotion.discountValue;
      }
      
      // Don't discount more than the order amount
      discountAmount = Math.min(discountAmount, order.totalAmount);
      
      // Update the order with the discount
      const updatedOrder = await storage.updateOrderPromotion(
        orderId,
        promotion.id,
        discountAmount
      );
      
      // Increment the promotion use count
      await storage.incrementPromotionUse(promotion.id);
      
      res.json({
        order: updatedOrder,
        discountAmount,
        finalAmount: updatedOrder.totalAmount - discountAmount
      });
    } catch (error) {
      console.error("Error applying promotion:", error);
      res.status(500).json({ message: "Error applying promotion" });
    }
  });
  
  // Get loyalty points for current user
  app.get("/api/loyalty-points", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        loyaltyPoints: user.loyaltyPoints,
        membershipTier: user.membershipTier
      });
    } catch (error) {
      console.error("Error fetching loyalty points:", error);
      res.status(500).json({ message: "Error fetching loyalty points" });
    }
  });
  
  // Redeem loyalty points for a discount
  app.post("/api/loyalty-points/redeem", ensureAuthenticated, async (req, res) => {
    try {
      const redeemSchema = z.object({
        points: z.number().positive().int(),
        orderId: z.number().positive().int()
      });
      
      const validationResult = redeemSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid redemption data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { points, orderId } = validationResult.data;
      
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.loyaltyPoints < points) {
        return res.status(400).json({ message: "Insufficient loyalty points" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure user can only apply points to their own orders
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this order" });
      }
      
      // Calculate discount amount (e.g., 1 point = $0.10 off)
      const discountAmount = points * 0.1;
      
      // Don't discount more than the order amount
      const actualDiscount = Math.min(discountAmount, order.totalAmount);
      
      // Update the order with the discount
      const updatedOrder = await storage.updateOrderLoyaltyDiscount(
        orderId,
        actualDiscount,
        points
      );
      
      // Deduct the points from the user's account
      const updatedUser = await storage.updateUserLoyaltyPoints(
        req.user!.id,
        user.loyaltyPoints - points
      );
      
      // Create a notification
      await storage.createNotification({
        userId: req.user!.id,
        type: "points_redeemed",
        title: "Loyalty Points Redeemed",
        message: `You have redeemed ${points} loyalty points for a $${actualDiscount.toFixed(2)} discount on your order.`,
        isRead: false
      });
      
      res.json({
        order: updatedOrder,
        discountAmount: actualDiscount,
        finalAmount: updatedOrder.totalAmount - actualDiscount,
        remainingPoints: updatedUser.loyaltyPoints
      });
    } catch (error) {
      console.error("Error redeeming loyalty points:", error);
      res.status(500).json({ message: "Error redeeming loyalty points" });
    }
  });
}
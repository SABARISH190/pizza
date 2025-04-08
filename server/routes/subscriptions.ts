import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAuthenticated, ensureAdmin } from "./middleware";
import { subscriptionStatusEnum, insertSubscriptionPlanSchema, insertUserSubscriptionSchema } from "@shared/schema";
import { z } from "zod";

export function registerSubscriptionRoutes(app: Express) {
  // Get all subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Error fetching subscription plans" });
    }
  });
  
  // Get a specific subscription plan
  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      res.status(500).json({ message: "Error fetching subscription plan" });
    }
  });
  
  // Create a new subscription plan (admin only)
  app.post("/api/admin/subscription-plans", ensureAdmin, async (req, res) => {
    try {
      const validationResult = insertSubscriptionPlanSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid subscription plan data", 
          errors: validationResult.error.errors 
        });
      }
      
      const plan = await storage.createSubscriptionPlan(validationResult.data);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Error creating subscription plan" });
    }
  });
  
  // Update a subscription plan (admin only)
  app.patch("/api/admin/subscription-plans/:id", ensureAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      const updateSchema = z.object({
        name: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        price: z.number().positive().optional(),
        interval: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
        features: z.array(z.string()).optional(),
        isActive: z.boolean().optional()
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid subscription plan data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updatedPlan = await storage.updateSubscriptionPlan(planId, validationResult.data);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Error updating subscription plan" });
    }
  });
  
  // Toggle subscription plan status (admin only)
  app.post("/api/admin/subscription-plans/:id/toggle", ensureAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      const updatedPlan = await storage.toggleSubscriptionPlanStatus(planId);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error toggling subscription plan status:", error);
      res.status(500).json({ message: "Error toggling subscription plan status" });
    }
  });
  
  // Get user subscriptions
  app.get("/api/user-subscriptions", ensureAuthenticated, async (req, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.user!.id);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Error fetching user subscriptions" });
    }
  });
  
  // Get a specific user subscription
  app.get("/api/user-subscriptions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getUserSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Ensure user can only access their own subscriptions
      if (subscription.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access to this subscription" });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Error fetching user subscription" });
    }
  });
  
  // Subscribe to a plan
  app.post("/api/subscribe", ensureAuthenticated, async (req, res) => {
    try {
      const subscribeSchema = z.object({
        planId: z.number(),
        paymentMethodId: z.number(),
        autoRenew: z.boolean().default(true)
      });
      
      const validationResult = subscribeSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid subscription data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { planId, paymentMethodId, autoRenew } = validationResult.data;
      
      // Check if plan exists and is active
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan || !plan.isActive) {
        return res.status(400).json({ message: "Subscription plan not available" });
      }
      
      // Check if payment method exists and belongs to user
      const paymentMethod = await storage.getUserPaymentMethod(paymentMethodId);
      if (!paymentMethod || paymentMethod.userId !== req.user!.id) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      
      // Calculate next billing date based on interval
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      
      switch (plan.interval) {
        case "weekly":
          nextBillingDate.setDate(nextBillingDate.getDate() + 7);
          break;
        case "monthly":
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case "quarterly":
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case "yearly":
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }
      
      // Create the subscription
      const subscription = await storage.createUserSubscription({
        userId: req.user!.id,
        planId,
        paymentMethodId,
        status: "active",
        startDate,
        nextBillingDate,
        endDate: null,
        autoRenew
      });
      
      // Notify the user
      await storage.createNotification({
        userId: req.user!.id,
        type: "subscription_created",
        title: "Subscription Created",
        message: `You have successfully subscribed to the ${plan.name} plan.`,
        isRead: false
      });
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });
  
  // Cancel a subscription
  app.post("/api/user-subscriptions/:id/cancel", ensureAuthenticated, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getUserSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Ensure user can only cancel their own subscriptions
      if (subscription.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this subscription" });
      }
      
      const updatedSubscription = await storage.cancelUserSubscription(subscriptionId);
      
      // Notify the user
      await storage.createNotification({
        userId: req.user!.id,
        type: "subscription_cancelled",
        title: "Subscription Cancelled",
        message: `Your subscription has been cancelled.`,
        isRead: false
      });
      
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Error cancelling subscription" });
    }
  });
  
  // Pause a subscription
  app.post("/api/user-subscriptions/:id/pause", ensureAuthenticated, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getUserSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Ensure user can only pause their own subscriptions
      if (subscription.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this subscription" });
      }
      
      const updatedSubscription = await storage.pauseUserSubscription(subscriptionId);
      
      // Notify the user
      await storage.createNotification({
        userId: req.user!.id,
        type: "subscription_paused",
        title: "Subscription Paused",
        message: `Your subscription has been paused.`,
        isRead: false
      });
      
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error pausing subscription:", error);
      res.status(500).json({ message: "Error pausing subscription" });
    }
  });
  
  // Resume a subscription
  app.post("/api/user-subscriptions/:id/resume", ensureAuthenticated, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const subscription = await storage.getUserSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      // Ensure user can only resume their own subscriptions
      if (subscription.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this subscription" });
      }
      
      const updatedSubscription = await storage.resumeUserSubscription(subscriptionId);
      
      // Notify the user
      await storage.createNotification({
        userId: req.user!.id,
        type: "subscription_resumed",
        title: "Subscription Resumed",
        message: `Your subscription has been resumed.`,
        isRead: false
      });
      
      res.json(updatedSubscription);
    } catch (error) {
      console.error("Error resuming subscription:", error);
      res.status(500).json({ message: "Error resuming subscription" });
    }
  });
}
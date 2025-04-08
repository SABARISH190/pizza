import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAdmin } from "./middleware";

export function registerAnalyticsRoutes(app: Express) {
  // Get summary dashboard data
  app.get("/api/admin/analytics/dashboard", ensureAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'weekly';
      
      // Get various analytics data
      const [
        orderAnalytics,
        topSellingItems,
        revenueStats,
        userRetentionStats,
        lowStockItems
      ] = await Promise.all([
        storage.getOrderAnalytics(period),
        storage.getTopSellingItems(period),
        storage.getRevenueStats(period),
        storage.getUserRetentionStats(),
        storage.getLowStockItems()
      ]);
      
      res.json({
        orderAnalytics,
        topSellingItems,
        revenueStats,
        userRetentionStats,
        lowStockItems
      });
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Error fetching dashboard analytics" });
    }
  });
  
  // Get top selling items
  app.get("/api/admin/analytics/top-selling", ensureAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'monthly';
      const topItems = await storage.getTopSellingItems(period);
      res.json(topItems);
    } catch (error) {
      console.error("Error fetching top selling items:", error);
      res.status(500).json({ message: "Error fetching top selling items" });
    }
  });
  
  // Get order analytics
  app.get("/api/admin/analytics/orders", ensureAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'monthly';
      const orderStats = await storage.getOrderAnalytics(period);
      res.json(orderStats);
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      res.status(500).json({ message: "Error fetching order analytics" });
    }
  });
  
  // Get revenue statistics
  app.get("/api/admin/analytics/revenue", ensureAdmin, async (req, res) => {
    try {
      const period = req.query.period as string || 'monthly';
      const revenueStats = await storage.getRevenueStats(period);
      res.json(revenueStats);
    } catch (error) {
      console.error("Error fetching revenue statistics:", error);
      res.status(500).json({ message: "Error fetching revenue statistics" });
    }
  });
  
  // Get user retention statistics
  app.get("/api/admin/analytics/user-retention", ensureAdmin, async (req, res) => {
    try {
      const retentionStats = await storage.getUserRetentionStats();
      res.json(retentionStats);
    } catch (error) {
      console.error("Error fetching user retention statistics:", error);
      res.status(500).json({ message: "Error fetching user retention statistics" });
    }
  });
  
  // Get inventory status
  app.get("/api/admin/analytics/inventory", ensureAdmin, async (req, res) => {
    try {
      const [
        bases,
        sauces,
        cheeses,
        toppings,
        lowStockItems
      ] = await Promise.all([
        storage.getAllPizzaBases(),
        storage.getAllPizzaSauces(),
        storage.getAllPizzaCheeses(),
        storage.getAllPizzaToppings(),
        storage.getLowStockItems()
      ]);
      
      res.json({
        bases,
        sauces,
        cheeses,
        toppings,
        lowStockItems
      });
    } catch (error) {
      console.error("Error fetching inventory analytics:", error);
      res.status(500).json({ message: "Error fetching inventory analytics" });
    }
  });
  
  // Get subscription analytics
  app.get("/api/admin/analytics/subscriptions", ensureAdmin, async (req, res) => {
    try {
      // This would be a more complex implementation in a real system
      // For now, let's create a placeholder structure with some analytics
      
      const subscriptionPlans = await storage.getAllSubscriptionPlans();
      
      // For a real system, you would implement these analytical queries in the storage
      // Such as count of active subscriptions per plan, churn rate, etc.
      const analyticsData = {
        plans: subscriptionPlans,
        metrics: {
          totalSubscribers: 0,  // This would be calculated in a real system
          activeSubscribers: 0,
          churnRate: 0,
          avgSubscriptionLength: 0,
          revenuePerPlan: {}
        }
      };
      
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Error fetching subscription analytics" });
    }
  });
  
  // Get user demographics
  app.get("/api/admin/analytics/demographics", ensureAdmin, async (req, res) => {
    try {
      // This would be implemented in a real system with actual queries
      // For now, we'll return a placeholder structure
      
      const demographicsData = {
        locations: {}, // Count of users by city/region
        orderFrequency: {}, // Distribution of how often users order
        membershipTiers: {}, // Count of users by membership tier
        registrationTimeline: {} // New user registrations over time
      };
      
      res.json(demographicsData);
    } catch (error) {
      console.error("Error fetching demographic analytics:", error);
      res.status(500).json({ message: "Error fetching demographic analytics" });
    }
  });
}
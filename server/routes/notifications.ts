import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { ensureAuthenticated } from "./middleware";
import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";

// Map to store connections by user ID (using the ws WebSocket type)
const userConnections = new Map<number, any[]>();

export function registerNotificationRoutes(app: Express, server: Server) {
  // Create a separate WebSocket server on a different path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ 
    server,
    path: '/api/ws/notifications'
  });
  
  wss.on("connection", (ws, req: any) => {
    console.log("New WebSocket connection established");
    
    // For simplicity in the prototype, we'll skip authentication
    // In a production app, you would use a token or cookie-based auth
    let userId = 1; // Default to the first user
    
    // Try to extract user ID from query parameters
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userIdParam = url.searchParams.get('userId');
      if (userIdParam) {
        userId = parseInt(userIdParam);
      }
    } catch (error) {
      console.error("Error parsing WebSocket URL:", error);
    }
    
    // Add connection to user's connections
    if (!userConnections.has(userId)) {
      userConnections.set(userId, []);
    }
    userConnections.get(userId)?.push(ws);
    
    // Handle WebSocket close
    ws.on("close", () => {
      console.log("WebSocket connection closed");
      const connections = userConnections.get(userId);
      if (connections) {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        
        if (connections.length === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });
  
  // Helper function to send notification to a user's active connections
  const sendNotificationToUser = (userId: number, notification: any) => {
    const connections = userConnections.get(userId);
    if (connections && connections.length > 0) {
      const message = JSON.stringify({
        type: "notification",
        data: notification
      });
      
      connections.forEach(conn => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    }
  };
  
  // Get user notifications
  app.get("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  
  // Get unread notifications count
  app.get("/api/notifications/unread", ensureAuthenticated, async (req, res) => {
    try {
      const unreadNotifications = await storage.getUnreadUserNotifications(req.user!.id);
      res.json({ 
        count: unreadNotifications.length,
        notifications: unreadNotifications
      });
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Error fetching unread notifications" });
    }
  });
  
  // Mark notification as read
  app.patch("/api/notifications/:id/read", ensureAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  
  // Mark all notifications as read
  app.post("/api/notifications/read-all", ensureAuthenticated, async (req, res) => {
    try {
      const success = await storage.markAllUserNotificationsAsRead(req.user!.id);
      
      if (success) {
        const notifications = await storage.getUserNotifications(req.user!.id);
        res.json(notifications);
      } else {
        res.status(500).json({ message: "Failed to mark all notifications as read" });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Error marking all notifications as read" });
    }
  });
  
  // Delete a notification
  app.delete("/api/notifications/:id", ensureAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.deleteNotification(notificationId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete notification" });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });
  
  // Export function to create and send a notification
  return {
    createAndSendNotification: async (userId: number, notificationData: any) => {
      try {
        const notification = await storage.createNotification({
          userId,
          ...notificationData,
          isRead: false
        });
        
        // Send real-time notification via WebSocket
        sendNotificationToUser(userId, notification);
        
        return notification;
      } catch (error) {
        console.error("Error creating and sending notification:", error);
        return null;
      }
    }
  };
}
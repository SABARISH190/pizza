import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { ensureAuthenticated } from "./middleware";

export function registerPaymentRoutes(app: Express) {
  // Get user payment methods
  app.get("/api/payment-methods", ensureAuthenticated, async (req, res) => {
    try {
      const paymentMethods = await storage.getUserPaymentMethods(req.user!.id);
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Error fetching payment methods" });
    }
  });
  
  // Add a new payment method
  app.post("/api/payment-methods", ensureAuthenticated, async (req, res) => {
    try {
      const paymentMethodSchema = z.object({
        type: z.enum(["credit_card", "debit_card", "paypal", "apple_pay", "google_pay"]),
        cardNumber: z.string().optional(),
        cardholderName: z.string().optional(),
        expiryMonth: z.number().optional(),
        expiryYear: z.number().optional(),
        cvv: z.string().optional(),
        accountEmail: z.string().email().optional(),
        isDefault: z.boolean().default(false)
      });
      
      const validationResult = paymentMethodSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid payment method data", 
          errors: validationResult.error.errors 
        });
      }
      
      // For security, immediately encrypt or tokenize any sensitive data
      let tokenizedData: Record<string, any> = { 
        ...validationResult.data
      };
      
      // In a real application, you would use a payment processor's SDK here
      // to tokenize card details and store only the token
      if (tokenizedData.cardNumber) {
        // This is a simplified example
        tokenizedData.cardNumber = `xxxx-xxxx-xxxx-${tokenizedData.cardNumber.slice(-4)}`;
        delete tokenizedData.cvv; // Never store CVV
      }
      
      const paymentMethod = await storage.createPaymentMethod({
        ...tokenizedData,
        userId: req.user!.id
      });
      
      res.status(201).json(paymentMethod);
    } catch (error) {
      console.error("Error creating payment method:", error);
      res.status(500).json({ message: "Error creating payment method" });
    }
  });
  
  // Delete a payment method
  app.delete("/api/payment-methods/:id", ensureAuthenticated, async (req, res) => {
    try {
      const paymentMethodId = parseInt(req.params.id);
      const paymentMethod = await storage.getUserPaymentMethod(paymentMethodId);
      
      if (!paymentMethod) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      
      // Ensure user owns the payment method
      if (paymentMethod.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this payment method" });
      }
      
      const success = await storage.deletePaymentMethod(paymentMethodId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete payment method" });
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Error deleting payment method" });
    }
  });
  
  // Set a payment method as default
  app.post("/api/payment-methods/:id/default", ensureAuthenticated, async (req, res) => {
    try {
      const paymentMethodId = parseInt(req.params.id);
      const paymentMethod = await storage.getUserPaymentMethod(paymentMethodId);
      
      if (!paymentMethod) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      
      // Ensure user owns the payment method
      if (paymentMethod.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this payment method" });
      }
      
      const success = await storage.setDefaultPaymentMethod(req.user!.id, paymentMethodId);
      
      if (success) {
        const paymentMethods = await storage.getUserPaymentMethods(req.user!.id);
        res.json(paymentMethods);
      } else {
        res.status(500).json({ message: "Failed to set payment method as default" });
      }
    } catch (error) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "Error setting default payment method" });
    }
  });
  
  // Process a payment
  app.post("/api/process-payment", ensureAuthenticated, async (req, res) => {
    try {
      const paymentSchema = z.object({
        orderId: z.number(),
        paymentMethodId: z.number().optional(),
        amount: z.number().positive(),
        currency: z.string().default("USD"),
        // For direct card payments
        cardDetails: z.object({
          cardNumber: z.string(),
          cardholderName: z.string(),
          expiryMonth: z.number(),
          expiryYear: z.number(),
          cvv: z.string()
        }).optional()
      });
      
      const validationResult = paymentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid payment data", 
          errors: validationResult.error.errors 
        });
      }
      
      const { orderId, amount, currency, paymentMethodId, cardDetails } = validationResult.data;
      
      // Check if order exists and belongs to the user
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this order" });
      }
      
      // Check if amount matches order total (prevent tampering)
      if (amount !== order.totalAmount) {
        return res.status(400).json({ message: "Payment amount does not match order total" });
      }
      
      // In a real application, you would integrate with a payment processor API here
      // Example with RazorPay:
      
      // 1. Initialize payment
      const paymentId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // 2. Process payment (mock success for now)
      const paymentStatus = "completed";
      
      // 3. Update order with payment info
      const updatedOrder = await storage.updateOrderPayment(
        orderId,
        paymentId,
        paymentStatus
      );
      
      // 4. Add loyalty points for the purchase
      await storage.updateUserLoyaltyPoints(
        req.user!.id, 
        Math.floor(amount / 10) // Example: 1 point for every $10 spent
      );
      
      res.json({
        success: true,
        orderId,
        paymentId,
        paymentStatus,
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });
  
  // Verify RazorPay webhook
  app.post("/api/razorpay-webhook", async (req, res) => {
    try {
      // In a real application, you would verify the webhook signature
      // const razorpaySignature = req.headers['x-razorpay-signature'];
      // const isValid = verifyWebhookSignature(req.body, razorpaySignature);
      
      // For now, we'll assume the webhook is valid
      const { event, payload } = req.body;
      
      switch (event) {
        case 'payment.captured':
          // Update order status
          await storage.updateOrderPayment(
            payload.order_id,
            payload.payment_id,
            'completed'
          );
          break;
          
        case 'payment.failed':
          // Update order status
          await storage.updateOrderPayment(
            payload.order_id,
            payload.payment_id,
            'failed'
          );
          break;
          
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
      
      res.status(200).end();
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Error processing webhook" });
    }
  });
}
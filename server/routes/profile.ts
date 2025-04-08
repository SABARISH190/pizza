import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { updateProfileSchema } from "@shared/schema";
import { z } from "zod";
import { ensureAuthenticated } from "./middleware";

export function registerProfileRoutes(app: Express) {
  // Get user profile
  app.get("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only safe user data (no password)
      const userProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        loyaltyPoints: user.loyaltyPoints,
        membershipTier: user.membershipTier
      };
      
      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Error fetching profile" });
    }
  });
  
  // Update user profile
  app.patch("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const validationResult = updateProfileSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updatedUser = await storage.updateUserProfile(
        req.user!.id,
        validationResult.data
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only safe user data (no password)
      const userProfile = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profilePicture: updatedUser.profilePicture,
        emailVerified: updatedUser.emailVerified,
        loyaltyPoints: updatedUser.loyaltyPoints,
        membershipTier: updatedUser.membershipTier
      };
      
      res.json(userProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });
  
  // Get user addresses
  app.get("/api/profile/addresses", ensureAuthenticated, async (req, res) => {
    try {
      const addresses = await storage.getUserAddresses(req.user!.id);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ message: "Error fetching addresses" });
    }
  });
  
  // Add a new address
  app.post("/api/profile/addresses", ensureAuthenticated, async (req, res) => {
    try {
      const addressSchema = z.object({
        name: z.string().min(2),
        addressLine1: z.string().min(5),
        addressLine2: z.string().optional(),
        city: z.string().min(2),
        state: z.string().min(2),
        postalCode: z.string().min(5),
        country: z.string().default("USA"),
        phone: z.string().min(10),
        isDefault: z.boolean().default(false)
      });
      
      const validationResult = addressSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid address data", 
          errors: validationResult.error.errors 
        });
      }
      
      const address = await storage.createUserAddress({
        ...validationResult.data,
        userId: req.user!.id
      });
      
      res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Error creating address" });
    }
  });
  
  // Update an address
  app.patch("/api/profile/addresses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      const currentAddress = await storage.getUserAddress(addressId);
      
      if (!currentAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Ensure user owns the address
      if (currentAddress.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this address" });
      }
      
      const addressSchema = z.object({
        name: z.string().min(2).optional(),
        addressLine1: z.string().min(5).optional(),
        addressLine2: z.string().optional(),
        city: z.string().min(2).optional(),
        state: z.string().min(2).optional(),
        postalCode: z.string().min(5).optional(),
        country: z.string().optional(),
        phone: z.string().min(10).optional(),
        isDefault: z.boolean().optional()
      });
      
      const validationResult = addressSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid address data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updatedAddress = await storage.updateUserAddress(
        addressId,
        validationResult.data
      );
      
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Error updating address" });
    }
  });
  
  // Delete an address
  app.delete("/api/profile/addresses/:id", ensureAuthenticated, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      const address = await storage.getUserAddress(addressId);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Ensure user owns the address
      if (address.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this address" });
      }
      
      const success = await storage.deleteUserAddress(addressId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete address" });
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Error deleting address" });
    }
  });
  
  // Set an address as default
  app.post("/api/profile/addresses/:id/default", ensureAuthenticated, async (req, res) => {
    try {
      const addressId = parseInt(req.params.id);
      const address = await storage.getUserAddress(addressId);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Ensure user owns the address
      if (address.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this address" });
      }
      
      const success = await storage.setDefaultUserAddress(req.user!.id, addressId);
      
      if (success) {
        const addresses = await storage.getUserAddresses(req.user!.id);
        res.json(addresses);
      } else {
        res.status(500).json({ message: "Failed to set address as default" });
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ message: "Error setting default address" });
    }
  });
}
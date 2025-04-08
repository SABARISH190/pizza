import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // User profile fields
  phone: text("phone"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Loyalty program fields
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),
  membershipTier: text("membership_tier").default("bronze").notNull(),
});

// User addresses for multiple delivery locations
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("USA"),
  isDefault: boolean("is_default").default(false).notNull(),
  phone: text("phone").notNull(),
});

// Payment methods
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'credit', 'debit', 'paypal', etc.
  lastFour: text("last_four").notNull(),
  expiryMonth: text("expiry_month"),
  expiryYear: text("expiry_year"),
  isDefault: boolean("is_default").default(false).notNull(),
  gatewayToken: text("gateway_token"), // Token from payment provider
});

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  images: json("images"), // Array of image URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Custom pizza creations shared by users
export const customPizzas = pgTable("custom_pizzas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image"),
  pizzaConfig: json("pizza_config").notNull(), // PizzaConfig
  likes: integer("likes").default(0).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscriptions
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  intervalDays: integer("interval_days").notNull(), // 7 for weekly, 30 for monthly
  pizzaAllowance: integer("pizza_allowance").notNull(), // Number of pizzas per interval
  additionalPerks: json("additional_perks"), // Array of perks
  isActive: boolean("is_active").default(true).notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  nextDeliveryDate: timestamp("next_delivery_date").notNull(),
  status: text("status").notNull().default("active"), // active, paused, cancelled
  paymentMethodId: integer("payment_method_id"),
  defaultAddressId: integer("default_address_id"),
  defaultPizzaConfig: json("default_pizza_config"), // Default pizza configuration
});

// Promotional codes and discounts
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull(), // percentage or fixed
  discountValue: doublePrecision("discount_value").notNull(),
  minOrderAmount: doublePrecision("min_order_amount").default(0).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // order, promotion, system
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  linkUrl: text("link_url"),
});

// Pizza base options
export const pizzaBases = pgTable("pizza_bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(100),
  threshold: integer("threshold").notNull().default(20),
});

// Pizza sauce options
export const pizzaSauces = pgTable("pizza_sauces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(100),
  threshold: integer("threshold").notNull().default(20),
});

// Pizza cheese options
export const pizzaCheeses = pgTable("pizza_cheeses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(100),
  threshold: integer("threshold").notNull().default(20),
});

// Pizza topping options
export const pizzaToppings = pgTable("pizza_toppings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  image: text("image").notNull(),
  isVeg: boolean("is_veg").notNull().default(true),
  stock: integer("stock").notNull().default(100),
  threshold: integer("threshold").notNull().default(20),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  totalAmount: doublePrecision("total_amount").notNull(),
  paymentId: text("payment_id"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deliveryAddress: text("delivery_address").notNull(),
  contactNumber: text("contact_number").notNull(),
  // Tracking fields
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  deliveryPersonId: integer("delivery_person_id"),
  deliveryNotes: text("delivery_notes"),
  trackingUrl: text("tracking_url"),
  // Discount fields
  discountCode: text("discount_code"),
  discountAmount: doublePrecision("discount_amount").default(0).notNull(),
  // Additional fields
  isSubscriptionOrder: boolean("is_subscription_order").default(false).notNull(),
  subscriptionId: integer("subscription_id"),
  paymentMethodId: integer("payment_method_id"),
  loyaltyPointsEarned: integer("loyalty_points_earned").default(0).notNull(),
  loyaltyPointsRedeemed: integer("loyalty_points_redeemed").default(0).notNull(),
});

// Order items (individual pizzas in an order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  pizzaDetails: json("pizza_details").notNull(), // Stores complete pizza configuration
  price: doublePrecision("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  // Customization and notes
  specialInstructions: text("special_instructions"),
  isFromSavedConfig: boolean("is_from_saved_config").default(false).notNull(),
  savedConfigId: integer("saved_config_id"),
});

// Define Zod schemas for insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  isAdmin: true,
  phone: true,
  profilePicture: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).pick({
  userId: true,
  name: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  isDefault: true,
  phone: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  type: true,
  lastFour: true,
  expiryMonth: true,
  expiryYear: true,
  isDefault: true,
  gatewayToken: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  orderId: true,
  rating: true,
  comment: true,
  images: true,
});

export const insertCustomPizzaSchema = createInsertSchema(customPizzas).pick({
  userId: true,
  name: true,
  description: true,
  image: true,
  pizzaConfig: true,
  isPublic: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  description: true,
  price: true,
  intervalDays: true,
  pizzaAllowance: true,
  additionalPerks: true,
  isActive: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  planId: true,
  nextDeliveryDate: true,
  status: true,
  paymentMethodId: true,
  defaultAddressId: true,
  defaultPizzaConfig: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).pick({
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  maxUses: true,
  startDate: true,
  endDate: true,
  isActive: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  linkUrl: true,
});

export const insertPizzaBaseSchema = createInsertSchema(pizzaBases);
export const insertPizzaSauceSchema = createInsertSchema(pizzaSauces);
export const insertPizzaCheeseSchema = createInsertSchema(pizzaCheeses);
export const insertPizzaToppingSchema = createInsertSchema(pizzaToppings);

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  totalAmount: true,
  deliveryAddress: true,
  contactNumber: true,
  estimatedDeliveryTime: true,
  deliveryNotes: true,
  discountCode: true,
  discountAmount: true,
  isSubscriptionOrder: true,
  subscriptionId: true,
  paymentMethodId: true,
  loyaltyPointsRedeemed: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  pizzaDetails: true,
  price: true,
  quantity: true,
  specialInstructions: true,
  isFromSavedConfig: true,
  savedConfigId: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type CustomPizza = typeof customPizzas.$inferSelect;
export type InsertCustomPizza = z.infer<typeof insertCustomPizzaSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type PizzaBase = typeof pizzaBases.$inferSelect;
export type InsertPizzaBase = z.infer<typeof insertPizzaBaseSchema>;

export type PizzaSauce = typeof pizzaSauces.$inferSelect;
export type InsertPizzaSauce = z.infer<typeof insertPizzaSauceSchema>;

export type PizzaCheese = typeof pizzaCheeses.$inferSelect;
export type InsertPizzaCheese = z.infer<typeof insertPizzaCheeseSchema>;

export type PizzaTopping = typeof pizzaToppings.$inferSelect;
export type InsertPizzaTopping = z.infer<typeof insertPizzaToppingSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Pizza configurations for customization
export interface PizzaConfig {
  base: PizzaBase | null;
  sauce: PizzaSauce | null;
  cheese: PizzaCheese | null;
  toppings: PizzaTopping[];
}

// Membership tier levels
export const membershipTierEnum = z.enum([
  "bronze",
  "silver",
  "gold",
  "platinum",
]);

export type MembershipTier = z.infer<typeof membershipTierEnum>;

// Payment method types
export const paymentMethodTypeEnum = z.enum([
  "credit",
  "debit",
  "paypal",
  "apple_pay",
  "google_pay",
]);

export type PaymentMethodType = z.infer<typeof paymentMethodTypeEnum>;

// User subscription statuses
export const subscriptionStatusEnum = z.enum([
  "active",
  "paused",
  "cancelled",
  "expired",
]);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

// Promotion discount types
export const discountTypeEnum = z.enum([
  "percentage",
  "fixed",
]);

export type DiscountType = z.infer<typeof discountTypeEnum>;

// Notification types
export const notificationTypeEnum = z.enum([
  "order",
  "promotion",
  "system",
  "loyalty",
  "subscription",
]);

export type NotificationType = z.infer<typeof notificationTypeEnum>;

// Order tracking status types (extended from original)
export const orderStatusEnum = z.enum([
  "pending",
  "received",
  "preparing",
  "cooking",
  "quality_check",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export type OrderStatus = z.infer<typeof orderStatusEnum>;

// Payment statuses
export const paymentStatusEnum = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
]);

export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

// Define authentication types for login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;

// Define schema for password reset
export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

// Define schema for user profile update
export const updateProfileSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  profilePicture: z.string().optional(),
});

export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

// Define schema for adding a review
export const reviewSchema = z.object({
  orderId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type ReviewData = z.infer<typeof reviewSchema>;

// Define schema for subscribing to a plan
export const subscribeSchema = z.object({
  planId: z.number().int().positive(),
  paymentMethodId: z.number().int().positive(),
  defaultAddressId: z.number().int().positive(),
  defaultPizzaConfig: z.any(), // This will be a PizzaConfig object
  startDate: z.date().optional(),
});

export type SubscribeData = z.infer<typeof subscribeSchema>;

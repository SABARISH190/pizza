import { 
  users, pizzaBases, pizzaSauces, pizzaCheeses, pizzaToppings, orders, orderItems,
  userAddresses, paymentMethods, reviews, customPizzas, subscriptionPlans,
  userSubscriptions, promotions, notifications
} from "@shared/schema";
import type { 
  User, InsertUser, PizzaBase, InsertPizzaBase,
  PizzaSauce, InsertPizzaSauce, PizzaCheese, InsertPizzaCheese,
  PizzaTopping, InsertPizzaTopping, Order, InsertOrder,
  OrderItem, InsertOrderItem, OrderStatus, UserAddress, InsertUserAddress,
  PaymentMethod, InsertPaymentMethod, Review, InsertReview,
  CustomPizza, InsertCustomPizza, SubscriptionPlan, InsertSubscriptionPlan,
  UserSubscription, InsertUserSubscription, Promotion, InsertPromotion,
  Notification, InsertNotification, PizzaConfig
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";
import { eq, and, lt, gt, gte, lte, desc, like, or, inArray, notInArray } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(id: number, isVerified: boolean): Promise<User | undefined>;
  updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<User | undefined>;
  updateUserProfile(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserLoyaltyPoints(id: number, points: number): Promise<User | undefined>;
  updateUserMembershipTier(id: number, tier: string): Promise<User | undefined>;
  
  // User address operations
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  getUserAddress(id: number): Promise<UserAddress | undefined>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: number, updates: Partial<UserAddress>): Promise<UserAddress | undefined>;
  deleteUserAddress(id: number): Promise<boolean>;
  setDefaultUserAddress(userId: number, addressId: number): Promise<boolean>;
  
  // Payment method operations
  getUserPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  getUserPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: number, updates: Partial<PaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: number): Promise<boolean>;
  setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<boolean>;
  
  // Review operations
  getOrderReviews(orderId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Custom pizza operations
  getCustomPizzas(userId?: number): Promise<CustomPizza[]>;
  getCustomPizza(id: number): Promise<CustomPizza | undefined>;
  createCustomPizza(pizza: InsertCustomPizza): Promise<CustomPizza>;
  updateCustomPizza(id: number, updates: Partial<CustomPizza>): Promise<CustomPizza | undefined>;
  deleteCustomPizza(id: number): Promise<boolean>;
  likeCustomPizza(id: number): Promise<CustomPizza | undefined>;
  
  // Subscription plan operations
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  toggleSubscriptionPlanStatus(id: number): Promise<SubscriptionPlan | undefined>;
  
  // User subscription operations
  getUserSubscriptions(userId: number): Promise<UserSubscription[]>;
  getUserSubscription(id: number): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  cancelUserSubscription(id: number): Promise<UserSubscription | undefined>;
  pauseUserSubscription(id: number): Promise<UserSubscription | undefined>;
  resumeUserSubscription(id: number): Promise<UserSubscription | undefined>;
  
  // Promotion operations
  getAllPromotions(): Promise<Promotion[]>;
  getPromotionByCode(code: string): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined>;
  incrementPromotionUse(id: number): Promise<Promotion | undefined>;
  validatePromotion(code: string, orderAmount: number): Promise<Promotion | undefined>;
  
  // Notification operations
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUnreadUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllUserNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Pizza base operations
  getAllPizzaBases(): Promise<PizzaBase[]>;
  getPizzaBase(id: number): Promise<PizzaBase | undefined>;
  createPizzaBase(base: InsertPizzaBase): Promise<PizzaBase>;
  updatePizzaBaseStock(id: number, stock: number): Promise<PizzaBase | undefined>;
  
  // Pizza sauce operations
  getAllPizzaSauces(): Promise<PizzaSauce[]>;
  getPizzaSauce(id: number): Promise<PizzaSauce | undefined>;
  createPizzaSauce(sauce: InsertPizzaSauce): Promise<PizzaSauce>;
  updatePizzaSauceStock(id: number, stock: number): Promise<PizzaSauce | undefined>;
  
  // Pizza cheese operations
  getAllPizzaCheeses(): Promise<PizzaCheese[]>;
  getPizzaCheese(id: number): Promise<PizzaCheese | undefined>;
  createPizzaCheese(cheese: InsertPizzaCheese): Promise<PizzaCheese>;
  updatePizzaCheeseStock(id: number, stock: number): Promise<PizzaCheese | undefined>;
  
  // Pizza topping operations
  getAllPizzaToppings(): Promise<PizzaTopping[]>;
  getPizzaTopping(id: number): Promise<PizzaTopping | undefined>;
  createPizzaTopping(topping: InsertPizzaTopping): Promise<PizzaTopping>;
  updatePizzaToppingStock(id: number, stock: number): Promise<PizzaTopping | undefined>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined>;
  updateOrderPayment(id: number, paymentId: string, paymentStatus: string): Promise<Order | undefined>;
  updateOrderTracking(id: number, trackingUrl: string, estimatedDeliveryTime: Date): Promise<Order | undefined>;
  setOrderDelivered(id: number): Promise<Order | undefined>;
  
  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItemInstructions(id: number, instructions: string): Promise<OrderItem | undefined>;
  
  // Recommendation operations
  getRecommendedToppingsForUser(userId: number): Promise<PizzaTopping[]>;
  getPopularPizzaConfigs(): Promise<PizzaConfig[]>;
  getSimilarPizzaConfigs(config: PizzaConfig): Promise<PizzaConfig[]>;
  
  // Analytics operations
  getTopSellingItems(period?: string): Promise<any[]>;
  getOrderAnalytics(period?: string): Promise<any>;
  getUserRetentionStats(): Promise<any>;
  getRevenueStats(period?: string): Promise<any>;
  
  // Check inventory status
  getLowStockItems(): Promise<(PizzaBase | PizzaSauce | PizzaCheese | PizzaTopping)[]>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pizzaBases: Map<number, PizzaBase>;
  private pizzaSauces: Map<number, PizzaSauce>;
  private pizzaCheeses: Map<number, PizzaCheese>;
  private pizzaToppings: Map<number, PizzaTopping>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  private userCurrentId: number;
  private baseCurrentId: number;
  private sauceCurrentId: number;
  private cheeseCurrentId: number;
  private toppingCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.pizzaBases = new Map();
    this.pizzaSauces = new Map();
    this.pizzaCheeses = new Map();
    this.pizzaToppings = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userCurrentId = 1;
    this.baseCurrentId = 1;
    this.sauceCurrentId = 1;
    this.cheeseCurrentId = 1;
    this.toppingCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 1 day in ms
    });
    
    // Initialize with default data
    this.initializeData();
  }

  private initializeData() {
    // Add default pizza bases
    this.createPizzaBase({
      name: "Traditional",
      description: "Classic hand-tossed dough with perfect thickness",
      price: 199,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 45,
      threshold: 20
    });
    
    this.createPizzaBase({
      name: "Thin Crust",
      description: "Light and crispy thin base for a crunchier bite",
      price: 179,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 12,
      threshold: 20
    });
    
    this.createPizzaBase({
      name: "Deep Dish",
      description: "Thick crust with a deep edge for more toppings",
      price: 249,
      image: "https://images.unsplash.com/photo-1593504049359-74330189a345?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 30,
      threshold: 20
    });
    
    this.createPizzaBase({
      name: "Stuffed Crust",
      description: "Cheese-filled crust for an extra cheesy experience",
      price: 299,
      image: "https://images.unsplash.com/photo-1589840700256-41c5d199e5d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 25,
      threshold: 20
    });
    
    this.createPizzaBase({
      name: "Multigrain",
      description: "Healthy multigrain option with wholesome flavor",
      price: 229,
      image: "https://images.unsplash.com/photo-1595854341625-f33e32bc3888?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 18,
      threshold: 20
    });
    
    // Add default pizza sauces
    this.createPizzaSauce({
      name: "Marinara",
      description: "Classic tomato sauce with Italian herbs",
      price: 49,
      image: "https://images.unsplash.com/photo-1575000771657-8e5e0be9e949?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 5,
      threshold: 10
    });
    
    this.createPizzaSauce({
      name: "Pesto",
      description: "Fresh basil, pine nuts, and olive oil blend",
      price: 79,
      image: "https://images.unsplash.com/photo-1606576874542-2f759d322ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 15,
      threshold: 10
    });
    
    this.createPizzaSauce({
      name: "Alfredo",
      description: "Creamy white sauce with garlic and parmesan",
      price: 89,
      image: "https://images.unsplash.com/photo-1596716587659-a755a4933f7f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 20,
      threshold: 10
    });
    
    this.createPizzaSauce({
      name: "BBQ",
      description: "Sweet and tangy barbecue sauce",
      price: 69,
      image: "https://images.unsplash.com/photo-1606576874542-2f759d322ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 25,
      threshold: 10
    });
    
    this.createPizzaSauce({
      name: "Buffalo",
      description: "Spicy buffalo sauce with a kick",
      price: 79,
      image: "https://images.unsplash.com/photo-1606576874542-2f759d322ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 18,
      threshold: 10
    });
    
    // Add default pizza cheeses
    this.createPizzaCheese({
      name: "Mozzarella",
      description: "Classic stretchy pizza cheese",
      price: 99,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 30,
      threshold: 15
    });
    
    this.createPizzaCheese({
      name: "Cheddar",
      description: "Sharp and tangy flavor",
      price: 89,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 25,
      threshold: 15
    });
    
    this.createPizzaCheese({
      name: "Parmesan",
      description: "Aged Italian hard cheese with strong flavor",
      price: 109,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 20,
      threshold: 15
    });
    
    // Add default pizza toppings
    this.createPizzaTopping({
      name: "Mushrooms",
      description: "Fresh sliced mushrooms",
      price: 59,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 22,
      threshold: 15
    });
    
    this.createPizzaTopping({
      name: "Bell Peppers",
      description: "Colorful bell peppers",
      price: 49,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 18,
      threshold: 15
    });
    
    this.createPizzaTopping({
      name: "Olives",
      description: "Sliced black olives",
      price: 69,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 15,
      threshold: 10
    });
    
    this.createPizzaTopping({
      name: "Onions",
      description: "Sliced red onions",
      price: 39,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 20,
      threshold: 10
    });
    
    this.createPizzaTopping({
      name: "Chicken",
      description: "Grilled chicken pieces",
      price: 129,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: false,
      stock: 25,
      threshold: 15
    });
    
    this.createPizzaTopping({
      name: "Pepperoni",
      description: "Spicy pepperoni slices",
      price: 119,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: false,
      stock: 30,
      threshold: 15
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser,
      id,
      emailVerified: false,
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserVerification(id: number, isVerified: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      emailVerified: isVerified,
      verificationToken: null
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      resetToken: token,
      resetTokenExpiry: expiry
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Pizza base operations
  async getAllPizzaBases(): Promise<PizzaBase[]> {
    return Array.from(this.pizzaBases.values());
  }
  
  async getPizzaBase(id: number): Promise<PizzaBase | undefined> {
    return this.pizzaBases.get(id);
  }
  
  async createPizzaBase(base: InsertPizzaBase): Promise<PizzaBase> {
    const id = this.baseCurrentId++;
    const pizzaBase: PizzaBase = { ...base, id };
    this.pizzaBases.set(id, pizzaBase);
    return pizzaBase;
  }
  
  async updatePizzaBaseStock(id: number, stock: number): Promise<PizzaBase | undefined> {
    const base = await this.getPizzaBase(id);
    if (!base) return undefined;
    
    const updatedBase: PizzaBase = {
      ...base,
      stock
    };
    
    this.pizzaBases.set(id, updatedBase);
    return updatedBase;
  }
  
  // Pizza sauce operations
  async getAllPizzaSauces(): Promise<PizzaSauce[]> {
    return Array.from(this.pizzaSauces.values());
  }
  
  async getPizzaSauce(id: number): Promise<PizzaSauce | undefined> {
    return this.pizzaSauces.get(id);
  }
  
  async createPizzaSauce(sauce: InsertPizzaSauce): Promise<PizzaSauce> {
    const id = this.sauceCurrentId++;
    const pizzaSauce: PizzaSauce = { ...sauce, id };
    this.pizzaSauces.set(id, pizzaSauce);
    return pizzaSauce;
  }
  
  async updatePizzaSauceStock(id: number, stock: number): Promise<PizzaSauce | undefined> {
    const sauce = await this.getPizzaSauce(id);
    if (!sauce) return undefined;
    
    const updatedSauce: PizzaSauce = {
      ...sauce,
      stock
    };
    
    this.pizzaSauces.set(id, updatedSauce);
    return updatedSauce;
  }
  
  // Pizza cheese operations
  async getAllPizzaCheeses(): Promise<PizzaCheese[]> {
    return Array.from(this.pizzaCheeses.values());
  }
  
  async getPizzaCheese(id: number): Promise<PizzaCheese | undefined> {
    return this.pizzaCheeses.get(id);
  }
  
  async createPizzaCheese(cheese: InsertPizzaCheese): Promise<PizzaCheese> {
    const id = this.cheeseCurrentId++;
    const pizzaCheese: PizzaCheese = { ...cheese, id };
    this.pizzaCheeses.set(id, pizzaCheese);
    return pizzaCheese;
  }
  
  async updatePizzaCheeseStock(id: number, stock: number): Promise<PizzaCheese | undefined> {
    const cheese = await this.getPizzaCheese(id);
    if (!cheese) return undefined;
    
    const updatedCheese: PizzaCheese = {
      ...cheese,
      stock
    };
    
    this.pizzaCheeses.set(id, updatedCheese);
    return updatedCheese;
  }
  
  // Pizza topping operations
  async getAllPizzaToppings(): Promise<PizzaTopping[]> {
    return Array.from(this.pizzaToppings.values());
  }
  
  async getPizzaTopping(id: number): Promise<PizzaTopping | undefined> {
    return this.pizzaToppings.get(id);
  }
  
  async createPizzaTopping(topping: InsertPizzaTopping): Promise<PizzaTopping> {
    const id = this.toppingCurrentId++;
    const pizzaTopping: PizzaTopping = { ...topping, id };
    this.pizzaToppings.set(id, pizzaTopping);
    return pizzaTopping;
  }
  
  async updatePizzaToppingStock(id: number, stock: number): Promise<PizzaTopping | undefined> {
    const topping = await this.getPizzaTopping(id);
    if (!topping) return undefined;
    
    const updatedTopping: PizzaTopping = {
      ...topping,
      stock
    };
    
    this.pizzaToppings.set(id, updatedTopping);
    return updatedTopping;
  }
  
  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const now = new Date();
    
    const newOrder: Order = {
      ...order,
      id,
      status: "pending",
      paymentId: null,
      paymentStatus: "pending",
      createdAt: now,
      updatedAt: now
    };
    
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateOrderPayment(id: number, paymentId: string, paymentStatus: string): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      paymentId,
      paymentStatus,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Order item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemCurrentId++;
    const orderItem: OrderItem = { ...item, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
  
  // Check inventory status
  async getLowStockItems(): Promise<(PizzaBase | PizzaSauce | PizzaCheese | PizzaTopping)[]> {
    const lowStockItems: (PizzaBase | PizzaSauce | PizzaCheese | PizzaTopping)[] = [];
    
    // Check pizza bases
    for (const base of this.pizzaBases.values()) {
      if (base.stock <= base.threshold) {
        lowStockItems.push(base);
      }
    }
    
    // Check pizza sauces
    for (const sauce of this.pizzaSauces.values()) {
      if (sauce.stock <= sauce.threshold) {
        lowStockItems.push(sauce);
      }
    }
    
    // Check pizza cheeses
    for (const cheese of this.pizzaCheeses.values()) {
      if (cheese.stock <= cheese.threshold) {
        lowStockItems.push(cheese);
      }
    }
    
    // Check pizza toppings
    for (const topping of this.pizzaToppings.values()) {
      if (topping.stock <= topping.threshold) {
        lowStockItems.push(topping);
      }
    }
    
    return lowStockItems;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        emailVerified: false,
        verificationToken: null,
        resetToken: null,
        resetTokenExpiry: null
      })
      .returning();
    return user;
  }
  
  async updateUserVerification(id: number, isVerified: boolean): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        emailVerified: isVerified,
        verificationToken: null
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async updateUserResetToken(id: number, token: string | null, expiry: Date | null): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        resetToken: token,
        resetTokenExpiry: expiry
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserProfile(id: number, updates: Partial<User>): Promise<User | undefined> {
    // Remove sensitive or protected fields that shouldn't be updated directly
    const { id: _, password, emailVerified, verificationToken, resetToken, resetTokenExpiry, ...safeUpdates } = updates;
    
    const [updatedUser] = await db
      .update(users)
      .set(safeUpdates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserLoyaltyPoints(id: number, points: number): Promise<User | undefined> {
    // First get the current user to see their current points
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const newPoints = user.loyaltyPoints + points;
    
    const [updatedUser] = await db
      .update(users)
      .set({ loyaltyPoints: newPoints >= 0 ? newPoints : 0 }) // Ensure points don't go below 0
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserMembershipTier(id: number, tier: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ membershipTier: tier })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  // User address operations
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId));
  }
  
  async getUserAddress(id: number): Promise<UserAddress | undefined> {
    const [address] = await db.select().from(userAddresses).where(eq(userAddresses.id, id));
    return address || undefined;
  }
  
  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const [newAddress] = await db
      .insert(userAddresses)
      .values(address)
      .returning();
    return newAddress;
  }
  
  async updateUserAddress(id: number, updates: Partial<UserAddress>): Promise<UserAddress | undefined> {
    // Remove fields that shouldn't be updated directly
    const { id: _, userId, ...safeUpdates } = updates;
    
    const [updatedAddress] = await db
      .update(userAddresses)
      .set(safeUpdates)
      .where(eq(userAddresses.id, id))
      .returning();
    return updatedAddress || undefined;
  }
  
  async deleteUserAddress(id: number): Promise<boolean> {
    const result = await db
      .delete(userAddresses)
      .where(eq(userAddresses.id, id));
    return result.rowCount > 0;
  }
  
  async setDefaultUserAddress(userId: number, addressId: number): Promise<boolean> {
    // First set all addresses for this user to not be default
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId));
    
    // Then set the specified address to be default
    const [updatedAddress] = await db
      .update(userAddresses)
      .set({ isDefault: true })
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, userId)
      ))
      .returning();
    
    return !!updatedAddress;
  }
  
  // Payment method operations
  async getUserPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }
  
  async getUserPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod || undefined;
  }
  
  async createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [newPaymentMethod] = await db
      .insert(paymentMethods)
      .values(paymentMethod)
      .returning();
    return newPaymentMethod;
  }
  
  async updatePaymentMethod(id: number, updates: Partial<PaymentMethod>): Promise<PaymentMethod | undefined> {
    // Remove fields that shouldn't be updated directly
    const { id: _, userId, ...safeUpdates } = updates;
    
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set(safeUpdates)
      .where(eq(paymentMethods.id, id))
      .returning();
    return updatedPaymentMethod || undefined;
  }
  
  async deletePaymentMethod(id: number): Promise<boolean> {
    const result = await db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id));
    return result.rowCount > 0;
  }
  
  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<boolean> {
    // First set all payment methods for this user to not be default
    await db
      .update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));
    
    // Then set the specified payment method to be default
    const [updatedPaymentMethod] = await db
      .update(paymentMethods)
      .set({ isDefault: true })
      .where(and(
        eq(paymentMethods.id, paymentMethodId),
        eq(paymentMethods.userId, userId)
      ))
      .returning();
    
    return !!updatedPaymentMethod;
  }
  
  // Pizza base operations
  async getAllPizzaBases(): Promise<PizzaBase[]> {
    return await db.select().from(pizzaBases);
  }
  
  async getPizzaBase(id: number): Promise<PizzaBase | undefined> {
    const [base] = await db.select().from(pizzaBases).where(eq(pizzaBases.id, id));
    return base || undefined;
  }
  
  async createPizzaBase(base: InsertPizzaBase): Promise<PizzaBase> {
    const [pizzaBase] = await db
      .insert(pizzaBases)
      .values(base)
      .returning();
    return pizzaBase;
  }
  
  async updatePizzaBaseStock(id: number, stock: number): Promise<PizzaBase | undefined> {
    const [updatedBase] = await db
      .update(pizzaBases)
      .set({ stock })
      .where(eq(pizzaBases.id, id))
      .returning();
    return updatedBase || undefined;
  }
  
  // Pizza sauce operations
  async getAllPizzaSauces(): Promise<PizzaSauce[]> {
    return await db.select().from(pizzaSauces);
  }
  
  async getPizzaSauce(id: number): Promise<PizzaSauce | undefined> {
    const [sauce] = await db.select().from(pizzaSauces).where(eq(pizzaSauces.id, id));
    return sauce || undefined;
  }
  
  async createPizzaSauce(sauce: InsertPizzaSauce): Promise<PizzaSauce> {
    const [pizzaSauce] = await db
      .insert(pizzaSauces)
      .values(sauce)
      .returning();
    return pizzaSauce;
  }
  
  async updatePizzaSauceStock(id: number, stock: number): Promise<PizzaSauce | undefined> {
    const [updatedSauce] = await db
      .update(pizzaSauces)
      .set({ stock })
      .where(eq(pizzaSauces.id, id))
      .returning();
    return updatedSauce || undefined;
  }
  
  // Pizza cheese operations
  async getAllPizzaCheeses(): Promise<PizzaCheese[]> {
    return await db.select().from(pizzaCheeses);
  }
  
  async getPizzaCheese(id: number): Promise<PizzaCheese | undefined> {
    const [cheese] = await db.select().from(pizzaCheeses).where(eq(pizzaCheeses.id, id));
    return cheese || undefined;
  }
  
  async createPizzaCheese(cheese: InsertPizzaCheese): Promise<PizzaCheese> {
    const [pizzaCheese] = await db
      .insert(pizzaCheeses)
      .values(cheese)
      .returning();
    return pizzaCheese;
  }
  
  async updatePizzaCheeseStock(id: number, stock: number): Promise<PizzaCheese | undefined> {
    const [updatedCheese] = await db
      .update(pizzaCheeses)
      .set({ stock })
      .where(eq(pizzaCheeses.id, id))
      .returning();
    return updatedCheese || undefined;
  }
  
  // Pizza topping operations
  async getAllPizzaToppings(): Promise<PizzaTopping[]> {
    return await db.select().from(pizzaToppings);
  }
  
  async getPizzaTopping(id: number): Promise<PizzaTopping | undefined> {
    const [topping] = await db.select().from(pizzaToppings).where(eq(pizzaToppings.id, id));
    return topping || undefined;
  }
  
  async createPizzaTopping(topping: InsertPizzaTopping): Promise<PizzaTopping> {
    const [pizzaTopping] = await db
      .insert(pizzaToppings)
      .values(topping)
      .returning();
    return pizzaTopping;
  }
  
  async updatePizzaToppingStock(id: number, stock: number): Promise<PizzaTopping | undefined> {
    const [updatedTopping] = await db
      .update(pizzaToppings)
      .set({ stock })
      .where(eq(pizzaToppings.id, id))
      .returning();
    return updatedTopping || undefined;
  }
  
  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const now = new Date();
    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        status: "pending",
        paymentId: null,
        paymentStatus: "pending",
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }
  
  async updateOrderPayment(id: number, paymentId: string, paymentStatus: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        paymentId,
        paymentStatus,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async updateOrderPromotion(id: number, promotionId: number, discountAmount: number): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        promotionId,
        discountAmount,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async updateOrderLoyaltyDiscount(id: number, loyaltyDiscountAmount: number, loyaltyPointsRedeemed: number): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        loyaltyDiscountAmount,
        loyaltyPointsRedeemed,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }
  
  // Order item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return orderItem;
  }
  
  async updateOrderItemInstructions(id: number, instructions: string): Promise<OrderItem | undefined> {
    const [updatedItem] = await db
      .update(orderItems)
      .set({ specialInstructions: instructions })
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem || undefined;
  }
  
  async updateOrderTracking(id: number, trackingUrl: string, estimatedDeliveryTime: Date): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        trackingUrl,
        estimatedDeliveryTime,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }
  
  async setOrderDelivered(id: number): Promise<Order | undefined> {
    const now = new Date();
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        status: "delivered",
        actualDeliveryTime: now,
        updatedAt: now
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }
  
  // Review operations
  async getOrderReviews(orderId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.orderId, orderId));
  }
  
  async getUserReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }
  
  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    // Remove fields that shouldn't be updated directly
    const { id: _, userId, orderId, createdAt, ...safeUpdates } = updates;
    
    const [updatedReview] = await db
      .update(reviews)
      .set(safeUpdates)
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview || undefined;
  }
  
  async deleteReview(id: number): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id, id));
    return result.rowCount > 0;
  }
  
  // Notification operations
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }
  
  async getUnreadUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const now = new Date();
    const [newNotification] = await db
      .insert(notifications)
      .values({
        ...notification,
        createdAt: now
      })
      .returning();
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification || undefined;
  }
  
  async markAllUserNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.rowCount > 0;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }
  
  // Check inventory status
  // Subscription plan operations
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }
  
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: number, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    // Remove fields that shouldn't be updated directly
    const { id: _, ...safeUpdates } = updates;
    
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(safeUpdates)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }
  
  async toggleSubscriptionPlanStatus(id: number): Promise<SubscriptionPlan | undefined> {
    // First get the current plan to see its active status
    const plan = await this.getSubscriptionPlan(id);
    if (!plan) return undefined;
    
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ isActive: !plan.isActive })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }
  
  // User subscription operations
  async getUserSubscriptions(userId: number): Promise<UserSubscription[]> {
    return await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, userId));
  }
  
  async getUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id));
    return subscription || undefined;
  }
  
  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const now = new Date();
    
    const [newSubscription] = await db
      .insert(userSubscriptions)
      .values({
        ...subscription,
        startDate: now,
        status: "active",
        nextBillingDate: new Date(now.getTime() + (subscription.billingCycleInDays * 24 * 60 * 60 * 1000))
      })
      .returning();
    return newSubscription;
  }
  
  async updateUserSubscription(id: number, updates: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    // Remove fields that shouldn't be updated directly
    const { id: _, userId, planId, startDate, ...safeUpdates } = updates;
    
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set(safeUpdates)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription || undefined;
  }
  
  async cancelUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const [cancelledSubscription] = await db
      .update(userSubscriptions)
      .set({ 
        status: "cancelled",
        cancelDate: new Date()
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return cancelledSubscription || undefined;
  }
  
  async pauseUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const [pausedSubscription] = await db
      .update(userSubscriptions)
      .set({ status: "paused" })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return pausedSubscription || undefined;
  }
  
  async resumeUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const [resumedSubscription] = await db
      .update(userSubscriptions)
      .set({ status: "active" })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return resumedSubscription || undefined;
  }
  
  // Promotion operations
  async getAllPromotions(): Promise<Promotion[]> {
    return await db.select().from(promotions);
  }
  
  async getPromotionByCode(code: string): Promise<Promotion | undefined> {
    const [promotion] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.code, code));
    return promotion || undefined;
  }
  
  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    const [newPromotion] = await db
      .insert(promotions)
      .values(promotion)
      .returning();
    return newPromotion;
  }
  
  async updatePromotion(id: number, updates: Partial<Promotion>): Promise<Promotion | undefined> {
    // Remove fields that shouldn't be updated directly
    const { id: _, code, ...safeUpdates } = updates;
    
    const [updatedPromotion] = await db
      .update(promotions)
      .set(safeUpdates)
      .where(eq(promotions.id, id))
      .returning();
    return updatedPromotion || undefined;
  }
  
  async incrementPromotionUse(id: number): Promise<Promotion | undefined> {
    // First get the current promotion to see its use count
    const promotion = await this.getPromotionByCode(id.toString()); // assuming code is stored as string
    if (!promotion) return undefined;
    
    const [updatedPromotion] = await db
      .update(promotions)
      .set({ usageCount: promotion.usageCount + 1 })
      .where(eq(promotions.id, id))
      .returning();
    return updatedPromotion || undefined;
  }
  
  async validatePromotion(code: string, orderAmount: number): Promise<Promotion | undefined> {
    const now = new Date();
    
    const [validPromotion] = await db
      .select()
      .from(promotions)
      .where(and(
        eq(promotions.code, code),
        eq(promotions.isActive, true),
        lte(promotions.startDate, now),
        gte(promotions.endDate, now),
        lt(promotions.usageCount, promotions.maxUsage),
        lte(promotions.minOrderAmount, orderAmount)
      ));
    
    return validPromotion || undefined;
  }
  
  // Recommendation operations
  async getRecommendedToppingsForUser(userId: number): Promise<PizzaTopping[]> {
    // Get user's past orders
    const userOrders = await this.getOrdersByUser(userId);
    
    if (userOrders.length === 0) {
      // If user has no orders, return the most popular toppings
      const popularToppings = await db
        .select()
        .from(pizzaToppings)
        .orderBy(desc(pizzaToppings.popularity))
        .limit(4);
      
      return popularToppings;
    }
    
    // Get order items from past orders
    const orderIds = userOrders.map(order => order.id);
    const orderItemsPromises = orderIds.map(id => this.getOrderItems(id));
    const orderItemsArrays = await Promise.all(orderItemsPromises);
    
    // Flatten the array of order items
    const orderItems = orderItemsArrays.flat();
    
    // Extract topping IDs from pizza details in order items
    const toppingIds = new Set<number>();
    for (const item of orderItems) {
      const pizzaDetails = item.pizzaDetails as any;
      if (pizzaDetails?.toppings && Array.isArray(pizzaDetails.toppings)) {
        for (const topping of pizzaDetails.toppings) {
          if (topping.id) {
            toppingIds.add(topping.id);
          }
        }
      }
    }
    
    if (toppingIds.size === 0) {
      // If no toppings found, return popular toppings
      const popularToppings = await db
        .select()
        .from(pizzaToppings)
        .orderBy(desc(pizzaToppings.popularity))
        .limit(4);
      
      return popularToppings;
    }
    
    // Get the toppings the user has ordered before
    const userToppings = await db
      .select()
      .from(pizzaToppings)
      .where(inArray(pizzaToppings.id, Array.from(toppingIds)));
    
    // Get complementary toppings that pair well with user's preferred toppings
    const complementaryToppings = await db
      .select()
      .from(pizzaToppings)
      .where(
        and(
          notInArray(pizzaToppings.id, Array.from(toppingIds)),
          eq(pizzaToppings.isVeg, userToppings.some(t => t.isVeg)) // Match the user's vegetarian preference
        )
      )
      .orderBy(desc(pizzaToppings.popularity))
      .limit(2);
    
    // Combine user's preferred toppings and complementary toppings
    return [...userToppings, ...complementaryToppings].slice(0, 4);
  }
  
  async getPopularPizzaConfigs(): Promise<PizzaConfig[]> {
    // This is a complex query - in a real implementation, we would analyze order items
    // For now, return a fixed set of popular configurations
    
    const bases = await this.getAllPizzaBases();
    const sauces = await this.getAllPizzaSauces();
    const cheeses = await this.getAllPizzaCheeses();
    const toppings = await this.getAllPizzaToppings();
    
    // Create some sample popular configurations
    const popularConfigs: PizzaConfig[] = [
      {
        base: bases.find(b => b.name === "Traditional") || null,
        sauce: sauces.find(s => s.name === "Marinara") || null,
        cheese: cheeses.find(c => c.name === "Mozzarella") || null,
        toppings: toppings.filter(t => ["Pepperoni", "Mushrooms"].includes(t.name))
      },
      {
        base: bases.find(b => b.name === "Thin Crust") || null,
        sauce: sauces.find(s => s.name === "Pesto") || null,
        cheese: cheeses.find(c => c.name === "Mozzarella") || null,
        toppings: toppings.filter(t => ["Chicken", "Onions"].includes(t.name))
      },
      {
        base: bases.find(b => b.name === "Stuffed Crust") || null,
        sauce: sauces.find(s => s.name === "BBQ") || null,
        cheese: cheeses.find(c => c.name === "Cheddar") || null,
        toppings: toppings.filter(t => ["Chicken", "Bell Peppers", "Onions"].includes(t.name))
      }
    ];
    
    return popularConfigs;
  }
  
  async getSimilarPizzaConfigs(config: PizzaConfig): Promise<PizzaConfig[]> {
    // In a real implementation, we would find truly similar configurations
    // For now, just return other configurations that share some components
    
    const bases = await this.getAllPizzaBases();
    const sauces = await this.getAllPizzaSauces();
    const cheeses = await this.getAllPizzaCheeses();
    const toppings = await this.getAllPizzaToppings();
    
    // Create configurations that share some components with the input config
    const similarConfigs: PizzaConfig[] = [];
    
    // Same base, different sauce
    if (config.base) {
      const differentSauces = sauces.filter(s => s.id !== config.sauce?.id).slice(0, 2);
      for (const sauce of differentSauces) {
        similarConfigs.push({
          base: config.base,
          sauce,
          cheese: config.cheese,
          toppings: config.toppings.slice(0, 1) // Use just the first topping
        });
      }
    }
    
    // Same sauce, different base
    if (config.sauce) {
      const differentBases = bases.filter(b => b.id !== config.base?.id).slice(0, 2);
      for (const base of differentBases) {
        similarConfigs.push({
          base,
          sauce: config.sauce,
          cheese: config.cheese,
          toppings: config.toppings.slice(0, 1) // Use just the first topping
        });
      }
    }
    
    return similarConfigs.slice(0, 3); // Return at most 3 similar configurations
  }
  
  // Analytics operations
  async getTopSellingItems(period?: string): Promise<any[]> {
    // Calculate date range based on period
    let startDate = new Date();
    const endDate = new Date();
    
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get all order items from the date range
    const recentOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );
    
    const orderIds = recentOrders.map(order => order.id);
    
    const orderItems: OrderItem[] = [];
    for (const orderId of orderIds) {
      const items = await this.getOrderItems(orderId);
      orderItems.push(...items);
    }
    
    // Count occurrences of each component
    const baseCount: Record<number, number> = {};
    const sauceCount: Record<number, number> = {};
    const cheeseCount: Record<number, number> = {};
    const toppingCount: Record<number, number> = {};
    
    for (const item of orderItems) {
      const pizzaDetails = item.pizzaDetails as any;
      
      if (pizzaDetails?.base?.id) {
        baseCount[pizzaDetails.base.id] = (baseCount[pizzaDetails.base.id] || 0) + 1;
      }
      
      if (pizzaDetails?.sauce?.id) {
        sauceCount[pizzaDetails.sauce.id] = (sauceCount[pizzaDetails.sauce.id] || 0) + 1;
      }
      
      if (pizzaDetails?.cheese?.id) {
        cheeseCount[pizzaDetails.cheese.id] = (cheeseCount[pizzaDetails.cheese.id] || 0) + 1;
      }
      
      if (pizzaDetails?.toppings && Array.isArray(pizzaDetails.toppings)) {
        for (const topping of pizzaDetails.toppings) {
          if (topping.id) {
            toppingCount[topping.id] = (toppingCount[topping.id] || 0) + 1;
          }
        }
      }
    }
    
    // Get top 5 items of each category
    const getTopItems = async (counts: Record<number, number>, table: any, typeName: string) => {
      const topIds = Object.entries(counts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(entry => parseInt(entry[0]));
      
      const items = [];
      for (const id of topIds) {
        const item = await db
          .select()
          .from(table)
          .where(eq(table.id, id))
          .then(rows => rows[0]);
        
        if (item) {
          items.push({
            ...item,
            count: counts[id],
            type: typeName
          });
        }
      }
      
      return items;
    };
    
    const topBases = await getTopItems(baseCount, pizzaBases, "base");
    const topSauces = await getTopItems(sauceCount, pizzaSauces, "sauce");
    const topCheeses = await getTopItems(cheeseCount, pizzaCheeses, "cheese");
    const topToppings = await getTopItems(toppingCount, pizzaToppings, "topping");
    
    return [...topBases, ...topSauces, ...topCheeses, ...topToppings];
  }
  
  async getOrderAnalytics(period?: string): Promise<any> {
    // Calculate date range based on period
    let startDate = new Date();
    const endDate = new Date();
    
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get orders from the date range
    const recentOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );
    
    // Calculate analytics
    const totalOrders = recentOrders.length;
    const totalSales = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Count orders by status
    const ordersByStatus: Record<string, number> = {};
    for (const order of recentOrders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }
    
    // Count orders by day
    const ordersByDay: Record<string, number> = {};
    for (const order of recentOrders) {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      ordersByDay[dateStr] = (ordersByDay[dateStr] || 0) + 1;
    }
    
    return {
      totalOrders,
      totalSales,
      averageOrderValue,
      ordersByStatus,
      ordersByDay
    };
  }
  
  async getUserRetentionStats(): Promise<any> {
    // Group users by their first order date
    const users = await db.select().from(users);
    const userFirstOrders: Record<number, Date> = {};
    
    for (const user of users) {
      const orders = await this.getOrdersByUser(user.id);
      if (orders.length > 0) {
        // Sort orders by date
        orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        userFirstOrders[user.id] = orders[0].createdAt;
      }
    }
    
    // Group users by cohort (month of first order)
    const cohorts: Record<string, any> = {};
    
    for (const [userId, firstOrderDate] of Object.entries(userFirstOrders)) {
      const cohortKey = `${firstOrderDate.getFullYear()}-${String(firstOrderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          users: [],
          retentionByMonth: {}
        };
      }
      
      cohorts[cohortKey].users.push(parseInt(userId));
    }
    
    // Calculate retention for each cohort
    for (const [cohortKey, cohort] of Object.entries(cohorts)) {
      const cohortUsers = cohort.users;
      const [cohortYear, cohortMonth] = cohortKey.split('-').map(Number);
      
      // Calculate the number of users who placed an order in subsequent months
      for (let i = 0; i < 12; i++) { // Track retention for up to 12 months
        const targetDate = new Date(cohortYear, cohortMonth - 1);
        targetDate.setMonth(targetDate.getMonth() + i);
        
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1;
        
        let activeUsersCount = 0;
        
        for (const userId of cohortUsers) {
          const orders = await this.getOrdersByUser(userId);
          
          const hasOrderInMonth = orders.some(order => {
            const orderDate = order.createdAt;
            return orderDate.getFullYear() === targetYear && 
                   orderDate.getMonth() + 1 === targetMonth;
          });
          
          if (hasOrderInMonth) {
            activeUsersCount++;
          }
        }
        
        // Calculate retention percentage
        const retentionRate = cohortUsers.length > 0 
          ? (activeUsersCount / cohortUsers.length) * 100
          : 0;
        
        cohort.retentionByMonth[i] = {
          month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
          activeUsers: activeUsersCount,
          retentionRate
        };
      }
    }
    
    return cohorts;
  }
  
  async getRevenueStats(period?: string): Promise<any> {
    // Calculate date range based on period
    let startDate = new Date();
    const endDate = new Date();
    
    if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
    }
    
    // Get orders from the date range
    const recentOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.paymentStatus, "completed")
        )
      );
    
    // Group revenue by day
    const revenueByDay: Record<string, number> = {};
    for (const order of recentOrders) {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + order.totalAmount;
    }
    
    // Calculate cumulative revenue
    const revenueSeries = Object.entries(revenueByDay)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, amount]) => ({ date, amount }));
    
    let cumulativeAmount = 0;
    const cumulativeRevenue = revenueSeries.map(item => {
      cumulativeAmount += item.amount;
      return {
        date: item.date,
        amount: cumulativeAmount
      };
    });
    
    // Calculate total revenue
    const totalRevenue = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Get revenue by membership tier
    const revenueByTier: Record<string, number> = {};
    for (const order of recentOrders) {
      const user = await this.getUser(order.userId);
      if (user) {
        const tier = user.membershipTier;
        revenueByTier[tier] = (revenueByTier[tier] || 0) + order.totalAmount;
      }
    }
    
    return {
      totalRevenue,
      revenueByDay,
      revenueSeries,
      cumulativeRevenue,
      revenueByTier
    };
  }
  
  // Check inventory status
  async getLowStockItems(): Promise<(PizzaBase | PizzaSauce | PizzaCheese | PizzaTopping)[]> {
    const lowStockItems: (PizzaBase | PizzaSauce | PizzaCheese | PizzaTopping)[] = [];
    
    // Get low stock pizza bases
    const bases = await db
      .select()
      .from(pizzaBases)
      .where(lt(pizzaBases.stock, pizzaBases.threshold));
    lowStockItems.push(...bases);
    
    // Get low stock pizza sauces
    const sauces = await db
      .select()
      .from(pizzaSauces)
      .where(lt(pizzaSauces.stock, pizzaSauces.threshold));
    lowStockItems.push(...sauces);
    
    // Get low stock pizza cheeses
    const cheeses = await db
      .select()
      .from(pizzaCheeses)
      .where(lt(pizzaCheeses.stock, pizzaCheeses.threshold));
    lowStockItems.push(...cheeses);
    
    // Get low stock pizza toppings
    const toppings = await db
      .select()
      .from(pizzaToppings)
      .where(lt(pizzaToppings.stock, pizzaToppings.threshold));
    lowStockItems.push(...toppings);
    
    return lowStockItems;
  }
}

// Initialize database with sample data
async function seedDatabase(storage: DatabaseStorage) {
  const pizzaBases = await storage.getAllPizzaBases();
  
  if (pizzaBases.length === 0) {
    // Add default pizza bases
    await storage.createPizzaBase({
      name: "Traditional",
      description: "Classic hand-tossed dough with perfect thickness",
      price: 199,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 45,
      threshold: 20
    });
    
    await storage.createPizzaBase({
      name: "Thin Crust",
      description: "Light and crispy thin base for a crunchier bite",
      price: 179,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 12,
      threshold: 20
    });
    
    await storage.createPizzaBase({
      name: "Deep Dish",
      description: "Thick crust with a deep edge for more toppings",
      price: 249,
      image: "https://images.unsplash.com/photo-1593504049359-74330189a345?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 30,
      threshold: 20
    });
    
    await storage.createPizzaBase({
      name: "Stuffed Crust",
      description: "Cheese-filled crust for an extra cheesy experience",
      price: 299,
      image: "https://images.unsplash.com/photo-1589840700256-41c5d199e5d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 25,
      threshold: 20
    });
    
    await storage.createPizzaBase({
      name: "Multigrain",
      description: "Healthy multigrain option with wholesome flavor",
      price: 229,
      image: "https://images.unsplash.com/photo-1595854341625-f33e32bc3888?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 18,
      threshold: 20
    });
    
    // Add default pizza sauces
    await storage.createPizzaSauce({
      name: "Marinara",
      description: "Classic tomato sauce with Italian herbs",
      price: 49,
      image: "https://images.unsplash.com/photo-1575000771657-8e5e0be9e949?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 5,
      threshold: 10
    });
    
    await storage.createPizzaSauce({
      name: "Pesto",
      description: "Fresh basil, pine nuts, and olive oil blend",
      price: 79,
      image: "https://images.unsplash.com/photo-1606576874542-2f759d322ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 15,
      threshold: 10
    });
    
    await storage.createPizzaSauce({
      name: "Alfredo",
      description: "Creamy white sauce with garlic and parmesan",
      price: 89,
      image: "https://images.unsplash.com/photo-1596716587659-a755a4933f7f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 20,
      threshold: 10
    });
    
    await storage.createPizzaSauce({
      name: "BBQ",
      description: "Sweet and tangy barbecue sauce",
      price: 69,
      image: "https://images.unsplash.com/photo-1606576874542-2f759d322ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 25,
      threshold: 10
    });
    
    await storage.createPizzaSauce({
      name: "Buffalo",
      description: "Spicy buffalo sauce with a kick",
      price: 79,
      image: "https://images.unsplash.com/photo-1606576874542-2f759d322ccf?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 18,
      threshold: 10
    });
    
    // Add default pizza cheeses
    await storage.createPizzaCheese({
      name: "Mozzarella",
      description: "Classic stretchy pizza cheese",
      price: 99,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 30,
      threshold: 15
    });
    
    await storage.createPizzaCheese({
      name: "Cheddar",
      description: "Sharp and tangy flavor",
      price: 89,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 25,
      threshold: 15
    });
    
    await storage.createPizzaCheese({
      name: "Parmesan",
      description: "Aged Italian hard cheese with strong flavor",
      price: 109,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      stock: 20,
      threshold: 15
    });
    
    // Add default pizza toppings
    await storage.createPizzaTopping({
      name: "Mushrooms",
      description: "Fresh sliced mushrooms",
      price: 59,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 22,
      threshold: 15
    });
    
    await storage.createPizzaTopping({
      name: "Bell Peppers",
      description: "Colorful bell peppers",
      price: 49,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 18,
      threshold: 15
    });
    
    await storage.createPizzaTopping({
      name: "Olives",
      description: "Sliced black olives",
      price: 69,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 15,
      threshold: 10
    });
    
    await storage.createPizzaTopping({
      name: "Onions",
      description: "Sliced red onions",
      price: 39,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: true,
      stock: 20,
      threshold: 10
    });
    
    await storage.createPizzaTopping({
      name: "Chicken",
      description: "Grilled chicken pieces",
      price: 129,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: false,
      stock: 25,
      threshold: 15
    });
    
    await storage.createPizzaTopping({
      name: "Pepperoni",
      description: "Spicy pepperoni slices",
      price: 119,
      image: "https://images.unsplash.com/photo-1589881133595-a3c085cb731d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      isVeg: false,
      stock: 30,
      threshold: 15
    });
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();

// Seed the database with initial data
seedDatabase(storage as DatabaseStorage).catch(console.error);

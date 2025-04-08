import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "pizza-delivery-app-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
    }, 
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Auto login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });

  // Forgot password - Generate and store reset token
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't leak whether email exists
        return res.status(200).json({ message: "If your email is registered, you'll receive a reset link" });
      }
      
      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour
      
      // Store token and expiry
      await storage.updateUserResetToken(user.id, resetToken, tokenExpiry);
      
      // In a real app, send email with reset link
      // For this MVP, we'll just return the token
      res.status(200).json({ 
        message: "Reset token generated. In a real app, this would be sent via email.",
        token: resetToken // Only for demonstration - in production this should be sent via email
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      // Find all users and filter
      const users = await db.select().from(schema.users).where(eq(schema.users.resetToken, token));
      
      if (users.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      const user = users[0];
      
      // Check if token is expired
      if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
        return res.status(400).json({ message: "Token has expired" });
      }
      
      // Update password and clear token
      const hashedPassword = await hashPassword(password);
      
      await db.update(schema.users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        })
        .where(eq(schema.users.id, user.id));
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
}

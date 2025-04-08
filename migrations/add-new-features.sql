-- Add new fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'bronze' NOT NULL;

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT NOT NULL
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  last_four TEXT NOT NULL,
  expiry_month TEXT,
  expiry_year TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  gateway_token TEXT
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  order_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  images JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create custom_pizzas table
CREATE TABLE IF NOT EXISTS custom_pizzas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  pizza_config JSONB NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  interval_days INTEGER NOT NULL,
  pizza_allowance INTEGER NOT NULL,
  additional_perks JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  next_delivery_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  payment_method_id INTEGER,
  default_address_id INTEGER,
  default_pizza_config JSONB
);

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value DOUBLE PRECISION NOT NULL,
  min_order_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  link_url TEXT
);

-- Add new fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivery_person_id INTEGER,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DOUBLE PRECISION DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS is_subscription_order BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS subscription_id INTEGER,
ADD COLUMN IF NOT EXISTS payment_method_id INTEGER,
ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER DEFAULT 0 NOT NULL;

-- Add new fields to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_from_saved_config BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS saved_config_id INTEGER;
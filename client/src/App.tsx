import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { PizzaBuilderProvider } from "./context/pizza-builder-context";
import { CartProvider } from "./context/cart-context";

import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PizzaBuilderPage from "@/pages/pizza-builder-page";
import CheckoutPage from "@/pages/checkout-page";
import OrdersPage from "@/pages/orders-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminInventory from "@/pages/admin/inventory";
import AdminOrders from "@/pages/admin/orders";

import { ProtectedRoute, AdminProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/build-pizza" component={PizzaBuilderPage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <AdminProtectedRoute path="/admin" component={AdminDashboard} />
      <AdminProtectedRoute path="/admin/inventory" component={AdminInventory} />
      <AdminProtectedRoute path="/admin/orders" component={AdminOrders} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <PizzaBuilderProvider>
            <Router />
            <Toaster />
          </PizzaBuilderProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

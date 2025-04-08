import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PizzaIcon, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:shadow-lg md:bg-white md:rounded-lg overflow-hidden">
          {/* Left Side - Auth Forms */}
          <div className="md:w-1/2 p-8">
            <div className="flex justify-center md:justify-start">
              <PizzaIcon className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-primary">PizzaCraft</span>
            </div>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                      Sign in to your account to continue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Enter your email" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Enter your password" 
                                    type="password" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                              <div className="text-sm text-right mt-1">
                                <a 
                                  href="#" 
                                  className="text-primary hover:text-primary-dark"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // Handle forgot password
                                  }}
                                >
                                  Forgot password?
                                </a>
                              </div>
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign in"}
                        </Button>
                        
                        {loginMutation.isError && (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {loginMutation.error.message || "Login failed. Please check your credentials."}
                            </AlertDescription>
                          </Alert>
                        )}
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <div className="text-sm text-gray-500">
                      Don't have an account?{" "}
                      <button 
                        onClick={() => setActiveTab("register")}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        Sign up
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>
                      Register to start creating your custom pizzas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Choose a username" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Enter your email" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Create a password" 
                                    type="password" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Confirm your password" 
                                    type="password" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create account"}
                        </Button>
                        
                        {registerMutation.isError && (
                          <Alert variant="destructive">
                            <AlertDescription>
                              {registerMutation.error.message || "Registration failed. Please try again."}
                            </AlertDescription>
                          </Alert>
                        )}
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <div className="text-sm text-gray-500">
                      Already have an account?{" "}
                      <button 
                        onClick={() => setActiveTab("login")}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        Sign in
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Side - Hero Image & Text */}
          <div className="hidden md:block md:w-1/2 bg-primary">
            <div className="flex flex-col justify-center h-full p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Craft Your Perfect Pizza</h2>
              <p className="mb-6 text-white/90">
                Join PizzaCraft and start creating delicious custom pizzas tailored to your taste. Choose from a variety of bases, sauces, cheeses, and toppings.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-white/20 p-2 mr-3">
                    <PizzaIcon className="h-5 w-5" />
                  </div>
                  <span>Custom pizza builder with multiple options</span>
                </div>
                <div className="flex items-center">
                  <div className="rounded-full bg-white/20 p-2 mr-3">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <span>Fast and convenient ordering process</span>
                </div>
                <div className="flex items-center">
                  <div className="rounded-full bg-white/20 p-2 mr-3">
                    <Lock className="h-5 w-5" />
                  </div>
                  <span>Secure account and payment system</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

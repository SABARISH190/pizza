import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/context/cart-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, MapPin, Phone, Trash2 } from "lucide-react";

// Form validation schema
const checkoutSchema = z.object({
  deliveryAddress: z.string().min(10, { message: "Address must be at least 10 characters" }),
  contactNumber: z.string().min(10, { message: "Please enter a valid phone number" }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// Mock function for RazorPay integration
// In a real app, this would interact with actual RazorPay API
const initializeRazorpay = (orderId: number, amount: number, onSuccess: (paymentId: string) => void) => {
  // Simulate a payment process
  // In a real implementation, this would be replaced with actual RazorPay code
  
  // For demo purposes, we'll just simulate a successful payment after 2 seconds
  setTimeout(() => {
    // Generate a mock payment ID
    const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
    onSuccess(paymentId);
  }, 2000);
};

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cartItems, clearCart, calculateCartTotal, removeFromCart } = useCart();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: {
      totalAmount: number;
      deliveryAddress: string;
      contactNumber: string;
      items: {
        pizzaDetails: any;
        price: number;
        quantity: number;
      }[];
    }) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setCreatedOrderId(data.order.id);
      
      // Show notification if there are low stock items
      if (data.lowStockItems) {
        toast({
          title: "Inventory Alert",
          description: "Some items are running low in stock!",
          variant: "destructive",
        });
      }
      
      // Initiate payment
      handlePaymentProcess(data.order.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create order",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { orderId: number; paymentId: string }) => {
      const res = await apiRequest("POST", "/api/payment", data);
      return await res.json();
    },
    onSuccess: () => {
      // Clear cart and show success message
      clearCart();
      
      // Invalidate orders query to refresh orders list
      queryClient.invalidateQueries({ queryKey: ["/api/user/orders"] });
      
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been received and is being prepared.",
      });
      
      // Redirect to orders page
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Processing Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  });

  // Checkout form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
      contactNumber: "",
    },
  });

  const onSubmit = (data: CheckoutFormValues) => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    // Prepare items for the order
    const items = cartItems.map(item => ({
      pizzaDetails: {
        base: item.base,
        sauce: item.sauce,
        cheese: item.cheese,
        toppings: item.toppings,
      },
      price: item.totalPrice,
      quantity: item.quantity || 1
    }));

    // Create order
    createOrderMutation.mutate({
      totalAmount: calculateCartTotal(),
      deliveryAddress: data.deliveryAddress,
      contactNumber: data.contactNumber,
      items
    });
  };

  const handlePaymentProcess = (orderId: number) => {
    setIsProcessingPayment(true);
    
    // Initialize RazorPay
    initializeRazorpay(
      orderId,
      calculateCartTotal(),
      (paymentId: string) => {
        // Process payment on success
        processPaymentMutation.mutate({
          orderId,
          paymentId
        });
      }
    );
  };

  // If cart is empty and not processing payment, redirect to home
  if (cartItems.length === 0 && !isProcessingPayment && !createOrderMutation.isPending && !processPaymentMutation.isPending) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Your Cart is Empty</CardTitle>
                <CardDescription>
                  You don't have any items in your cart yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Trash2 className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6">Start by building a delicious custom pizza!</p>
                <Button asChild>
                  <a href="/build-pizza">Build a Pizza</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600">Complete your order with secure payment</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Checkout Form */}
            <div className="lg:w-2/3">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                  <CardDescription>
                    Please provide your delivery details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="deliveryAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Textarea
                                  placeholder="Enter your full delivery address"
                                  className="pl-10 min-h-[100px]"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                  placeholder="Enter your phone number"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Payment Section */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Payment Method</h3>
                        <div className="border rounded-md p-4 bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <span className="font-medium">RazorPay</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Secure payment via RazorPay. Your payment information is secure.
                          </p>
                        </div>
                      </div>
                      
                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={
                          createOrderMutation.isPending || 
                          isProcessingPayment || 
                          processPaymentMutation.isPending
                        }
                      >
                        {createOrderMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Order...
                          </>
                        ) : isProcessingPayment || processPaymentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Payment...
                          </>
                        ) : (
                          "Complete Order & Pay"
                        )}
                      </Button>
                      
                      {(createOrderMutation.isError || processPaymentMutation.isError) && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertDescription>
                            {createOrderMutation.error?.message || 
                             processPaymentMutation.error?.message || 
                             "An error occurred during checkout. Please try again."}
                          </AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>
                    {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex py-4 first:pt-0 border-b last:border-0">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                          <img
                            src={item.base?.image || ""}
                            alt="Pizza"
                            className="h-full w-full object-cover object-center"
                          />
                        </div>
                        <div className="ml-4 flex flex-1 flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>Custom Pizza</h3>
                              <p className="ml-4">₹{item.totalPrice}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {item.base?.name} base with {item.sauce?.name} sauce
                            </p>
                          </div>
                          <div className="flex flex-1 items-end justify-between text-sm">
                            <p className="text-gray-500">Qty {item.quantity || 1}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => removeFromCart(index)}
                              disabled={isProcessingPayment || processPaymentMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Subtotal</span>
                      <span>₹{calculateCartTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Delivery Fee</span>
                      <span>₹40</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taxes</span>
                      <span>₹{Math.round(calculateCartTotal() * 0.05)}</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{calculateCartTotal() + 40 + Math.round(calculateCartTotal() * 0.05)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 rounded-b-lg">
                  <p className="text-sm text-gray-500 w-full text-center">
                    By completing this order, you agree to PizzaCraft's terms and conditions.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

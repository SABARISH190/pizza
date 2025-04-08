import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/ui/admin/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, Search, Filter, RefreshCw } from "lucide-react";

interface OrderItem {
  id: number;
  orderId: number;
  pizzaDetails: {
    base: {
      id: number;
      name: string;
      price: number;
      image: string;
    };
    sauce: {
      id: number;
      name: string;
      price: number;
    };
    cheese: {
      id: number;
      name: string;
      price: number;
    };
    toppings: Array<{
      id: number;
      name: string;
      price: number;
      isVeg: boolean;
    }>;
  };
  price: number;
  quantity: number;
}

interface OrderWithUser {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  paymentId: string | null;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string;
  contactNumber: string;
  items: OrderItem[];
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "received":
      return "bg-blue-100 text-blue-800";
    case "preparing":
    case "cooking":
      return "bg-amber-100 text-amber-800";
    case "out_for_delivery":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatStatusText(status: string) {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function AdminOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  // Fetch orders data
  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useQuery<OrderWithUser[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user?.isAdmin,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/admin/orders/${orderId}/status`,
        { status }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleStatusChange = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const filteredOrders = orders
    ? orders.filter(order => {
        // Filter by status
        if (statusFilter !== "all" && order.status !== statusFilter) {
          return false;
        }
        
        // Search by order ID or customer name/email
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            order.id.toString().includes(query) ||
            order.user?.username.toLowerCase().includes(query) ||
            order.user?.email.toLowerCase().includes(query) ||
            order.contactNumber.includes(query)
          );
        }
        
        return true;
      })
    : [];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600">Manage and update customer orders</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-800 mb-2">Failed to load orders</p>
            <p className="text-gray-600 mb-6">Please try again later</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by ID, customer, or contact number"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="cooking">Cooking</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={() => refetch()} className="whitespace-nowrap">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders */}
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium text-gray-800 mb-2">No Orders Found</p>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter !== "all"
                    ? "Try changing your search or filter criteria"
                    : "There are no orders in the system yet"}
                </p>
                {(searchQuery || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <Card key={order.id} id={`${order.id}`} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 cursor-pointer" onClick={() => toggleOrderExpanded(`${order.id}`)}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          Order #{order.id}
                          {order.paymentStatus !== "completed" && (
                            <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                              Payment Pending
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Placed on {formatDate(order.createdAt)}
                        </CardDescription>
                      </div>
                      <div className="mt-2 md:mt-0 flex flex-col md:flex-row md:items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {formatStatusText(order.status)}
                        </Badge>
                        <span className="font-medium text-gray-900">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className={expandedOrders.includes(`${order.id}`) ? "pt-6" : "hidden"}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Customer Info */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="font-medium">{order.user?.username || "Guest User"}</p>
                          <p className="text-sm text-gray-600">{order.user?.email || "No email provided"}</p>
                          <p className="text-sm text-gray-600 mt-2">{order.contactNumber}</p>
                        </div>
                      </div>
                      
                      {/* Delivery Address */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      
                      {/* Order Status Update */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Update Status</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="cooking">Cooking</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          {updateOrderStatusMutation.isPending && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Updating...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <h3 className="font-medium mb-4">Order Items</h3>
                    <div className="space-y-4 mb-6">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex border-b pb-4 last:border-0 last:pb-0">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                            <img
                              src={item.pizzaDetails.base.image}
                              alt={item.pizzaDetails.base.name}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="ml-4 flex flex-1 flex-col">
                            <div>
                              <div className="flex justify-between text-base font-medium text-gray-900">
                                <h3>Custom Pizza</h3>
                                <p className="ml-4">₹{item.price}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">
                                {item.pizzaDetails.base.name} base with {item.pizzaDetails.sauce.name} sauce
                              </p>
                              {item.pizzaDetails.toppings.length > 0 && (
                                <p className="mt-1 text-sm text-gray-500">
                                  Toppings: {item.pizzaDetails.toppings.map(t => t.name).join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-1 items-end justify-between text-sm">
                              <p className="text-gray-500">Qty {item.quantity}</p>
                              <p className="font-medium">₹{item.price * item.quantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Payment Info */}
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <h3 className="font-medium mb-2">Payment Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Payment ID</p>
                          <p className="font-medium">{order.paymentId || "Not available"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Status</p>
                          <Badge variant={order.paymentStatus === "completed" ? "success" : "destructive"}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Order Total */}
                    <div className="flex justify-end">
                      <div className="text-right">
                        <div className="flex justify-between gap-8">
                          <span className="font-medium">Total Amount:</span>
                          <span className="font-bold">₹{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

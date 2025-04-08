import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/ui/admin/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, DollarSign, Package, Users, AlertCircle } from "lucide-react";

// Inventory alert interface
interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  threshold: number;
  type?: string;
}

interface OrderWithUser {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
}

interface InventoryData {
  bases: any[];
  sauces: any[];
  cheeses: any[];
  toppings: any[];
  lowStockItems: InventoryItem[] | null;
}

// Get the label for the inventory item type
function getInventoryTypeLabel(item: InventoryItem): string {
  // If type is explicitly defined, use it
  if (item.type) {
    return item.type.charAt(0).toUpperCase() + item.type.slice(1);
  }
  
  // Otherwise try to infer from the object structure or name
  if ('isVeg' in item) {
    return 'Topping';
  }
  
  const name = item.name.toLowerCase();
  if (name.includes('cheese')) {
    return 'Cheese';
  } else if (name.includes('sauce')) {
    return 'Sauce';
  } else {
    return 'Base';
  }
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

export default function AdminDashboard() {
  const { user } = useAuth();

  // Fetch inventory data
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery<InventoryData>({
    queryKey: ["/api/admin/inventory"],
    enabled: !!user?.isAdmin,
  });

  // Fetch orders data
  const { data: orders, isLoading: isLoadingOrders } = useQuery<OrderWithUser[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user?.isAdmin,
  });

  // Generate statistics
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
  const lowStockCount = inventoryData?.lowStockItems?.length || 0;
  const activeUsers = new Set(orders?.map(order => order.user?.id).filter(Boolean)).size || 0;

  // Prepare chart data
  const inventoryChartData = inventoryData ? [
    ...inventoryData.bases.map(base => ({
      name: base.name,
      stock: base.stock,
      threshold: base.threshold,
      type: 'Base'
    })),
    ...inventoryData.sauces.map(sauce => ({
      name: sauce.name,
      stock: sauce.stock,
      threshold: sauce.threshold,
      type: 'Sauce'
    })),
    ...inventoryData.cheeses.map(cheese => ({
      name: cheese.name,
      stock: cheese.stock,
      threshold: cheese.threshold,
      type: 'Cheese'
    })),
    // Only include first few toppings to keep chart readable
    ...inventoryData.toppings.slice(0, 5).map(topping => ({
      name: topping.name,
      stock: topping.stock,
      threshold: topping.threshold,
      type: 'Topping'
    }))
  ] : [];

  // Organize orders by status for quick statistics
  const ordersByStatus = orders?.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const orderStatusChartData = Object.entries(ordersByStatus).map(([status, count]) => ({
    status: formatStatusText(status),
    count
  }));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your pizza delivery business</p>
      </div>

      {isLoadingInventory || isLoadingOrders ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md mr-4">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Today's Orders</p>
                    <h3 className="text-2xl font-bold">{totalOrders}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md mr-4">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Revenue</p>
                    <h3 className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-amber-100 rounded-md mr-4">
                    <Package className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                    <h3 className="text-2xl font-bold">{lowStockCount}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-md mr-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <h3 className="text-2xl font-bold">{activeUsers}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          {inventoryData?.lowStockItems && inventoryData.lowStockItems.length > 0 && (
            <Card className="mb-8 border-red-200">
              <CardHeader className="bg-red-50">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <CardTitle className="text-red-700">Inventory Alerts</CardTitle>
                </div>
                <CardDescription className="text-red-600">
                  The following items are running low on stock and need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryData.lowStockItems.map((item) => (
                    <div key={`${getInventoryTypeLabel(item)}-${item.id}`} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{getInventoryTypeLabel(item)}</p>
                      </div>
                      <div className="flex items-center">
                        <p className={`text-sm ${item.stock <= item.threshold / 2 ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                          {item.stock} units left
                        </p>
                        <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                          Below threshold ({item.threshold})
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Inventory Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>
                  Current stock levels of ingredients
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inventoryChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#FF5722" name="Current Stock" />
                    <Bar dataKey="threshold" fill="#4CAF50" name="Threshold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>
                  Distribution of orders across different statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={orderStatusChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4CAF50" name="Number of Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Latest orders that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Order ID</th>
                      <th scope="col" className="px-6 py-3">Customer</th>
                      <th scope="col" className="px-6 py-3">Amount</th>
                      <th scope="col" className="px-6 py-3">Date</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders?.slice(0, 5).map((order) => (
                      <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">#{order.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                              {order.user?.username.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">{order.user?.username || 'Unknown User'}</p>
                              <p className="text-xs text-gray-500">{order.user?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">₹{order.totalAmount}</td>
                        <td className="px-6 py-4">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(order.status)}>
                            {formatStatusText(order.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/orders#${order.id}`}>
                            <a className="text-primary hover:text-primary-dark">Details</a>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {orders && orders.length > 5 && (
                <div className="mt-4 text-center">
                  <Link href="/admin/orders">
                    <a className="text-primary hover:text-primary-dark font-medium">View All Orders</a>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}

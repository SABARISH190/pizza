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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Search, Plus, Save, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  threshold: number;
  isVeg?: boolean;
}

interface InventoryData {
  bases: InventoryItem[];
  sauces: InventoryItem[];
  cheeses: InventoryItem[];
  toppings: InventoryItem[];
  lowStockItems: InventoryItem[] | null;
}

export default function AdminInventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bases");
  const [editingItems, setEditingItems] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch inventory data
  const {
    data: inventoryData,
    isLoading,
    error,
    refetch,
  } = useQuery<InventoryData>({
    queryKey: ["/api/admin/inventory"],
    enabled: !!user?.isAdmin,
  });

  // Update inventory item stock
  const updateStockMutation = useMutation({
    mutationFn: async ({
      type,
      id,
      stock,
    }: {
      type: string;
      id: number;
      stock: number;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/inventory/${type}/${id}`, {
        stock,
      });
      return await res.json();
    },
    onSuccess: () => {
      // Refetch inventory data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      
      toast({
        title: "Stock Updated",
        description: "The inventory has been updated successfully",
      });
      
      // Clear editing state
      setEditingItems({});
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStockChange = (type: string, id: number, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditingItems({
        ...editingItems,
        [`${type}-${id}`]: numValue,
      });
    }
  };

  const handleUpdateStock = (type: string, id: number) => {
    const stock = editingItems[`${type}-${id}`];
    if (stock !== undefined) {
      updateStockMutation.mutate({ type, id, stock });
    }
  };

  const filterItems = (items: InventoryItem[]) => {
    if (!searchQuery) return items;
    
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderInventoryTable = (type: string, items: InventoryItem[] = []) => {
    const filteredItems = filterItems(items);
    
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search items..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isLowStock = item.stock <= item.threshold;
                    const isEditing = editingItems[`${type}-${item.id}`] !== undefined;
                    const currentStock = isEditing
                      ? editingItems[`${type}-${item.id}`]
                      : item.stock;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                        <TableCell className="text-right">₹{item.price}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={currentStock}
                              onChange={(e) => handleStockChange(type, item.id, e.target.value)}
                              className="w-20 inline-block text-right"
                              min="0"
                            />
                          ) : (
                            <span className={isLowStock ? "text-red-600 font-medium" : ""}>
                              {item.stock}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.threshold}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={isLowStock ? "destructive" : "default"}
                            className={isLowStock ? "bg-red-100 text-red-800 hover:bg-red-100" : ""}
                          >
                            {isLowStock ? "Low Stock" : "In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStock(type, item.id)}
                              disabled={updateStockMutation.isPending}
                            >
                              {updateStockMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItems({
                                ...editingItems,
                                [`${type}-${item.id}`]: item.stock,
                              })}
                            >
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No items match your search query"
                        : "No items found in inventory"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600">Monitor and update your pizza ingredients inventory</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-red-800 mb-2">Failed to load inventory data</p>
            <p className="text-gray-600 mb-6">Please try again later</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Current Stock</TableHead>
                      <TableHead className="text-center">Threshold</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.lowStockItems.map((item) => {
                      // Determine the item type
                      let itemType = "base";
                      if ("isVeg" in item) itemType = "topping";
                      else if (item.name.toLowerCase().includes("sauce")) itemType = "sauce";
                      else if (item.name.toLowerCase().includes("cheese")) itemType = "cheese";
                      
                      const isEditing = editingItems[`${itemType}-${item.id}`] !== undefined;
                      const currentStock = isEditing
                        ? editingItems[`${itemType}-${item.id}`]
                        : item.stock;
                      
                      return (
                        <TableRow key={`${itemType}-${item.id}`}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {itemType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={currentStock}
                                onChange={(e) => handleStockChange(itemType, item.id, e.target.value)}
                                className="w-20 inline-block text-right"
                                min="0"
                              />
                            ) : (
                              <span className="text-red-600 font-medium">{item.stock}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.threshold}</TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStock(itemType, item.id)}
                                disabled={updateStockMutation.isPending}
                              >
                                {updateStockMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingItems({
                                  ...editingItems,
                                  [`${itemType}-${item.id}`]: item.stock,
                                })}
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Inventory Tabs */}
          <Tabs defaultValue="bases" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="bases">Pizza Bases</TabsTrigger>
              <TabsTrigger value="sauces">Sauces</TabsTrigger>
              <TabsTrigger value="cheeses">Cheeses</TabsTrigger>
              <TabsTrigger value="toppings">Toppings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bases">
              {renderInventoryTable("base", inventoryData?.bases)}
            </TabsContent>
            
            <TabsContent value="sauces">
              {renderInventoryTable("sauce", inventoryData?.sauces)}
            </TabsContent>
            
            <TabsContent value="cheeses">
              {renderInventoryTable("cheese", inventoryData?.cheeses)}
            </TabsContent>
            
            <TabsContent value="toppings">
              {renderInventoryTable("topping", inventoryData?.toppings)}
            </TabsContent>
          </Tabs>
        </>
      )}
    </AdminLayout>
  );
}

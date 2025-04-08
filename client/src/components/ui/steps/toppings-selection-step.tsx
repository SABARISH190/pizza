import { useState } from "react";
import { PizzaTopping } from "@shared/schema";
import { Check, ChevronDown, Leaf, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ToppingsSelectionStepProps {
  pizzaToppings: PizzaTopping[];
  selectedToppings: PizzaTopping[];
  onAddTopping: (topping: PizzaTopping) => void;
  onRemoveTopping: (toppingId: number) => void;
}

export default function ToppingsSelectionStep({
  pizzaToppings,
  selectedToppings,
  onAddTopping,
  onRemoveTopping,
}: ToppingsSelectionStepProps) {
  const [activeTab, setActiveTab] = useState("all");
  
  const vegToppings = pizzaToppings.filter((topping) => topping.isVeg);
  const nonVegToppings = pizzaToppings.filter((topping) => !topping.isVeg);
  
  const displayToppings = activeTab === "all" 
    ? pizzaToppings 
    : activeTab === "veg" 
      ? vegToppings 
      : nonVegToppings;

  return (
    <div>
      <h3 className="text-xl font-medium mb-4">Select your toppings</h3>
      <p className="text-gray-600 mb-6">Choose from a variety of delicious toppings to complete your pizza</p>
      
      {/* Selected Toppings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Selected Toppings</h4>
          {selectedToppings.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-sm"
              onClick={() => selectedToppings.forEach(t => onRemoveTopping(t.id))}
            >
              Clear All
            </Button>
          )}
        </div>
        <div className="p-4 border rounded-md bg-gray-50 min-h-16 flex flex-wrap gap-2">
          {selectedToppings.length === 0 ? (
            <p className="text-gray-500 w-full text-center">No toppings selected yet</p>
          ) : (
            selectedToppings.map((topping) => (
              <Badge 
                key={topping.id} 
                variant="secondary"
                className="flex items-center gap-1 py-1 px-2"
              >
                {topping.isVeg && (
                  <Leaf className="h-3 w-3 text-green-600" />
                )}
                {topping.name}
                <XCircle 
                  className="h-3 w-3 ml-1 cursor-pointer text-gray-500 hover:text-red-500" 
                  onClick={() => onRemoveTopping(topping.id)}
                />
              </Badge>
            ))
          )}
        </div>
      </div>
      
      {/* Toppings Selector */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium">Available Toppings</h4>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="veg">Veg</TabsTrigger>
              <TabsTrigger value="nonveg">Non-Veg</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayToppings.map((topping) => {
            const isSelected = selectedToppings.some((t) => t.id === topping.id);
            
            return (
              <div 
                key={topping.id}
                className={`
                  border rounded-lg p-4 transition-shadow duration-200
                  ${isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:shadow-sm'}
                `}
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {topping.name}
                    </h4>
                    {topping.isVeg && (
                      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                        <Leaf className="h-3 w-3 mr-1" />
                        Veg
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">₹{topping.price}</span>
                </div>
                <p className="text-gray-600 text-sm my-2">{topping.description}</p>
                <div className="mt-2">
                  {isSelected ? (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => onRemoveTopping(topping.id)}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={() => onAddTopping(topping)}
                    >
                      Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { PizzaConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Leaf, Check } from "lucide-react";

interface ReviewStepProps {
  pizzaConfig: PizzaConfig;
  totalPrice: number;
  onFinishAndAddAnother: () => void;
}

export default function ReviewStep({
  pizzaConfig,
  totalPrice,
  onFinishAndAddAnother,
}: ReviewStepProps) {
  return (
    <div>
      <h3 className="text-xl font-medium mb-4">Review Your Pizza</h3>
      <p className="text-gray-600 mb-6">Confirm your custom pizza before adding it to your cart</p>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Pizza image */}
          <div className="md:w-1/3 mb-6 md:mb-0 flex items-center justify-center">
            {pizzaConfig.base ? (
              <img 
                src={pizzaConfig.base.image}
                alt="Custom Pizza"
                className="rounded-full w-48 h-48 object-cover shadow-md"
              />
            ) : (
              <div className="h-48 w-48 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>
          
          {/* Right side - Pizza details */}
          <div className="md:w-2/3 md:pl-8">
            <h3 className="text-xl font-medium mb-4">Your Custom Pizza</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-primary/10 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Base</h4>
                  <p className="text-gray-600">
                    {pizzaConfig.base?.name} - ₹{pizzaConfig.base?.price}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Sauce</h4>
                  <p className="text-gray-600">
                    {pizzaConfig.sauce?.name} - ₹{pizzaConfig.sauce?.price}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Cheese</h4>
                  <p className="text-gray-600">
                    {pizzaConfig.cheese?.name} - ₹{pizzaConfig.cheese?.price}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-primary/10 p-1 rounded-full mr-3 mt-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Toppings</h4>
                  <div className="text-gray-600">
                    {pizzaConfig.toppings.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {pizzaConfig.toppings.map((topping) => (
                          <li key={topping.id} className="flex items-center">
                            {topping.isVeg && (
                              <Leaf className="h-3 w-3 text-green-600 mr-1" />
                            )}
                            {topping.name} - ₹{topping.price}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No toppings selected</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Price</span>
                  <span className="text-lg font-bold text-primary">₹{totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button
            onClick={onFinishAndAddAnother}
            className="mr-4"
          >
            Add to Cart & Build Another
          </Button>
        </div>
      </div>
    </div>
  );
}

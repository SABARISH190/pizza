import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePizzaBuilder } from "@/context/pizza-builder-context";
import { useQuery } from "@tanstack/react-query";
import { PizzaBase, PizzaSauce, PizzaCheese, PizzaTopping } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

// Step components
import BaseSelectionStep from "./steps/base-selection-step";
import SauceSelectionStep from "./steps/sauce-selection-step";
import CheeseSelectionStep from "./steps/cheese-selection-step";
import ToppingsSelectionStep from "./steps/toppings-selection-step";
import ReviewStep from "./steps/review-step";

export default function PizzaBuilder() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  const { 
    pizzaConfig, 
    selectBase, 
    selectSauce, 
    selectCheese,
    addTopping,
    removeTopping,
    calculateTotal,
    resetPizza,
    addToCart
  } = usePizzaBuilder();

  // Fetch pizza components
  const { data: pizzaBases, isLoading: isLoadingBases } = useQuery<PizzaBase[]>({
    queryKey: ["/api/pizza-bases"],
  });

  const { data: pizzaSauces, isLoading: isLoadingSauces } = useQuery<PizzaSauce[]>({
    queryKey: ["/api/pizza-sauces"],
  });

  const { data: pizzaCheeses, isLoading: isLoadingCheeses } = useQuery<PizzaCheese[]>({
    queryKey: ["/api/pizza-cheeses"],
  });

  const { data: pizzaToppings, isLoading: isLoadingToppings } = useQuery<PizzaTopping[]>({
    queryKey: ["/api/pizza-toppings"],
  });

  const isLoading = isLoadingBases || isLoadingSauces || isLoadingCheeses || isLoadingToppings;

  const steps = [
    { name: "Base", completed: !!pizzaConfig.base },
    { name: "Sauce", completed: !!pizzaConfig.sauce },
    { name: "Cheese", completed: !!pizzaConfig.cheese },
    { name: "Toppings", completed: pizzaConfig.toppings.length > 0 },
    { name: "Review", completed: false }
  ];

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    // Validation for current step
    if (currentStep === 1 && !pizzaConfig.base) {
      toast({
        title: "Select a Base",
        description: "Please select a pizza base before proceeding",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 2 && !pizzaConfig.sauce) {
      toast({
        title: "Select a Sauce",
        description: "Please select a sauce for your pizza",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 3 && !pizzaConfig.cheese) {
      toast({
        title: "Select a Cheese",
        description: "Please select cheese for your pizza",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 4 && pizzaConfig.toppings.length === 0) {
      toast({
        title: "Select Toppings",
        description: "Please select at least one topping",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step (Review) - Add to cart and go to checkout
      addToCart({
        ...pizzaConfig,
        totalPrice: calculateTotal()
      });
      
      toast({
        title: "Added to Cart",
        description: "Your custom pizza has been added to your cart",
      });
      
      // Navigate to checkout
      navigate("/checkout");
    }
  };

  const handleFinishAndAddAnother = () => {
    // Add current pizza to cart
    addToCart({
      ...pizzaConfig,
      totalPrice: calculateTotal()
    });
    
    // Reset pizza and go back to step 1
    resetPizza();
    setCurrentStep(1);
    
    toast({
      title: "Added to Cart",
      description: "Your custom pizza has been added. Build another one!",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Progress Steps */}
      <div className="bg-gray-50 px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-medium text-gray-900">Craft Your Perfect Pizza</h2>
          <div className="mt-3 md:mt-0 flex flex-wrap gap-1">
            {steps.map((step, index) => (
              <div key={step.name} className="flex items-center">
                <div 
                  className={`rounded-full h-6 w-6 flex items-center justify-center text-white mr-1
                    ${currentStep > index + 1 || (currentStep === index + 1 && step.completed)
                      ? "bg-green-500" 
                      : currentStep === index + 1 
                        ? "bg-primary" 
                        : "bg-gray-300"}`}
                >
                  {currentStep > index + 1 || (currentStep === index + 1 && step.completed) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`${currentStep === index + 1 ? "font-medium" : ""}`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="mx-1 text-gray-400 h-4 w-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Choose Base */}
        {currentStep === 1 && (
          <BaseSelectionStep 
            pizzaBases={pizzaBases || []} 
            selectedBase={pizzaConfig.base}
            onSelectBase={selectBase}
          />
        )}
        
        {/* Step 2: Choose Sauce */}
        {currentStep === 2 && (
          <SauceSelectionStep 
            pizzaSauces={pizzaSauces || []} 
            selectedSauce={pizzaConfig.sauce}
            onSelectSauce={selectSauce}
          />
        )}
        
        {/* Step 3: Choose Cheese */}
        {currentStep === 3 && (
          <CheeseSelectionStep 
            pizzaCheeses={pizzaCheeses || []} 
            selectedCheese={pizzaConfig.cheese}
            onSelectCheese={selectCheese}
          />
        )}
        
        {/* Step 4: Choose Toppings */}
        {currentStep === 4 && (
          <ToppingsSelectionStep 
            pizzaToppings={pizzaToppings || []} 
            selectedToppings={pizzaConfig.toppings}
            onAddTopping={addTopping}
            onRemoveTopping={removeTopping}
          />
        )}
        
        {/* Step 5: Review */}
        {currentStep === 5 && (
          <ReviewStep 
            pizzaConfig={pizzaConfig}
            totalPrice={calculateTotal()}
            onFinishAndAddAnother={handleFinishAndAddAnother}
          />
        )}

        {/* Pizza Preview Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-start">
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="text-lg font-medium mb-2">Your Pizza So Far</h3>
              <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
                {pizzaConfig.base ? (
                  <img 
                    src={pizzaConfig.base.image} 
                    alt="Pizza Preview" 
                    className="h-48 w-48 rounded-full object-cover shadow-md" 
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <span className="block text-3xl mb-2">🍕</span>
                    <span>Select items to build your pizza</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-2/3 md:pl-8">
              <h3 className="text-lg font-medium mb-2">Order Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Base</span>
                  <span className={pizzaConfig.base ? "font-medium" : "text-gray-400"}>
                    {pizzaConfig.base 
                      ? `${pizzaConfig.base.name} (₹${pizzaConfig.base.price})` 
                      : "Not selected yet"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Sauce</span>
                  <span className={pizzaConfig.sauce ? "font-medium" : "text-gray-400"}>
                    {pizzaConfig.sauce 
                      ? `${pizzaConfig.sauce.name} (₹${pizzaConfig.sauce.price})` 
                      : "Not selected yet"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Cheese</span>
                  <span className={pizzaConfig.cheese ? "font-medium" : "text-gray-400"}>
                    {pizzaConfig.cheese 
                      ? `${pizzaConfig.cheese.name} (₹${pizzaConfig.cheese.price})` 
                      : "Not selected yet"}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Toppings</span>
                  {pizzaConfig.toppings.length > 0 ? (
                    <span className="font-medium text-right">
                      {pizzaConfig.toppings.map(t => t.name).join(", ")}
                      <br />
                      <span className="text-sm">
                        (₹{pizzaConfig.toppings.reduce((sum, t) => sum + t.price, 0)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">Not selected yet</span>
                  )}
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex justify-between font-medium">
                    <span>Current Total</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button onClick={handleNextStep}>
            {currentStep === 5 ? "Finish & Checkout" : "Next"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

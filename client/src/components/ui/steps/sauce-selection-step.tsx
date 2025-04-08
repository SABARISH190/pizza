import { PizzaSauce } from "@shared/schema";
import { CheckCircle } from "lucide-react";

interface SauceSelectionStepProps {
  pizzaSauces: PizzaSauce[];
  selectedSauce: PizzaSauce | null;
  onSelectSauce: (sauce: PizzaSauce) => void;
}

export default function SauceSelectionStep({
  pizzaSauces,
  selectedSauce,
  onSelectSauce,
}: SauceSelectionStepProps) {
  return (
    <div>
      <h3 className="text-xl font-medium mb-4">Select your sauce</h3>
      <p className="text-gray-600 mb-6">Choose a delicious sauce to enhance your pizza's flavor</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pizzaSauces.map((sauce) => (
          <div 
            key={sauce.id}
            className={`
              bg-white border rounded-lg overflow-hidden transition-shadow duration-300 ease-in-out cursor-pointer
              ${selectedSauce?.id === sauce.id 
                ? 'border-primary shadow-md' 
                : 'border-gray-200 hover:shadow-md'}
            `}
            onClick={() => onSelectSauce(sauce)}
          >
            <div className="relative h-48">
              <img 
                className="w-full h-full object-cover"
                src={sauce.image}
                alt={sauce.name}
              />
              {selectedSauce?.id === sauce.id && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-lg">{sauce.name}</h4>
              <p className="text-gray-600 text-sm mb-2">{sauce.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">₹{sauce.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

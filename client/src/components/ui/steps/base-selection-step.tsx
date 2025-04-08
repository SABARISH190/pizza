import { PizzaBase } from "@shared/schema";
import { CheckCircle } from "lucide-react";

interface BaseSelectionStepProps {
  pizzaBases: PizzaBase[];
  selectedBase: PizzaBase | null;
  onSelectBase: (base: PizzaBase) => void;
}

export default function BaseSelectionStep({
  pizzaBases,
  selectedBase,
  onSelectBase,
}: BaseSelectionStepProps) {
  return (
    <div>
      <h3 className="text-xl font-medium mb-4">Choose your pizza base</h3>
      <p className="text-gray-600 mb-6">Select the perfect foundation for your delicious creation</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pizzaBases.map((base) => (
          <div 
            key={base.id}
            className={`
              bg-white border rounded-lg overflow-hidden transition-shadow duration-300 ease-in-out cursor-pointer
              ${selectedBase?.id === base.id 
                ? 'border-primary shadow-md' 
                : 'border-gray-200 hover:shadow-md'}
            `}
            onClick={() => onSelectBase(base)}
          >
            <div className="relative h-48">
              <img 
                className="w-full h-full object-cover"
                src={base.image}
                alt={base.name}
              />
              {selectedBase?.id === base.id && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-lg">{base.name}</h4>
              <p className="text-gray-600 text-sm mb-2">{base.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">₹{base.price}</span>
                <span className="text-xs text-gray-500">Medium | 10"</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

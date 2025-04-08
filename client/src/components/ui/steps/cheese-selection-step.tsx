import { PizzaCheese } from "@shared/schema";
import { CheckCircle } from "lucide-react";

interface CheeseSelectionStepProps {
  pizzaCheeses: PizzaCheese[];
  selectedCheese: PizzaCheese | null;
  onSelectCheese: (cheese: PizzaCheese) => void;
}

export default function CheeseSelectionStep({
  pizzaCheeses,
  selectedCheese,
  onSelectCheese,
}: CheeseSelectionStepProps) {
  return (
    <div>
      <h3 className="text-xl font-medium mb-4">Choose your cheese</h3>
      <p className="text-gray-600 mb-6">Select the cheese that will make your pizza irresistible</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pizzaCheeses.map((cheese) => (
          <div 
            key={cheese.id}
            className={`
              bg-white border rounded-lg overflow-hidden transition-shadow duration-300 ease-in-out cursor-pointer
              ${selectedCheese?.id === cheese.id 
                ? 'border-primary shadow-md' 
                : 'border-gray-200 hover:shadow-md'}
            `}
            onClick={() => onSelectCheese(cheese)}
          >
            <div className="relative h-48">
              <img 
                className="w-full h-full object-cover"
                src={cheese.image}
                alt={cheese.name}
              />
              {selectedCheese?.id === cheese.id && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-lg">{cheese.name}</h4>
              <p className="text-gray-600 text-sm mb-2">{cheese.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">₹{cheese.price}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

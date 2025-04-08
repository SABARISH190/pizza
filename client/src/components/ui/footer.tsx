import { Link } from "wouter";
import { PizzaIcon, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <PizzaIcon className="text-primary mr-2" />
              <span className="font-bold text-lg text-primary">PizzaCraft</span>
            </div>
            <p className="text-gray-500 text-sm mt-2">© 2023 PizzaCraft. All rights reserved.</p>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium mb-2 text-gray-800">Quick Links</h3>
              <ul className="text-sm text-gray-500 space-y-2">
                <li><Link href="/"><a className="hover:text-primary">Home</a></Link></li>
                <li><Link href="/build-pizza"><a className="hover:text-primary">Build Pizza</a></Link></li>
                <li><Link href="/orders"><a className="hover:text-primary">Track Order</a></Link></li>
                <li><Link href="/auth"><a className="hover:text-primary">My Account</a></Link></li>
              </ul>
            </div>
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium mb-2 text-gray-800">Contact</h3>
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>+91 1234567890</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>contact@pizzacraft.com</span>
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>123 Pizza Street, Food City</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2 text-gray-800">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-500 hover:text-primary">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-primary">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-500 hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

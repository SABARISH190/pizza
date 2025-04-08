import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/context/cart-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PizzaIcon, ShoppingCart, User, LogOut, Menu, X, Home, List, ChefHat, Trash2 } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { cartItems, removeFromCart, clearCart, calculateCartTotal } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const navLinks = [
    { name: "Home", href: "/", icon: <Home className="w-4 h-4 mr-2" /> },
    { name: "Build Pizza", href: "/build-pizza", icon: <PizzaIcon className="w-4 h-4 mr-2" /> },
    { name: "Orders", href: "/orders", icon: <List className="w-4 h-4 mr-2" /> },
  ];

  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: <ChefHat className="w-4 h-4 mr-2" /> },
    { name: "Inventory", href: "/admin/inventory", icon: <List className="w-4 h-4 mr-2" /> },
    { name: "Orders", href: "/admin/orders", icon: <ShoppingCart className="w-4 h-4 mr-2" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <PizzaIcon className="text-primary text-3xl mr-2" />
              <Link href="/">
                <span className="font-bold text-xl text-primary cursor-pointer">PizzaCraft</span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <a
                    className={`${
                      location === link.href
                        ? "border-primary text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {link.name}
                  </a>
                </Link>
              ))}
              
              {user?.isAdmin && (
                <>
                  <span className="border-l border-gray-200 h-6 self-center"></span>
                  {adminLinks.map((link) => (
                    <Link key={link.name} href={link.href}>
                      <a
                        className={`${
                          location === link.href
                            ? "border-primary text-gray-900"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                      >
                        {link.name}
                      </a>
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative mr-4">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Your Cart</SheetTitle>
                      <SheetDescription>
                        {cartItems.length === 0 ? "Your cart is empty" : `${cartItems.length} item(s) in your cart`}
                      </SheetDescription>
                    </SheetHeader>
                    {cartItems.length > 0 ? (
                      <>
                        <ScrollArea className="h-[65vh] mt-4 pr-4">
                          <div className="space-y-4">
                            {cartItems.map((item, index) => (
                              <div key={index} className="flex border-b pb-4">
                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                                  <img
                                    src={item.base?.image || ""}
                                    alt={item.base?.name || ""}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </div>
                                <div className="ml-4 flex flex-1 flex-col">
                                  <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                      <h3>Custom Pizza</h3>
                                      <p className="ml-4">₹{item.totalPrice}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {item.base?.name} base with {item.sauce?.name} sauce
                                    </p>
                                  </div>
                                  <div className="flex flex-1 items-end justify-between text-sm">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFromCart(index)}
                                      className="text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="mt-4 border-t pt-4">
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>₹{calculateCartTotal()}</span>
                          </div>
                        </div>
                        <SheetFooter className="flex-col gap-3 sm:flex-row mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearCart}
                            className="w-full"
                          >
                            Clear Cart
                          </Button>
                          <SheetClose asChild>
                            <Button asChild className="w-full">
                              <Link href="/checkout">Checkout</Link>
                            </Button>
                          </SheetClose>
                        </SheetFooter>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-60">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500">Your cart is empty</p>
                        <SheetClose asChild>
                          <Button className="mt-6" asChild>
                            <Link href="/build-pizza">Start Building Pizza</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-avatar.jpg" alt={user.username} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.username}</p>
                        <p className="w-[200px] truncate text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/orders">
                        <a className="flex cursor-pointer items-center">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <a className="flex cursor-pointer items-center">
                            <ChefHat className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-500"
                      onSelect={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/auth">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <a
                  className={`${
                    location === link.href
                      ? "bg-primary-light text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } block pl-3 pr-4 py-2 text-base font-medium`}
                  onClick={toggleMenu}
                >
                  <div className="flex items-center">
                    {link.icon}
                    {link.name}
                  </div>
                </a>
              </Link>
            ))}
            
            {user?.isAdmin && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                {adminLinks.map((link) => (
                  <Link key={link.name} href={link.href}>
                    <a
                      className={`${
                        location === link.href
                          ? "bg-primary-light text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } block pl-3 pr-4 py-2 text-base font-medium`}
                      onClick={toggleMenu}
                    >
                      <div className="flex items-center">
                        {link.icon}
                        {link.name}
                      </div>
                    </a>
                  </Link>
                ))}
              </>
            )}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={user.username} />
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.username}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                  <Link href="/checkout">
                    <Button variant="ghost" size="icon" className="ml-auto relative" onClick={toggleMenu}>
                      <ShoppingCart className="h-6 w-6" />
                      {cartItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                          {cartItems.length}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
                <div className="mt-3 space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start pl-4 text-red-600"
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="px-4 py-2">
                <Button asChild className="w-full" onClick={toggleMenu}>
                  <Link href="/auth">
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

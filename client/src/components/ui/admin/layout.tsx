import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import {
  LayoutDashboard,
  PackageOpen,
  ShoppingBag,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the admin area.
            </p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const sidebarLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Inventory",
      href: "/admin/inventory",
      icon: <PackageOpen className="h-5 w-5" />,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white shadow-sm py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/admin">
              <a className="ml-2 font-bold text-xl text-primary">Admin Panel</a>
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/">
              <a className="text-sm text-gray-600 mr-4">View Site</a>
            </Link>
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username} />
              <AvatarFallback>{getInitials(user?.username || "")}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden lg:block lg:w-64 bg-white shadow-sm border-r">
          <div className="h-full flex flex-col">
            <div className="flex items-center p-6 border-b">
              <Link href="/admin">
                <a className="font-bold text-xl text-primary">Admin Panel</a>
              </Link>
            </div>

            <nav className="flex-1 p-4">
              <ul className="space-y-1">
                {sidebarLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <a
                        className={`
                          flex items-center px-4 py-3 rounded-md transition-colors
                          ${
                            location === link.href
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        {link.icon}
                        <span className="ml-3">{link.name}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 border-t">
              <div className="flex items-center mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username} />
                  <AvatarFallback>{getInitials(user?.username || "")}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="font-medium">{user?.username}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="h-full w-64 bg-white">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-xl text-primary">Admin Panel</span>
                <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <nav className="p-4">
                <ul className="space-y-1">
                  {sidebarLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>
                        <a
                          className={`
                            flex items-center px-4 py-3 rounded-md transition-colors
                            ${
                              location === link.href
                                ? "bg-primary text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }
                          `}
                          onClick={toggleSidebar}
                        >
                          {link.icon}
                          <span className="ml-3">{link.name}</span>
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user?.username} />
                    <AvatarFallback>{getInitials(user?.username || "")}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

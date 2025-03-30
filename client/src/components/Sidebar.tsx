import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  User,
  Megaphone,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Customer Lists",
      path: "/customer-lists",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "Customers",
      path: "/customers",
      icon: <User className="w-5 h-5" />,
    },
    {
      name: "Campaigns",
      path: "/campaigns",
      icon: <Megaphone className="w-5 h-5" />,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <UserCircle className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gray-800 text-white w-64 flex-shrink-0 fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:transform-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center">
            <Megaphone className="mr-2 h-5 w-5" />
            Campaign Manager
          </h1>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.path} className="mb-1">
                <Link href={item.path}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg mx-2",
                      location === item.path && "bg-gray-700 text-white"
                    )}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </a>
                </Link>
              </li>
            ))}
            <li className="mt-6">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg mx-2 w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-2">Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

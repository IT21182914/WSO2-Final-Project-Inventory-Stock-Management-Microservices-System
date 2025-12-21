import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AsgardeoAuthContext";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingCart,
  Activity,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Calculator,
  AlertTriangle,
  Star,
  UserCog,
} from "lucide-react";
import { cn } from "../../utils/helpers";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path:
        user?.role === "admin"
          ? "/dashboard/admin"
          : user?.role === "warehouse_staff"
          ? "/dashboard/warehouse"
          : "/dashboard/supplier",
      icon: LayoutDashboard,
      roles: ["admin", "warehouse_staff", "supplier"],
    },
    {
      name: "Products",
      path: "/products",
      icon: Package,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Product Lifecycle",
      path: "/products/lifecycle",
      icon: GitBranch,
      roles: ["admin"],
    },
    {
      name: "Pricing Calculator",
      path: "/products/pricing",
      icon: Calculator,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Categories",
      path: "/categories",
      icon: Boxes,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: Boxes,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Low Stock Alerts",
      path: "/inventory/alerts",
      icon: AlertTriangle,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Suppliers",
      path: "/suppliers",
      icon: Truck,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Product-Supplier Links",
      path: "/product-suppliers",
      icon: Truck,
      roles: ["admin"],
    },
    {
      name: "Purchase Orders",
      path: "/purchase-orders",
      icon: ShoppingCart,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "Purchase Requests",
      path: "/purchase-requests",
      icon: ShoppingCart,
      roles: ["supplier"],
    },
    {
      name: "My Profile",
      path: "/supplier-profile",
      icon: UserCog,
      roles: ["supplier"],
    },
    {
      name: "Orders",
      path: "/orders",
      icon: ShoppingCart,
      roles: ["admin", "warehouse_staff"],
    },
    {
      name: "User Management",
      path: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Health Monitor",
      path: "/health",
      icon: Activity,
      roles: ["admin"],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white transition-all duration-300 flex flex-col shadow-2xl",
        isOpen ? "w-72" : "w-20"
      )}
    >
      {/* Logo Section - Modern with gradient */}
      <div className="relative p-6 border-b border-gray-800/50 flex items-center justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"></div>
        {isOpen && (
          <div className="relative z-10">
            <h1
              className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              InvenTrack
            </h1>
            <p
              className="text-xs text-gray-400 mt-1 tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Inventory System
            </p>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-10 p-2.5 rounded-xl hover:bg-orange-500/20 transition-all duration-300 hover:scale-110 active:scale-95"
        >
          {isOpen ? (
            <ChevronLeft size={20} className="text-orange-400" />
          ) : (
            <ChevronRight size={20} className="text-orange-400" />
          )}
        </button>
      </div>

      {/* Navigation - Sleek modern design */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ul className="space-y-1.5">
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-orange-600/20 animate-pulse"></div>
                    )}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
                        isActive
                          ? "bg-white/10"
                          : "bg-gray-800/50 group-hover:bg-gray-700/50"
                      )}
                    >
                      <item.icon
                        size={20}
                        className={cn(
                          "transition-all duration-300",
                          isActive
                            ? "text-white"
                            : "text-orange-400 group-hover:text-orange-300"
                        )}
                      />
                    </div>
                    {isOpen && (
                      <span
                        className={cn(
                          "ml-3 font-medium relative z-10 transition-all duration-300",
                          isActive
                            ? "text-white"
                            : "text-gray-300 group-hover:text-white"
                        )}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {item.name}
                      </span>
                    )}
                    {isActive && isOpen && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info - Modern card design */}
      {isOpen && user && (
        <div className="relative p-4 border-t border-gray-800/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent"></div>
          <div className="relative z-10 flex items-center bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300">
            <div className="relative">
              <div
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/30"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {(user.full_name || user.username)?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-gray-900"></div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p
                className="text-sm font-semibold text-white truncate"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {user.full_name || user.username}
              </p>
              <p
                className="text-xs text-gray-400 capitalize truncate"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {user.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

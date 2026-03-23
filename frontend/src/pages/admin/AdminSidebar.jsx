import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  Gauge,
  UsersThree,
  CalendarCheck,
  Wrench,
  Gear,
  SignOut,
  Money,
} from "phosphor-react";

function AdminSidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: Gauge, route: "/admin" },
    { name: "Users", icon: UsersThree, route: "/AdminUsers" },
    { name: "Bookings", icon: CalendarCheck, route: "/AdminBookings" },
    { name: "Technicians", icon: Wrench, route: "/AdminTechnicians" },
    { name: "Revenue", icon: Money, route: "/AdminRevenue" },
    { name: "Profile", icon: Gear, route: "/AdminProfile" },
    
  ];

  // Listen for open event dispatched by each page's mobile header button
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-admin-sidebar", handler);
    return () => window.removeEventListener("open-admin-sidebar", handler);
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleNavigate = (route) => {
    navigate(route);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar — always fixed overlay, never shifts layout */}
      <aside
        className={`w-64 bg-white border-r border-stone-200 fixed left-0 top-16 bottom-0 overflow-y-auto z-50 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-3 right-3 p-1 rounded-lg hover:bg-stone-100"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Admin Profile */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-color-main flex items-center justify-center text-white font-bold text-lg">
              AD
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Admin</h3>
              <p className="text-xs text-stone-500">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  window.location.pathname === item.route
                    ? "bg-color-main text-white shadow-md"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Icon size={20} weight="duotone" />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-stone-200 absolute bottom-0 left-0 right-0 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-all"
          >
            <SignOut size={20} weight="duotone" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;

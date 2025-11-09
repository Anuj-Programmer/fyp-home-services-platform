import React, { useState } from "react";
import { List, X } from "phosphor-react";
import { Link } from "react-router-dom"; // import Link

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="text-2xl font-bold">MyLogo</div>

          {/* Desktop buttons */}
          <div className="hidden md:flex space-x-4">
            <button>
              Become a Technician
            </button>
            <Link to="/login" className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-orange-500 rounded hover:bg-orange-400"
            >
              Sign Up
            </Link>
          </div>

          {/* Hamburger button for mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <List size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar / Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button>
              Become a Technician
            </button>
            <button className="block w-full text-left px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">
              Login
            </button>
            <Link
              to="/register"
              className="block w-full text-left px-4 py-2 bg-orange-500 rounded hover:bg-orange-400"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

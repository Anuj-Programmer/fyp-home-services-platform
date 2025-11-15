import React, { useState } from "react";
import { List, X } from "phosphor-react";
import { Link } from "react-router-dom";
import "../css/nav.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="text-black border-b border-gray-400 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="text-2xl font-bold">HomeCare</div>

         
          <div className="hidden md:flex space-x-4">
            <button>
              Become a Technician
            </button>
            <Link to="/login" className="px-4 py-2 bg-white-600 rounded-[15px] hover:bg-gray-100 border">
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-blue-500 rounded-[15px] hover:bg-blue-600 text-white signup-btn"
            >
              Sign Up
            </Link>
          </div>

         
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

     
      {isOpen && (
        <div className="md:hidden bg-white-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button>
              Become a Technician
            </button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-400">
              Login
            </button>
            <Link
              to="/register"
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
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

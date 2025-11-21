import React, { useState } from "react";
import { List, X, Bell, UserCircle } from "phosphor-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../css/nav.css";
import Logo from "../assets/Logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const token = Cookies.get("token") || localStorage.getItem("token");
  const isAuthenticated = Boolean(token);

  let isAdmin = false;
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      isAdmin = Boolean(JSON.parse(storedUser)?.isAdmin);
    } catch (error) {
      console.error("Invalid user data in storage", error);
    }
  }

  // Hide links only on OTP pages
  const hideNavLinks =
    location.pathname === "/verify-otp" ||
    location.pathname === "/verify-otp-login" || 
    location.pathname === "/register-details";
    
  const handleLogoClick = () => {
    // Optional: Add any logic you want when the logo is clicked
    localStorage.removeItem("otpVerified");
    localStorage.removeItem("email"); // Close mobile menu on logo click
  }

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="text-black border-gray-400 bg-gray-100 fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link
            to={isAdmin ? "/admin" : isAuthenticated ? "/home" : "/"}
            className="Logo"
            onClick={handleLogoClick}
          >
            <img className="w-40" src={Logo} alt="HomeCare Logo" />
          </Link>

          {/* Desktop Links / Actions (Hidden on OTP pages) */}
          {!hideNavLinks && (
            <div className="hidden md:flex items-center space-x-4 relative">
              {/* Search bar for authenticated users */}
              {isAuthenticated && (
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="hidden lg:flex items-center bg-white border rounded-full px-3 py-1.5 min-w-[220px]"
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search services"
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </form>
              )}

              {/* Show login/register only when not authenticated */}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 bg-white-600 rounded-[15px] btn-transparent-slide hover:bg-gray-50 border"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-[15px]  text-white signup-btn btn-filled-slide"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Authenticated: Notification & Profile buttons */}
              {isAuthenticated && (
                <>
                  {/* Notification button */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowProfileMenu(false);
                      }}
                      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white border hover:bg-gray-50 transition"
                    >
                      <Bell size={20} />
                      <span className="absolute top-1 right-1 inline-flex w-2 h-2 rounded-full bg-red-500" />
                    </button>

                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md border text-sm z-50">
                        <div className="px-4 py-2 border-b font-semibold">
                          Notifications
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                            <p className="font-medium text-gray-800">
                              Upcoming cleaning tomorrow
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Amit Sharma arrives at 10:00 AM
                            </p>
                          </div>
                          <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                            <p className="font-medium text-gray-800">
                              Payment received
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Your last service has been paid successfully.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile button */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowProfileMenu(!showProfileMenu);
                        setShowNotifications(false);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border hover:bg-gray-50 transition"
                    >
                      <UserCircle size={22} />
                      <span className="text-sm font-medium">Profile</span>
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-md border text-sm z-50">
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-50"
                          onClick={() => {
                            navigate("/profile");
                            setShowProfileMenu(false);
                          }}
                        >
                          View Profile
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-50"
                          onClick={() => {
                            navigate("/bookings");
                            setShowProfileMenu(false);
                          }}
                        >
                          Booking
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button (Disable if no links) */}
          {!hideNavLinks && (
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="focus:outline-none"
              >
                {isOpen ? <X size={28} /> : <List size={28} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {!hideNavLinks && isOpen && (
        <div className="md:hidden bg-white-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
                  {/* Mobile: show login/register only when not authenticated */}
                  {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-400"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Mobile: Authenticated extras */}
            {isAuthenticated && (
              <>
                <div className="px-4 py-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search services"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    // Just close menu; full-blown modal not necessary on mobile
                    setIsOpen(false);
                    setShowNotifications(true);
                  }}
                >
                  Notifications
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    navigate("/profile");
                    setIsOpen(false);
                  }}
                >
                  Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

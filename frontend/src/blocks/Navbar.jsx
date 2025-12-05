import React, { useState } from "react";
import { List, X, Bell, UserCircle } from "phosphor-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../css/nav.css";
import Logo from "../assets/Logo.png";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

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
  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
      isAdmin = Boolean(user?.isAdmin);
    } catch (error) {
      console.error("Invalid user data in storage", error);
    }
  }

  // Hide links only on OTP pages
  const hideNavLinks =
    location.pathname === "/verify-otp" ||
    location.pathname === "/verify-otp-login" ||
    location.pathname === "/register-details" ||
    location.pathname === "/verify-otp-technician" ||
    location.pathname === "/register-technician-details";

  const handleLogoClick = () => {
    // Optional: Add any logic you want when the logo is clicked
    localStorage.removeItem("otpVerified");
    localStorage.removeItem("email");
    localStorage.removeItem("technicianOtpVerified");
    localStorage.removeItem("technicianEmail"); // Close mobile menu on logo click
  };

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.clear();
    navigate("/");
  };

  const handleTechnicianStatus = async (technicianId, status) => {
    try {
      const { data } = await axios.patch(`/api/admin/${technicianId}/status`, {
        status,
      });
      toast.success(data.message || `Technician ${status}`);

      // Remove notification from localStorage user copy
      const updatedUser = { ...user };
      updatedUser.notification = updatedUser.notification.filter(
        (n) => n.technicianId !== technicianId
      );
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Optional: update state to rerender dropdown
      setShowNotifications(false);
      setTimeout(() => setShowNotifications(true), 100);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating status");
    }
  };

  return (
    <nav className="text-black border-gray-400 bg-gray-100 fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            to={
              isAdmin
                ? "/admin"
                : user?.role === "technician"
                ? "/technician-dashboard"
                : isAuthenticated
                ? "/home"
                : "/"
            }
            className="Logo"
            onClick={handleLogoClick}
          >
            <img className="w-40" src={Logo} alt="HomeCare Logo" />
          </Link>

          {/* Desktop Links / Actions (Hidden on OTP pages) */}
          {!hideNavLinks && (
            <div className="hidden md:flex items-center space-x-4 relative">
              {/* Search bar for authenticated users */}
              {isAuthenticated && user?.role !== "technician" && (
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
                  <Link to="/register-technician" className="">
                    Become a Professional
                  </Link>
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
                          {user?.notification?.length > 0 ? (
                            user.notification.map((notification, index) => (
                              <div
                                key={index}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                              >
                                <p className="font-medium text-gray-800">
                                  {notification.message ||
                                    `New notification from ${notification.name}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleString()}
                                </p>

                                {/* Only show approve/decline for technician application notifications */}
                                {notification.action === "approve_or_reject" &&
                                  notification.technicianId && (
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                        onClick={() =>
                                          handleTechnicianStatus(
                                            notification.technicianId,
                                            "approved"
                                          )
                                        }
                                      >
                                        Approve
                                      </button>
                                      <button
                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                        onClick={() =>
                                          handleTechnicianStatus(
                                            notification.technicianId,
                                            "rejected"
                                          )
                                        }
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  )}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500">
                              No notifications
                            </div>
                          )}
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
                            navigate(user?.role === "technician" ? "/technician-profile" : "/profile");
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
                  to="/become-professional"
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-400"
                >
                  Become a Professional
                </Link>
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

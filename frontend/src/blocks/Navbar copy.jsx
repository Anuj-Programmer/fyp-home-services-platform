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
  const [mobileModal, setMobileModal] = useState(null); // "search", "notifications", "profile", or null
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

  const handleMarkAllAsRead = async () => {
    try {
      const { data } = await axios.post(
        "/api/users/mark-all-notifications",
        { userId: user?._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(data.message || "All notifications marked as read");
      
      // Update localStorage with the updated user data
      localStorage.setItem("user", JSON.stringify(data.data));
      
      // Close and reopen notification dropdown to show updated state
      setShowNotifications(false);
      setTimeout(() => setShowNotifications(true), 100);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error marking notifications as read");
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      const { data } = await axios.post(
        "/api/users/delete-all-notifications",
        { userId: user?._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(data.message || "All notifications deleted");
      
      // Update localStorage with the updated user data
      localStorage.setItem("user", JSON.stringify(data.data));
      
      // Close notification dropdown
      setShowNotifications(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error deleting notifications");
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
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
              {/* Search bar for authenticated users - only show for regular users, not admin or technician */}
              {isAuthenticated && user?.role !== "technician" && !isAdmin && (
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
                        <div className="px-4 py-2 border-b font-semibold flex justify-between items-center">
                          <span>Notifications</span>
                          {user?.notification?.length > 0 && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                              {user.notification.length}
                            </span>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {user?.notification?.length > 0 ? (
                            user.notification.map((notification, index) => (
                              <div
                                key={index}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
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
                        
                        {/* Action buttons - Mark as read and Delete all */}
                        {user?.notification?.length > 0 && (
                          <div className="border-t px-4 py-2 flex gap-2 bg-gray-50">
                            <button
                              onClick={handleMarkAllAsRead}
                              className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                            >
                              Mark as Read
                            </button>
                            <button
                              onClick={handleDeleteAllNotifications}
                              className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                              Delete All
                            </button>
                          </div>
                        )}
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
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-white border hover:bg-gray-50 transition"
                    >
                      <UserCircle size={22} />
                      {/* <span className="text-sm font-medium">Profile</span> */}
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

          {/* Mobile Menu Button - Only show for unauthenticated users */}
          {!hideNavLinks && !isAuthenticated && (
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="focus:outline-none"
              >
                {isOpen ? <X size={28} /> : <List size={28} />}
              </button>
            </div>
          )}

          {/* Mobile Icons - Only for authenticated users */}
          {!hideNavLinks && isAuthenticated && (
            <div className="md:hidden flex items-center space-x-2">
              {/* Search icon - mobile */}
              {user?.role !== "technician" && !isAdmin && (
                <button
                  onClick={() => setMobileModal("search")}
                  className="p-1.5 hover:bg-gray-50 rounded transition"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
              
              {/* Notification icon - mobile */}
              <button
                onClick={() => setMobileModal("notifications")}
                className="relative p-1.5 hover:bg-gray-50 rounded transition"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {user?.notification?.length > 0 && (
                  <span className="absolute top-0 right-0 inline-flex w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>

              {/* Profile icon - mobile */}
              <button
                onClick={() => setMobileModal("profile")}
                className="p-1.5 hover:bg-gray-50 rounded transition"
                aria-label="Profile"
              >
                <UserCircle size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Full-Screen Modals */}
      {!hideNavLinks && mobileModal && (
        <div className="fixed top-16 left-0 right-0 bottom-0 bg-gray-100 z-40 md:hidden overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-white border-b sticky top-0">
            <h2 className="text-lg font-semibold">
              {mobileModal === "search" && "Search Services"}
              {mobileModal === "notifications" && "Notifications"}
              {mobileModal === "profile" && "Profile"}
            </h2>
            <button
              onClick={() => setMobileModal(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="px-4 py-4">
            {/* Search Modal */}
            {mobileModal === "search" && (
              <div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search services"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  autoFocus
                />
              </div>
            )}

            {/* Notifications Modal */}
            {mobileModal === "notifications" && (
              <div>
                <div className="space-y-2">
                  {user?.notification?.length > 0 ? (
                    <>
                      {user.notification.map((notification, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border rounded-lg"
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
                                  onClick={() => {
                                    handleTechnicianStatus(
                                      notification.technicianId,
                                      "approved"
                                    );
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                  onClick={() => {
                                    handleTechnicianStatus(
                                      notification.technicianId,
                                      "rejected"
                                    );
                                  }}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                        </div>
                      ))}
                      {/* Action buttons */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex-1 px-2 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        >
                          Mark as Read
                        </button>
                        <button
                          onClick={handleDeleteAllNotifications}
                          className="flex-1 px-2 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Delete All
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No notifications
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Profile Modal */}
            {mobileModal === "profile" && (
              <div className="space-y-2">
                <button
                  className="w-full text-left px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    navigate(
                      user?.role === "technician"
                        ? "/technician-profile"
                        : "/profile"
                    );
                    setMobileModal(null);
                  }}
                >
                  View Profile
                </button>
                <button
                  className="w-full text-left px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    navigate("/bookings");
                    setMobileModal(null);
                  }}
                >
                  Booking
                </button>
                <button
                  className="w-full text-left px-4 py-3 bg-white border rounded-lg text-red-500 hover:bg-red-50"
                  onClick={() => {
                    setMobileModal(null);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu - Only for unauthenticated users */}
      {!hideNavLinks && !isAuthenticated && isOpen && (
        <div className="md:hidden bg-white-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/register-technician"
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
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar;

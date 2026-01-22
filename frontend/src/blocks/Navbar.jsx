import React, { useState, useEffect } from "react";
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
  const [mobileModal, setMobileModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const token = Cookies.get("token") || localStorage.getItem("token");
  const isAuthenticated = Boolean(token);
  const isAdmin = Boolean(user?.isAdmin);

  // Fetch current user and notifications from backend
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get("/api/users/current-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(data);
        setNotifications(data.notification || []);

        // Optional: Update localStorage as a cache
        localStorage.setItem("user", JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching user:", error);

        // Fallback to localStorage if API fails
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setNotifications(parsedUser.notification || []);
          } catch (e) {
            console.error("Invalid user data in storage", e);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated, token]);

  // Refresh notifications periodically (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(async () => {
      try {
        const { data } = await axios.get("/api/users/current-user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setNotifications(data.notification || []);
        setUser(data);
      } catch (error) {
        console.error("Error refreshing notifications:", error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated, token]);

  // Hide links only on OTP pages
  const hideNavLinks =
    location.pathname === "/verify-otp" ||
    location.pathname === "/verify-otp-login" ||
    location.pathname === "/register-details" ||
    location.pathname === "/verify-otp-technician" ||
    location.pathname === "/register-technician-details";

  const handleLogoClick = () => {
    localStorage.removeItem("otpVerified");
    localStorage.removeItem("email");
    localStorage.removeItem("technicianOtpVerified");
    localStorage.removeItem("technicianEmail");
  };

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.clear();
    setUser(null);
    setNotifications([]);
    navigate("/");
  };

  const handleTechnicianStatus = async (technicianId, status) => {
    try {
      const { data } = await axios.patch(`/api/admin/${technicianId}/status`, {
        status,
      });
      toast.success(data.message || `Technician ${status}`);

      // Refresh notifications from backend
      const userData = await axios.get("/api/users/current-user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(userData.data);
      setNotifications(userData.data.notification || []);
      localStorage.setItem("user", JSON.stringify(userData.data));
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
        },
      );
      toast.success(data.message || "All notifications marked as read");

      // Update state with backend response
      setUser(data.data);
      setNotifications(data.data.notification || []);
      localStorage.setItem("user", JSON.stringify(data.data));
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Error marking notifications as read",
      );
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
        },
      );
      //toast.success(data.message || "All notifications deleted");

      // Update state with backend response
      setUser(data.data);
      setNotifications(data.data.notification || []);
      localStorage.setItem("user", JSON.stringify(data.data));

      setShowNotifications(false);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Error deleting notifications",
      );
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    try {
      // Navigate to search results page with search query
      navigate(`/search-results?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
      setMobileModal(null);
    } catch (err) {
      console.error("Error navigating to search:", err);
      toast.error("Error performing search");
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

            {/* Desktop Links / Actions */}
            {!hideNavLinks && (
              <div className="hidden md:flex items-center space-x-4 relative">
                {/* Search bar */}
                {isAuthenticated && user?.role !== "technician" && !isAdmin && (
                  <form
                    onSubmit={handleSearchSubmit}
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

                {/* Unauthenticated buttons */}
                {!isAuthenticated && (
                  <>
                    <Link to="/register-technician" className="text-base">
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
                      className="px-4 py-2 rounded-[15px] text-white signup-btn btn-filled-slide"
                    >
                      Sign Up
                    </Link>
                  </>
                )}

                {/* Authenticated: Notification & Profile */}
                {isAuthenticated && !loading && (
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
                        {notifications.length > 0 && (
                          <span className="absolute top-1 right-1 inline-flex w-2 h-2 rounded-full bg-red-500" />
                        )}
                      </button>

                      {showNotifications && (
                        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-md border text-sm z-50">
                          <div className="px-4 py-2 border-b font-semibold flex justify-between items-center">
                            <span>Notifications</span>
                            {notifications.length > 0 && (
                              <button
                                onClick={handleDeleteAllNotifications}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length > 0 ? (
                              notifications.map((notification, index) => (
                                <div
                                  key={index}
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
                                >
                                  <p className="font-medium text-gray-800">
                                    {notification.message ||
                                      `New notification from ${notification.name}`}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notification.date
                                      ? new Date(
                                          notification.date,
                                        ).toLocaleString()
                                      : notification.createdAt
                                        ? new Date(
                                            notification.createdAt,
                                          ).toLocaleString()
                                        : "—"}
                                  </p>

                                  {notification.action ===
                                    "approve_or_reject" &&
                                    notification.technicianId && (
                                      <div className="mt-2 flex gap-2">
                                        <button
                                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                          onClick={() =>
                                            handleTechnicianStatus(
                                              notification.technicianId,
                                              "approved",
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
                                              "rejected",
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
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-white border hover:bg-gray-50 transition"
                      >
                        <UserCircle size={22} />
                      </button>

                      {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-md border text-sm z-50">
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                            onClick={() => {
                              navigate(
                                user?.role === "technician"
                                  ? "/technician-profile"
                                  : "/profile",
                              );
                              setShowProfileMenu(false);
                            }}
                          >
                            View Profile
                          </button>
                          {!isAdmin && (
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-gray-50"
                              onClick={() => {
                                navigate(
                                  user?.role === "technician"
                                    ? "/TechnicianBookings"
                                    : "/bookings",
                                );
                                setShowProfileMenu(false);
                              }}
                            >
                              Booking
                            </button>
                          )}
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

            {/* Mobile Menu Button */}
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

            {/* Mobile Icons - Authenticated */}
            {!hideNavLinks && isAuthenticated && !loading && (
              <div className="md:hidden flex items-center space-x-2">
                {user?.role !== "technician" && !isAdmin && (
                  <button
                    onClick={() => setMobileModal("search")}
                    className="p-1.5 hover:bg-gray-50 rounded transition"
                    aria-label="Search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                )}

                <button
                  onClick={() => setMobileModal("notifications")}
                  className="relative p-1.5 hover:bg-gray-50 rounded transition"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>

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
            <div className="flex justify-between items-center px-4 py-3 bg-white border-b sticky top-0">
              <h2 className="text-lg font-semibold">
                {mobileModal === "search" && "Search Services"}
                {mobileModal === "notifications" && "Notifications"}
                {mobileModal === "profile" && "Profile"}
              </h2>
              <div className="flex items-center gap-4">
                {mobileModal === "notifications" &&
                  notifications.length > 0 && (
                    <button
                      onClick={handleDeleteAllNotifications}
                      className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Clear All
                    </button>
                  )}
                <button
                  onClick={() => setMobileModal(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="px-4 py-4">
              {mobileModal === "search" && (
                <div>
                  <form onSubmit={handleSearchSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search services"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Search
                    </button>
                  </form>
                </div>
              )}

              {mobileModal === "notifications" && (
                <div>
                  <div className="space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border rounded-lg"
                        >
                          <p className="font-medium text-gray-800">
                            {notification.message ||
                              `New notification from ${notification.name}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.date
                              ? new Date(notification.date).toLocaleString()
                              : notification.createdAt
                                ? new Date(
                                    notification.createdAt,
                                  ).toLocaleString()
                                : "—"}
                          </p>

                          {notification.action === "approve_or_reject" &&
                            notification.technicianId && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                                  onClick={() => {
                                    handleTechnicianStatus(
                                      notification.technicianId,
                                      "approved",
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
                                      "rejected",
                                    );
                                  }}
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No notifications
                      </p>
                    )}
                  </div>
                </div>
              )}

              {mobileModal === "profile" && (
                <div className="space-y-2">
                  <button
                    className="w-full text-left px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
                    onClick={() => {
                      navigate(
                        user?.role === "technician"
                          ? "/technician-profile"
                          : "/profile",
                      );
                      setMobileModal(null);
                    }}
                  >
                    View Profile
                  </button>
                  {/* Hide Booking button if isAdmin */}
                  {!isAdmin && (
                    <button
                      className="w-full text-left px-4 py-3 bg-white border rounded-lg hover:bg-gray-50"
                      onClick={() => {
                        navigate(
                          user?.role === "technician"
                            ? "/TechnicianBookings"
                            : "/bookings",
                        );
                        setMobileModal(null);
                      }}
                    >
                      Booking
                    </button>
                  )}
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

        {/* Mobile Menu - Unauthenticated */}
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

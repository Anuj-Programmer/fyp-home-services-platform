import React, { useState, useEffect, useMemo, useRef } from "react";
import { List, X, Bell, UserCircle, MagnifyingGlass } from "phosphor-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../css/nav.css";
import Logo from "../assets/Logo.png";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";

const Navbar = () => {
  const token = Cookies.get("token") || localStorage.getItem("token");
  const isAuthenticated = Boolean(token);

  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileModal, setMobileModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user, loading, refreshUser, setUserData, clearUser } = useUser();

  const location = useLocation();
  const navigate = useNavigate();

  // Get notifications from WebSocket context instead of state
  const {
    notifications: socketNotifications,
    registerUser,
    clearNotifications,
  } = useSocket();
  const notifications = useMemo(() => {
    const dbNotifications = Array.isArray(user?.notification) ? user.notification : [];
    const combined = [...socketNotifications, ...dbNotifications];
    const seen = new Set();

    return combined
      .map((notification, index) => {
        const eventTime =
          notification?.date ||
          notification?.createdAt ||
          notification?.timestamp ||
          null;
        const uniqueKey =
          notification?._id ||
          notification?.id ||
          `${notification?.type || "notif"}-${notification?.message || ""}-${notification?.bookingId || ""}-${eventTime || index}`;

        return {
          ...notification,
          id: notification?.id || notification?._id || uniqueKey,
          __key: String(uniqueKey),
        };
      })
      .filter((notification) => {
        if (seen.has(notification.__key)) {
          return false;
        }
        seen.add(notification.__key);
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.date || b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });
  }, [socketNotifications, user?.notification]);
  const isAdmin = Boolean(user?.isAdmin);
  const isNormalAuthenticatedUser =
    isAuthenticated && !isAdmin && user?.role !== "technician";
  const navItems = [
    { label: "Home", path: "/home" },
    { label: "Services", path: "/services" },
    { label: "Booking", path: "/bookings" },
  ];
  const publicNavItems = [
    { label: "Services", sectionId: "services" },
    { label: "Team", sectionId: "team" },
    { label: "Contact", sectionId: "contact" },
  ];
  const resolvedActiveNavIndex = navItems.findIndex(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`),
  );
  const [activeNavIndex, setActiveNavIndex] = useState(
    resolvedActiveNavIndex >= 0 ? resolvedActiveNavIndex : 0,
  );
  const resolvedPublicNavIndex =
    location.pathname === "/"
      ? publicNavItems.findIndex((item) => location.hash === `#${item.sectionId}`)
      : -1;
  const [activePublicNavIndex, setActivePublicNavIndex] = useState(
    resolvedPublicNavIndex,
  );
  const navTransitionTimeoutRef = useRef(null);

  useEffect(() => {
    if (resolvedActiveNavIndex >= 0) {
      setActiveNavIndex(resolvedActiveNavIndex);
    }
  }, [resolvedActiveNavIndex]);

  useEffect(() => {
    setActivePublicNavIndex(resolvedPublicNavIndex);
  }, [resolvedPublicNavIndex]);

  useEffect(() => {
    return () => {
      if (navTransitionTimeoutRef.current) {
        clearTimeout(navTransitionTimeoutRef.current);
      }
    };
  }, []);

  const handleDesktopNavTabClick = (event, index, path) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    if (location.pathname === path) {
      return;
    }

    event.preventDefault();
    setActiveNavIndex(index);

    if (navTransitionTimeoutRef.current) {
      clearTimeout(navTransitionTimeoutRef.current);
    }

    navTransitionTimeoutRef.current = setTimeout(() => {
      navigate(path);
    }, 180);
  };

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    registerUser(user._id);
  }, [isAuthenticated, user?._id, registerUser]);

  // Hide links only on OTP pages
  const hideNavLinks =
    location.pathname === "/verify-otp" ||
    location.pathname === "/verify-otp-login" ||
    location.pathname === "/register-details" ||
    location.pathname === "/verify-otp-technician" ||
    location.pathname === "/register-technician-details";
  const isLandingPage = location.pathname === "/";

  const handleLogoClick = () => {
    localStorage.removeItem("otpVerified");
    localStorage.removeItem("email");
    localStorage.removeItem("technicianOtpVerified");
    localStorage.removeItem("technicianEmail");
  };

  const handleLogout = () => {
    Cookies.remove("token");
    localStorage.clear();
    clearUser();
    navigate("/");
  };

  const handleTechnicianStatus = async (technicianId, status) => {
    try {
      const { data } = await apiClient.patch(`/api/admin/${technicianId}/status`, {
        status,
      });
      toast.success(data.message || `Technician ${status}`);
      await refreshUser();
      // Socket events will update notifications automatically
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating status");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data } = await apiClient.post(
        "/api/users/mark-all-notifications",
        { userId: user?._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success(data.message || "All notifications marked as read");

      // Update user data
      setUserData(data.data);
      // Socket events will update notifications automatically
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Error marking notifications as read",
      );
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      const { data } = await apiClient.post(
        "/api/users/delete-all-notifications",
        { userId: user?._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      //toast.success(data.message || "All notifications deleted");

      // Update user data
      setUserData(data.data);
      
      // Clear notifications from SocketContext immediately
      clearNotifications();

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

  const handlePublicNavClick = (sectionId, index) => {
    setActivePublicNavIndex(index);

    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        setIsOpen(false);
        return;
      }
    }

    navigate(`/#${sectionId}`);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="text-black fixed top-0 left-0 w-full z-50 shadow-md bg-gray-100 md:bg-white/40 md:backdrop-blur-md md:border-b md:border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              {!hideNavLinks && isNormalAuthenticatedUser && !loading && (
                <button
                  onClick={() =>
                    setMobileModal(mobileModal === "nav" ? null : "nav")
                  }
                  className="md:hidden p-1.5 hover:bg-gray-200 rounded transition"
                  aria-label="Open navigation"
                >
                  {mobileModal === "nav" ? <X size={22} /> : <List size={22} />}
                </button>
              )}

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
                <img className="w-28 sm:w-32 md:w-40" src={Logo} alt="HomeCare Logo" />
              </Link>
            </div>

            {!hideNavLinks && isNormalAuthenticatedUser && (
              <div className="hidden md:flex flex-1 items-center justify-center px-4">
                <div className="relative flex items-center">
                  <span
                    className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-24 rounded-full bg-color-main transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(${activeNavIndex * 100}%)` }}
                  />
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={(event) =>
                          handleDesktopNavTabClick(event, index, item.path)
                        }
                        className={`relative z-10 w-24 px-3 py-2 text-center text-sm font-medium transition-colors duration-300 ${
                          isActive
                            ? "txt-color-primary"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {!hideNavLinks && !isAuthenticated && (
              <div className="hidden md:flex flex-1 items-center justify-center px-4">
                <div className="relative flex items-center">
                  {publicNavItems.map((item, index) => {
                    const isActive =
                      location.pathname === "/" &&
                      location.hash === `#${item.sectionId}`;

                    return (
                      <button
                        key={item.sectionId}
                        type="button"
                        onClick={() => handlePublicNavClick(item.sectionId, index)}
                        className={`relative z-10 w-24 px-3 py-2 text-center text-sm font-medium transition-colors duration-300 ${
                          isActive
                            ? "txt-color-primary"
                            : "text-gray-600 hover:text-gray-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop Links / Actions */}
            {!hideNavLinks && (
              <div className="hidden md:flex items-center space-x-4 relative ml-auto">

                {/* Search bar */}
                {isNormalAuthenticatedUser && (
                  <form
                    onSubmit={handleSearchSubmit}
                    className="hidden lg:flex items-center gap-2 bg-white border rounded-full px-3 py-1.5 min-w-[220px]"
                  >
                    <MagnifyingGlass size={18} className="text-gray-500" weight="bold" />
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
                    <Link to="/register-technician" className="text-[15px] font-medium">
                      Become a Professional
                    </Link>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-[15px] bg-white-600 rounded-[30px] btn-transparent-slide hover:bg-gray-50 border w-20 text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 text-[15px] rounded-[30px] text-white signup-btn btn-filled-slide text-center w-30"
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
                              [...notifications]
                                .sort((a, b) => {
                                  const dateA = new Date(a.date || a.createdAt);
                                  const dateB = new Date(b.date || b.createdAt);
                                  return dateB - dateA;
                                })
                                .map((notification, index) => (
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
                                isAdmin
                                  ? "/AdminProfile"
                                  : user?.role === "technician"
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

        {/* Mobile side nav for normal authenticated users */}
        {!hideNavLinks && isNormalAuthenticatedUser && mobileModal === "nav" && (
          <div className="fixed top-16 left-0 right-0 bottom-0 z-40 md:hidden">
            <button
              className="absolute inset-0 bg-black/20"
              onClick={() => setMobileModal(null)}
              aria-label="Close navigation"
            />
            <div className="relative h-full w-72 max-w-[85%] bg-white border-r shadow-xl">
              <div className="px-5 py-4 border-b">
                <h2 className="text-base font-semibold text-gray-900">Navigation</h2>
              </div>
              <div className="px-3 py-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2.5 rounded-md text-sm font-medium transition ${
                      location.pathname === item.path
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setMobileModal(null)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Full-Screen Modals */}
        {!hideNavLinks && mobileModal && mobileModal !== "nav" && (
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
                      className="w-full px-4 py-2 bg-color-main text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Search
                    </button>
                  </form>
                </div>
              )}

              {mobileModal === "notifications" && (
                <div>
                  <div className="space-y-3">
                    {notifications.length > 0 ? (
                      [...notifications]
                        .sort((a, b) => {
                          const dateA = new Date(a.date || a.createdAt);
                          const dateB = new Date(b.date || b.createdAt);
                          return dateB - dateA;
                        })
                        .map((notification, index) => (
                        <div
                          key={index}
                          className="rounded-2xl bg-white/95 ring-1 ring-stone-200 px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-color-main" />
                            <div className="min-w-0">
                              <p className="font-medium text-stone-800 leading-snug">
                            {notification.message ||
                              `New notification from ${notification.name}`}
                              </p>
                              <p className="text-xs text-stone-500 mt-1">
                            {notification.date
                              ? new Date(notification.date).toLocaleString()
                              : notification.createdAt
                                ? new Date(
                                    notification.createdAt,
                                  ).toLocaleString()
                                : "—"}
                              </p>
                            </div>
                          </div>
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
                <div className="space-y-4">
                  <div className="rounded-2xl border border-stone-200 bg-linear-to-br from-white to-stone-100 px-4 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm">
                        <UserCircle size={24} className="text-stone-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900 leading-tight">
                          {user?.firstName
                            ? `${user.firstName} ${user?.lastName || ""}`.trim()
                            : "My account"}
                        </p>
                        <p className="text-xs text-stone-500 capitalize">
                          {isAdmin ? "admin" : user?.role || "user"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-3.5 hover:bg-stone-50 transition flex items-center justify-between"
                      onClick={() => {
                        navigate(
                          isAdmin
                            ? "/AdminProfile"
                            : user?.role === "technician"
                              ? "/technician-profile"
                              : "/profile",
                        );
                        setMobileModal(null);
                      }}
                    >
                      <span className="text-sm font-medium text-stone-800">View Profile</span>
                      <span className="text-stone-400">&gt;</span>
                    </button>

                    {!isAdmin && (
                      <button
                        className="w-full text-left px-4 py-3.5 border-t border-stone-100 hover:bg-stone-50 transition flex items-center justify-between"
                        onClick={() => {
                          navigate(
                            user?.role === "technician"
                              ? "/TechnicianBookings"
                              : "/bookings",
                          );
                          setMobileModal(null);
                        }}
                      >
                        <span className="text-sm font-medium text-stone-800">Bookings</span>
                        <span className="text-stone-400">&gt;</span>
                      </button>
                    )}
                  </div>

                  <button
                    className="w-full text-left px-4 py-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-600 font-medium hover:bg-red-100 transition"
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
          <div className="md:hidden">
            <div className={isLandingPage ? "border-t border-blue-100 bg-linear-to-b from-white via-blue-50/70 to-white px-3 pb-4 pt-3 shadow-[0_10px_26px_rgba(15,23,42,0.08)]" : "bg-white-700"}>
              <div className={isLandingPage ? "space-y-2" : "px-2 pt-2 pb-3 space-y-1"}>
                {publicNavItems.map((item) => (
                  <button
                    key={item.sectionId}
                    type="button"
                    onClick={() => handlePublicNavClick(item.sectionId)}
                    className={isLandingPage ? "flex w-full items-center justify-between rounded-xl border border-blue-100 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-color-main" : "block w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-400"}
                  >
                    <span>{item.label}</span>
                    {isLandingPage && <span className="text-slate-400">&gt;</span>}
                  </button>
                ))}

                <Link
                  to="/register-technician"
                  onClick={() => setIsOpen(false)}
                  className={isLandingPage ? "mt-1 block w-full rounded-xl bg-color-main px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_10px_22px_rgba(30,58,138,0.26)] transition hover:brightness-105" : "block w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-400"}
                >
                  Become a Professional
                </Link>

                <div className={isLandingPage ? "grid grid-cols-2 gap-2 pt-1" : ""}>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className={isLandingPage ? "block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50" : "block w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-400"}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className={isLandingPage ? "block w-full rounded-xl border border-color-main bg-white px-4 py-2.5 text-center text-sm font-semibold text-color-main transition hover:bg-blue-50" : "block w-full text-left px-4 py-2 hover:bg-gray-100"}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;

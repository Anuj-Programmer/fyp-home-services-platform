
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Navbar from "../../blocks/Navbar";
import AdminSidebar from "./AdminSidebar";
import { useSocket } from "../../context/SocketContext";

function APBookings() {
  const { socket } = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const formatStatus = (status) => {
    const normalized = (status || "").toLowerCase();

    if (normalized === "completed") return "Completed";
    if (normalized === "cancelled") return "Cancelled";
    if (normalized === "pending") return "Pending";
    if (normalized === "inprogress" || normalized === "ontheway") return "In Progress";
    if (normalized === "confirmed") return "Confirmed";
    if (normalized === "rescheduled") return "Rescheduled";
    if (normalized === "expired") return "Expired";
    if (normalized === "declined") return "Declined";

    return status || "Pending";
  };

  const formatAmount = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "N/A";
    return `$${numeric}`;
  };

  const formatDate = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString();
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleAdminDataChanged = (payload = {}) => {
      const changes = Array.isArray(payload.changes) ? payload.changes : [];
      if (changes.includes("bookings") || changes.includes("dashboard-stats")) {
        fetchBookings();
      }
    };

    socket.on("admin:dataChanged", handleAdminDataChanged);

    return () => {
      socket.off("admin:dataChanged", handleAdminDataChanged);
    };
  }, [socket]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      const response = await apiClient.get("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const bookingData = response.data.bookings || [];
      const formattedBookings = bookingData.map((booking) => {
        const userName =
          booking.userInfo?.firstname && booking.userInfo?.lastname
            ? `${booking.userInfo.firstname} ${booking.userInfo.lastname}`
            : "N/A";

        const technicianName =
          booking.technicianInfo?.firstname && booking.technicianInfo?.lastname
            ? `${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname}`
            : "N/A";

        return {
          _id: booking._id,
          user: userName,
          technician: technicianName,
          service: booking.technicianInfo?.servicetype || "N/A",
          status: formatStatus(booking.status),
          date: formatDate(booking.serviceDate || booking.createdAt),
          amount: formatAmount(booking.fee),
        };
      });

      setBookings(formattedBookings);
    } catch (error) {
      toast.error("Failed to fetch bookings");
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      setDeletingBookingId(bookingId);
      const token = Cookies.get("token") || localStorage.getItem("token");

      await apiClient.delete(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBookings((prevBookings) =>
        prevBookings.filter((booking) => booking._id !== bookingId)
      );
      toast.success("Booking deleted successfully");
      setBookingToDelete(null);
    } catch (error) {
      toast.error("Failed to delete booking");
      console.error("Error deleting booking:", error);
    } finally {
      setDeletingBookingId(null);
    }
  };

  const filteredBookings = (filterStatus === "All" 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus)
  ).filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.user.toLowerCase().includes(searchLower) ||
      booking.technician.toLowerCase().includes(searchLower) ||
      booking.service.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-stone-100 text-stone-800";
    }
  };

  // Calculate pending counts
  const getPendingCount = (status) => {
    if (status === "All") {
      return bookings.length;
    }
    return bookings.filter(booking => booking.status === status).length;
  };

  // Badge component helper
  const Badge = ({ count }) => {
    if (!count) return null;
    return (
      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
        {count > 9 ? "9+" : count}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-stone-50 lg:pt-4">
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-4 sm:px-6 lg:px-12 pb-8 space-y-6 lg:space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white border-b border-stone-200 flex items-center gap-3 mb-2">
            <button
              onClick={() => window.dispatchEvent(new Event("open-admin-sidebar"))}
              className="p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-stone-800 text-sm">Bookings Management</span>
          </div>

          <section className="space-y-4 pt-4 lg:pt-8">
            <p className="text-xs sm:text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold txt-color-primary">
              Bookings Management
            </h1>
            <p className="text-sm sm:text-base text-stone-500 max-w-2xl">
              View and manage all platform bookings, check statuses, and resolve issues.
            </p>
          </section>

          {/* Search Bar */}
          <section className="relative">
            <div className="relative">
              <svg 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by customer, technician, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-stone-200 bg-white text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-color-main focus:border-transparent"
              />
            </div>
          </section>

          {/* Filter Tabs */}
          <section className="flex gap-2 flex-wrap">
            {["All", "Pending", "In Progress", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center ${
                  filterStatus === status
                    ? "bg-color-main text-white"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-color-main"
                }`}
              >
                {status}
                {(status === "Pending" || status === "All") && (
                  <Badge count={getPendingCount(status)} />
                )}
              </button>
            ))}
          </section>

          {/* Bookings Table */}
          <section className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b  border-stone-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white text-sm">
                  {isLoading ? (
                    <tr><td colSpan="7" className="px-6 py-8 text-center text-stone-500">Loading bookings...</td></tr>
                  ) : filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-stone-50">
                        <td className="px-6 py-4 text-stone-700">{booking.user}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.technician}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.service}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>{booking.status}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-color-main">{booking.amount}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setBookingToDelete(booking._id)}
                            disabled={deletingBookingId === booking._id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          >
                            {deletingBookingId === booking._id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="px-6 py-8 text-center text-stone-500">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden p-4 space-y-3">
              {isLoading ? (
                <div className="py-12 text-center">
                  <p className="text-stone-500 text-base">Loading bookings...</p>
                </div>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 hover:shadow-md hover:border-stone-300 transition-all duration-200"
                  >
                    {/* Customer + Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-color-main uppercase tracking-wide mb-1">Customer</p>
                        <p className="text-sm font-semibold text-neutral-900">{booking.user}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="h-px bg-stone-100" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Technician</p>
                        <p className="text-sm font-medium text-neutral-900">{booking.technician}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Service</p>
                        <p className="text-sm font-medium text-neutral-900">{booking.service}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Date</p>
                        <p className="text-sm font-medium text-neutral-900">{booking.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Amount</p>
                        <p className="text-sm font-semibold text-color-main">{booking.amount}</p>
                      </div>
                    </div>

                    <div className="h-px bg-stone-100" />

                    <div>
                      <button
                        onClick={() => setBookingToDelete(booking._id)}
                        disabled={deletingBookingId === booking._id}
                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {deletingBookingId === booking._id ? "Deleting..." : "Delete Booking"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-stone-500 text-base">No bookings found</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close delete confirmation modal"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!deletingBookingId) setBookingToDelete(null);
            }}
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-stone-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Delete Booking</h2>
            <p className="text-sm text-stone-600">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingToDelete(null)}
                disabled={Boolean(deletingBookingId)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBooking(bookingToDelete)}
                disabled={deletingBookingId === bookingToDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deletingBookingId === bookingToDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
}

export default APBookings;

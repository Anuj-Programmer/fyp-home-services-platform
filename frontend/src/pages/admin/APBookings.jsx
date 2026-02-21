
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../../blocks/Navbar";
import Footer from "../../blocks/Footer";
import AdminSidebar from "./AdminSidebar";

function APBookings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      // You can implement the actual endpoint when backend is ready
      // const response = await axios.get("/api/admin/bookings", { headers: { Authorization: `Bearer ${token}` } });
      // setBookings(response.data.bookings || []);
      
      // For now, placeholder data
      setBookings([
        { _id: "1", user: "John Doe", technician: "Mike Johnson", service: "Plumbing", status: "Completed", date: "2024-02-15", amount: "$50" },
        { _id: "2", user: "Jane Smith", technician: "Sarah Williams", service: "Electrical", status: "Pending", date: "2024-02-18", amount: "$75" },
        { _id: "3", user: "Mike Johnson", technician: "Tom Brown", service: "HVAC", status: "In Progress", date: "2024-02-19", amount: "$100" },
        { _id: "4", user: "Alice Cooper", technician: "Mike Johnson", service: "Plumbing", status: "Completed", date: "2024-02-10", amount: "$60" },
      ]);
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = filterStatus === "All" 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus);

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

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-stone-50 pt-10">
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
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Admin Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Bookings Management
            </h1>
            <p className="text-base text-stone-500 max-w-2xl">
              View and manage all platform bookings, check statuses, and resolve issues.
            </p>
          </section>

          {/* Filter Tabs */}
          <section className="flex gap-2 flex-wrap">
            {["All", "Pending", "In Progress", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? "bg-color-main text-white"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-color-main"
                }`}
              >
                {status}
              </button>
            ))}
          </section>

          {/* Bookings Table */}
          <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {isLoading ? (
                    <tr><td colSpan="7" className="px-6 py-8 text-center text-stone-500">Loading bookings...</td></tr>
                  ) : filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-stone-50">
                        <td className="px-6 py-4 font-mono text-sm text-stone-700">{booking._id}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.user}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.technician}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.service}</td>
                        <td className="px-6 py-4 text-stone-700">{booking.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>{booking.status}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-color-main">{booking.amount}</td>
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
                      <p className="text-xs text-stone-500 mb-0.5">Booking ID</p>
                      <p className="text-xs font-mono text-stone-600">{booking._id}</p>
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
      
    </>
  );
}

export default APBookings;

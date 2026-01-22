import React, { useState, useEffect } from "react";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import "../../css/landingPage.css";
// Dummy data for technician bookings
const technicianBookings = [
  // Pending
  {
    id: "BK-3001",
    clientName: "Rajesh Kumar",
    clientPhone: "+91 9876543200",
    clientEmail: "rajesh.kumar@example.com",
    bookingDate: "08 Jan 2026",
    bookingTime: "10:00 AM",
    address: "123 MG Road, Sector 5",
    landmark: "Near City Hospital",
    serviceType: "Home Cleaning",
    status: "Pending",
    verified: true,
    note: "Client prefers morning slots. Please ring doorbell twice.",
  },
  {
    id: "BK-3002",
    clientName: "Priya Sharma",
    clientPhone: "+91 8765432100",
    clientEmail: "priya.sharma@example.com",
    bookingDate: "09 Jan 2026",
    bookingTime: "2:00 PM",
    address: "456 Park Avenue, Apt 302",
    landmark: "Opposite Green Garden Park",
    serviceType: "Plumbing Repair",
    status: "Pending",
    verified: false,
    note: "First time customer. Please introduce yourself and confirm service details.",
  },
  // Confirmed (Upcoming)
  {
    id: "BK-3003",
    clientName: "Amit Patel",
    clientPhone: "+91 7654321000",
    clientEmail: "amit.patel@example.com",
    bookingDate: "07 Jan 2026",
    bookingTime: "11:00 AM",
    address: "789 Beach Road, Ground Floor",
    landmark: "Near Metro Station",
    serviceType: "Electrical Work",
    status: "Confirmed",
    verified: true,
    note: "Please bring all necessary tools. Old wiring needs to be replaced.",
  },
  {
    id: "BK-3004",
    clientName: "Neha Verma",
    clientPhone: "+91 6543210000",
    clientEmail: "neha.verma@example.com",
    bookingDate: "07 Jan 2026",
    bookingTime: "3:30 PM",
    address: "321 Garden Lane, Villa 7",
    landmark: "Gated Community",
    serviceType: "AC Maintenance",
    status: "Confirmed",
    verified: true,
    note: "AC is not cooling properly. Please check the compressor.",
  },
  {
    id: "BK-3005",
    clientName: "Vikram Singh",
    clientPhone: "+91 5432100000",
    clientEmail: "vikram.singh@example.com",
    bookingDate: "10 Jan 2026",
    bookingTime: "9:00 AM",
    address: "555 Tech Park, Building A",
    landmark: "Business District",
    serviceType: "Deep Cleaning",
    status: "Confirmed",
    verified: true,
    note: "Office cleaning. Provide quote after inspection.",
  },
  // Rescheduled
  {
    id: "BK-3006",
    clientName: "Sanjana Gupta",
    clientPhone: "+91 4321000000",
    clientEmail: "sanjana.gupta@example.com",
    bookingDate: "12 Jan 2026",
    bookingTime: "5:00 PM",
    address: "112 Maple Street, Apt 501",
    landmark: "Shopping Complex Nearby",
    serviceType: "Painting",
    status: "Rescheduled",
    verified: false,
    note: "Reschedule reason: Client was out of station. New date: 12 Jan.",
  },
  {
    id: "BK-3007",
    clientName: "Deepak Verma",
    clientPhone: "+91 3210000000",
    clientEmail: "deepak.verma@example.com",
    bookingDate: "15 Jan 2026",
    bookingTime: "1:00 PM",
    address: "999 Oak Street, House 45",
    landmark: "Residential Society",
    serviceType: "Carpentry",
    status: "Rescheduled",
    verified: true,
    note: "Client requested later time. Furniture assembly required.",
  },
  // Completed
  {
    id: "BK-3008",
    clientName: "Anjali Das",
    clientPhone: "+91 2100000000",
    clientEmail: "anjali.das@example.com",
    bookingDate: "05 Jan 2026",
    bookingTime: "8:00 AM",
    address: "678 Birch Road, Apt 101",
    landmark: "Near Market",
    serviceType: "Home Cleaning",
    status: "Completed",
    verified: true,
    note: "Service completed. Customer satisfied with work.",
  },
];

const TABS = ["Upcoming", "Today", "All", "Pending", "Rescheduled"];

function TechnicianBookings() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current date (for "Today" filter)
  const today = new Date();
  const todayString = `${String(today.getDate()).padStart(2, "0")} ${today.toLocaleString("en-US", { month: "short" })} ${today.getFullYear()}`;

  // Fetch technician bookings from backend
  useEffect(() => {
    const fetchTechnicianBookings = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("token") || localStorage.getItem("token");
        const response = await axios.get("/api/bookings/technician-bookings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          // Transform backend data to match frontend format
          const transformedBookings = response.data.bookings.map((booking) => ({
            id: booking._id,
            clientName: `${booking.userInfo.firstname} ${booking.userInfo.lastname}`,
            clientPhone: booking.userInfo.phone,
            clientEmail: booking.userInfo.email,
            bookingDate: new Date(booking.serviceDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            bookingTime: booking.serviceTime,
            address: booking.userInfo.address,
            landmark: booking.userInfo.landMark,
            serviceType: booking.technicianInfo.servicetype,
            status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
            verified: booking.userInfo.isHouseVerified || false,
            note: booking.note,
          }));

          // Merge backend data with dummy data - show both
          setBookings([...transformedBookings, ...technicianBookings]);
        } else {
          // Show only dummy data if fetch fails
          setBookings(technicianBookings);
          toast.error("Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        // Show only dummy data if fetch fails
        setBookings(technicianBookings);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianBookings();
  }, []);

  // Filter bookings based on active tab and search query
  let filteredBookings = bookings;

  if (activeTab === "Upcoming") {
    filteredBookings = bookings.filter(booking => booking.status === "Confirmed");
  } else if (activeTab === "Today") {
    filteredBookings = bookings.filter(
      booking => booking.status === "Confirmed" && booking.bookingDate === todayString
    );
  } else if (activeTab === "Pending") {
    filteredBookings = bookings.filter(booking => booking.status === "Pending");
  } else if (activeTab === "Rescheduled") {
    filteredBookings = bookings.filter(booking => booking.status === "Rescheduled");
  }
  // "All" shows everything as initialized

  // Apply search filter
  if (searchQuery.trim()) {
    filteredBookings = filteredBookings.filter(booking =>
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-emerald-100 text-emerald-700";
      case "Pending":
        return "bg-blue-100 text-blue-700";
      case "Rescheduled":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-stone-100 text-stone-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  const handleViewClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-16 pb-16 min-h-screen bg-stone-50 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
            Booking Listing
          </h1>
          <p className="text-base text-stone-600 max-w-2xl">
            View and manage all your assigned bookings
          </p>
        </section>

        {/* Tab Filter Section with Search */}
        <section className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 border-b">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 md:px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                    activeTab === tab
                      ? "bg-color-main text-white shadow-md"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Search by name, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-stone-300 text-stone-900 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-color-main focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading your bookings...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-stone-500 uppercase text-xs tracking-wide border-b bg-stone-50">
                    <th className="px-6 py-4 font-semibold w-40">Client Name</th>
                    <th className="px-6 py-4 font-semibold w-48">Booking Date</th>
                    <th className="px-6 py-4 font-semibold w-56">Location / Address</th>
                    <th className="px-6 py-4 font-semibold w-32">Status</th>
                    <th className="px-6 py-4 font-semibold w-56">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="border-b hover:bg-stone-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-semibold text-neutral-900 w-40 truncate">
                          {booking.clientName}
                      </td>
                      <td className="px-6 py-4 text-stone-700 w-48">
                        <div className="text-sm font-medium">{booking.bookingDate}</div>
                        <div className="text-xs text-stone-500">{booking.bookingTime}</div>
                      </td>
                      <td className="px-6 py-4 text-stone-700 w-56 truncate">
                        {booking.address}
                      </td>
                      <td className="px-6 py-4 w-32">
                        <span className={`px-3 py-1.5 text-xs font-semibold rounded-full inline-block ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 w-56">
                        <div className="flex gap-2 flex-wrap">
                          {booking.status === "Pending" ? (
                            <>
                              <button className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                                Accept
                              </button>
                              <button className="px-3 py-1.5 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors whitespace-nowrap">
                                Cancel
                              </button>
                              <button
                                onClick={() => handleViewClick(booking)}
                                className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors whitespace-nowrap"
                              >
                                View
                              </button>
                            </>
                          ) : booking.status === "Confirmed" ? (
                            <>
                              <button
                                onClick={() => handleViewClick(booking)}
                                className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                              >
                                View Details
                              </button>
                              <button
                                className="px-3 py-1.5 border border-color-primary text-color-primary text-xs font-semibold rounded-full hover:bg-blue-50 transition-colors whitespace-nowrap"
                              >
                                Reschedule
                              </button>
                            </>
                          ) : booking.status === "Rescheduled" ? (
                            <button
                              onClick={() => handleViewClick(booking)}
                              className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                            >
                              View Details
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewClick(booking)}
                              className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors whitespace-nowrap"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-stone-500">
                      No bookings found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </section>
      </main>

      {/* Modal */}
      {showModal && selectedBooking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-linear-to-r bg-white text-color-primary px-6 py-3 flex items-center justify-between border-b">
              <h2 className="text-lg font-semibold">Booking Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-black hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors text-base font-normal"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Client Information */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-color-main" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Name</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.clientName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Phone</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.clientPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Email</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.clientEmail}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-color-main" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
                  </svg>
                  Address Information
                </h3>
                <div className="space-y-2 bg-stone-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Full Address</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Landmark</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.landmark}</p>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-stone-50 p-3 rounded-lg flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedBooking.verified ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {selectedBooking.verified ? (
                    <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wide">House Verification</p>
                  <p className={`text-sm font-medium ${selectedBooking.verified ? "text-emerald-700" : "text-amber-700"}`}>
                    {selectedBooking.verified ? "Verified" : "Not Verified"}
                  </p>
                </div>
              </div>

              {/* Service & Booking Details */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-color-main" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Service Type</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Status</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Booking Date</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.bookingDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">Booking Time</p>
                    <p className="text-sm text-neutral-900 font-medium">{selectedBooking.bookingTime}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-color-main" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Notes
                </h3>
                <div className="bg-stone-50 p-3 rounded-lg border-l-4 border-color-main">
                  <p className="text-sm text-neutral-900 leading-relaxed">{selectedBooking.note}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-4 py-3 border-t flex gap-2 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-1.5 bg-stone-200 text-stone-700 font-normal rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                Close
              </button>
              {selectedBooking.status === "Pending" && (
                <button className="px-4 py-1.5 bg-color-main text-white font-normal rounded-lg hover:opacity-90 transition-opacity text-sm">
                  Accept Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default TechnicianBookings;

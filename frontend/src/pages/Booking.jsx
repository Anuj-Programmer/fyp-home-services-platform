import React, { useState, useEffect } from "react";
import { CheckCircle } from "phosphor-react";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import "../css/landingPage.css";

// Dummy data with various statuses
const technicianBookings = [
  // Pending
  {
    id: "BK-2052",
    technicianName: "Sonal Mehra",
    specialty: "Home Cleaning",
    bookingDate: "05 Dec 2025",
    time: "4:00 PM",
    serviceType: "Home Cleaning",
    email: "sonal.mehra@example.com",
    phone: "+91 9876543219",
    status: "Pending",
  },
  // Confirmed
  {
    id: "BK-2049",
    technicianName: "Ramesh Patel",
    specialty: "Electrical",
    bookingDate: "30 Nov 2025",
    time: "2:00 PM",
    serviceType: "Electrical Inspection",
    email: "ramesh.patel@example.com",
    phone: "+91 9876543212",
    status: "Confirmed",
  },
  {
    id: "BK-2048",
    technicianName: "Dib Rai",
    specialty: "Gardening",
    bookingDate: "01 Dec 2025",
    time: "11:00 AM",
    serviceType: "Gardening Maintenance",
    email: "dib.rai@example.com",
    phone: "+91 9876543213",
    status: "Confirmed",
  },
  // Completed
  {
    id: "BK-2047",
    technicianName: "Amit Sharma",
    specialty: "Deep Cleaning",
    bookingDate: "20 Nov 2025",
    time: "9:00 AM",
    serviceType: "Window Cleaning",
    email: "amit.sharma@example.com",
    phone: "+91 9876543210",
    status: "Completed",
  },
  {
    id: "BK-2046",
    technicianName: "Ravi Kumar",
    specialty: "AC Maintenance",
    bookingDate: "18 Nov 2025",
    time: "3:30 PM",
    serviceType: "AC Maintenance",
    email: "ravi.kumar@example.com",
    phone: "+91 9876543214",
    status: "Completed",
  },
  // Cancelled
  {
    id: "BK-2045",
    technicianName: "Priya Singh",
    specialty: "Pest Control",
    bookingDate: "15 Nov 2025",
    time: "7:00 PM",
    serviceType: "Pest Control",
    email: "priya.singh@example.com",
    phone: "+91 9876543215",
    status: "Cancelled",
  },
  {
    id: "BK-2044",
    technicianName: "Arjun Desai",
    specialty: "Carpentry",
    bookingDate: "14 Nov 2025",
    time: "1:00 PM",
    serviceType: "Carpentry Work",
    email: "arjun.desai@example.com",
    phone: "+91 9876543216",
    status: "Cancelled",
  },
  // Rescheduled
  {
    id: "BK-2043",
    technicianName: "Neha Gupta",
    specialty: "Painting",
    bookingDate: "12 Nov 2025",
    time: "5:00 PM",
    serviceType: "Painting",
    email: "neha.gupta@example.com",
    phone: "+91 9876543217",
    status: "Rescheduled",
  },
  {
    id: "BK-2042",
    technicianName: "Vikram Singh",
    specialty: "Plumbing",
    bookingDate: "10 Nov 2025",
    time: "10:30 AM",
    serviceType: "Plumbing Installation",
    email: "vikram.singh@example.com",
    phone: "+91 9876543218",
    status: "Rescheduled",
  },
];

const TABS = ["All", "Upcoming", "Pending", "Cancelled", "Rescheduled", "Completed"];

function Booking() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user bookings from backend
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("token") || localStorage.getItem("token");
        const response = await axios.get("/api/bookings/user-bookings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          // Transform backend data to match frontend format
          const transformedBookings = response.data.bookings.map((booking) => ({
            id: booking._id,
            technicianName: `${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname}`,
            specialty: booking.technicianInfo.servicetype,
            bookingDate: new Date(booking.serviceDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            time: booking.serviceTime,
            serviceType: booking.technicianInfo.servicetype,
            email: booking.technicianInfo.email,
            phone: booking.technicianInfo.phone,
            status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
            isVerifiedTechnician: booking.technicianInfo.isVerifiedTechnician || false,
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

    fetchUserBookings();
  }, []);

  // Filter bookings based on active tab and search query
  let filteredBookings;
  if (activeTab === "All") {
    filteredBookings = bookings;
  } else if (activeTab === "Upcoming") {
    filteredBookings = bookings.filter(booking => booking.status === "Confirmed");
  } else {
    filteredBookings = bookings.filter(booking => booking.status === activeTab);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    filteredBookings = filteredBookings.filter(booking => 
      booking.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
      case "Confirmed":
        return "bg-emerald-100 text-emerald-700";
      case "Pending":
        return "bg-blue-100 text-blue-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Rescheduled":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-16 pb-16 min-h-screen bg-stone-50 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
            Management
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
            Technician Bookings
          </h1>
          <p className="text-base text-stone-600 max-w-2xl">
            View and manage all your technician bookings in one place
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
                  className={`px-4 md:px-5 py-2 rounded-full font-semibold transition-all duration-200 text-sm ${
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

          {/* Booking Cards */}
          <div className="p-4 md:p-6 space-y-3">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading your bookings...</p>
              </div>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white border border-stone-200 rounded-xl hover:shadow-md hover:border-stone-300 transition-all duration-200"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:flex md:items-center md:gap-6 p-5">
                    {/* Technician Info - 200px */}
                    <div className="w-48 shrink-0">
                      <p className="text-xs font-semibold text-color-main uppercase tracking-wide mb-0.5">
                        {booking.specialty}
                      </p>
                      <div className="flex items-center gap-1 min-w-0">
                        <p className="text-base font-semibold text-neutral-900 truncate">
                          {booking.technicianName}
                        </p>
                        {booking.isVerifiedTechnician && (
                          <CheckCircle size={16} weight="fill" className="text-blue-600 shrink-0 ml-1" title="Verified Technician" />
                        )}
                      </div>
                    </div>

                    {/* Date & Time - 140px */}
                    <div className="w-36 shrink-0">
                      <div className="flex items-center gap-2 text-stone-600 text-sm mb-1">
                        <svg className="w-4 h-4 text-color-main shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                        <span className="font-medium truncate">{booking.bookingDate}</span>
                      </div>
                      <p className="text-xs text-stone-600 ml-6">{booking.time}</p>
                    </div>

                    {/* Service Type - 160px */}
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {booking.serviceType}
                      </p>
                    </div>

                    {/* Contact Info - 200px */}
                    <div className="w-48 shrink-0">
                      <div className="flex items-center gap-1.5 text-stone-600 text-xs mb-1 truncate">
                        <svg className="w-3.5 h-3.5 text-color-main shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                        </svg>
                        <span className="truncate">{booking.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 text-xs truncate">
                        <svg className="w-3.5 h-3.5 text-color-main shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                        <span className="truncate">{booking.phone}</span>
                      </div>
                    </div>

                    {/* Status Badge - 100px */}
                    <div className="w-24 shrink-0">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full inline-block ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Action Buttons - auto */}
                    <div className="flex gap-2 shrink-0">
                      {booking.status === "Completed" ? (
                        <>
                          <button className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                            Payment
                          </button>
                          <button className="px-3 py-1.5 border border-color-primary text-color-primary text-xs font-semibold rounded-full hover:bg-blue-50 transition-colors whitespace-nowrap">
                            Rate
                          </button>
                        </>
                      ) : booking.status === "Confirmed" ? (
                        <>
                          <button className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                            Details
                          </button>
                          <button className="px-3 py-1.5 border border-color-primary text-color-primary text-xs font-semibold rounded-full hover:bg-blue-50 transition-colors whitespace-nowrap">
                            Reschedule
                          </button>
                        </>
                      ) : booking.status === "Cancelled" ? (
                        <button className="px-3 py-1.5 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors whitespace-nowrap">
                          View Details
                        </button>
                      ) : (
                        <>
                          <button className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                            Reschedule
                          </button>
                          <button className="px-3 py-1.5 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors whitespace-nowrap">
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden p-4 space-y-3">
                    {/* Top: Name and Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-color-main uppercase tracking-wide mb-1">
                          {booking.specialty}
                        </p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {booking.technicianName}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-stone-100"></div>

                    {/* Date & Service */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Date & Time</p>
                        <div className="flex items-center gap-1.5 text-stone-700 text-sm">
                          <svg className="w-4 h-4 text-color-main shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                          </svg>
                          <span className="font-medium">{booking.bookingDate} • {booking.time}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-stone-500 mb-0.5">Service</p>
                        <p className="text-sm font-medium text-neutral-900">
                          {booking.serviceType}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-stone-100"></div>

                    {/* Contact Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-stone-600 text-xs">
                        <svg className="w-3.5 h-3.5 text-color-main shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                        </svg>
                        <span className="truncate">{booking.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 text-xs">
                        <svg className="w-3.5 h-3.5 text-color-main shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                        <span className="truncate">{booking.phone}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-stone-100"></div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      {booking.status === "Completed" ? (
                        <>
                          <button className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                            Payment
                          </button>
                          <button className="flex-1 px-3 py-2 border border-color-primary txt-color-primary text-xs font-semibold rounded-full hover:bg-blue-50 transition-colors">
                            Rate
                          </button>
                        </>
                      ) : booking.status === "Confirmed" ? (
                        <>
                          <button className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                            Details
                          </button>
                          <button className="flex-1 px-3 py-2 border border-color-primary txt-color-primary text-xs font-semibold rounded-full hover:bg-blue-50 transition-colors">
                            Reschedule
                          </button>
                        </>
                      ) : booking.status === "Cancelled" ? (
                        <button className="flex-1 px-3 py-2 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors">
                          Details
                        </button>
                      ) : (
                        <>
                          <button className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                            Reschedule
                          </button>
                          <button className="flex-1 px-3 py-2 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors">
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">
                  No bookings found for this status.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Booking;

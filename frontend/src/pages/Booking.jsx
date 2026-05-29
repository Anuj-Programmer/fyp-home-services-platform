import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Star } from "phosphor-react";
import Navbar from "@/blocks/Navbar";
import VerifiedIcon from "@/assets/VerifiedIcon.svg";
import Footer from "@/blocks/Footer";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useSocket } from "../context/SocketContext";
import BookingChatPopup from "../components/BookingChatPopup";
import "../css/landingPage.css";
import HighRatedIcon from "@/assets/HighRatedIcon.svg";

const TABS = ["All", "Upcoming", "Pending"  , "Completed"];
const PLATFORM_FEE = 50;

function Booking() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  
  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // User state
  const [user, setUser] = useState(null);
  const { socket, isConnected, notifications, registerUser } = useSocket();

  // Fetch user data from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Register user with socket for real-time updates
        if (parsedUser._id) {
          registerUser(parsedUser._id);
          console.log('🔌 User registered with WebSocket:', parsedUser._id);
        }
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, [registerUser]);

  // Fetch user bookings from backend (initial load only)
  const fetchUserBookings = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      const response = await apiClient.get("/api/bookings/user-bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Transform backend data to match frontend format
        const transformedBookings = response.data.bookings.map((booking) => {
          const technicianInfo = booking?.technicianInfo || {};
          const populatedTechnician =
            booking?.technician && typeof booking.technician === "object"
              ? booking.technician
              : {};
          const technicianId =
            booking?.technician && typeof booking.technician === "object"
              ? booking.technician?._id || ""
              : booking?.technician || "";

          return {
            id: booking?._id || "",
            technicianId,
            technicianName:
              `${technicianInfo.firstname || populatedTechnician.firstName || ""} ${technicianInfo.lastname || populatedTechnician.lastName || ""}`.trim() ||
              "Unknown Technician",
            specialty: technicianInfo.servicetype || populatedTechnician.serviceType || "General Service",
            bookingDate: booking?.serviceDate
              ? new Date(booking.serviceDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Date unavailable",
            time: booking?.serviceTime || "Time unavailable",
            serviceType: technicianInfo.servicetype || populatedTechnician.serviceType || "Service",
            email: technicianInfo.email || populatedTechnician.email || "N/A",
            phone: technicianInfo.phone || populatedTechnician.phone || "N/A",
            status: booking?.status
              ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
              : "Pending",
            isVerifiedTechnician:
              typeof technicianInfo.isVerifiedTechnician === "boolean"
                ? technicianInfo.isVerifiedTechnician
                : Boolean(populatedTechnician.isVerifiedTechnician),
            highRated:
              typeof technicianInfo.highRated === "boolean"
                ? technicianInfo.highRated
                : Boolean(populatedTechnician.highRated),
            hasReview: booking?.hasReview || false,
            fee: booking?.fee || 0,
            paymentStatus: booking?.paymentStatus || "unpaid",
            statusHistory: Array.isArray(booking?.statusHistory)
              ? booking.statusHistory
              : booking?.statusHistory
                ? [booking.statusHistory]
                : [],
          };
        });

        setBookings(transformedBookings);

        // Populate reviewedBookings from backend data
        const reviewedIds = new Set();
        response.data.bookings.forEach((booking) => {
          if (booking.hasReview) {
            reviewedIds.add(booking._id);
          }
        });
        setReviewedBookings(reviewedIds);
      } else {
        setBookings([]);
        toast.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUserBookings(true);
  }, []);

  // Handle Khalti callback (KPG-2 redirect flow) when returning to /bookings
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pidx = params.get("pidx");
    const callbackType = params.get("khalti");
    const callbackBookingId = params.get("bookingId") || params.get("purchase_order_id");
    const status = params.get("status");

    if (!pidx || callbackType !== "callback") return;

    const verifyReturnedPayment = async () => {
      const token = Cookies.get("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token missing. Please login and check payment status.");
        navigate("/bookings", { replace: true });
        return;
      }

      if (!callbackBookingId) {
        toast.error("Booking reference missing in payment callback.");
        navigate("/bookings", { replace: true });
        return;
      }

      // Even if callback says completed, final trust should come from lookup verification.
      if (status && status !== "Completed") {
        toast.error(`Payment not completed (${status}).`);
        navigate("/bookings", { replace: true });
        await fetchUserBookings(false);
        return;
      }

      try {
        const response = await apiClient.post(
          `/api/bookings/${callbackBookingId}/verify-khalti-payment`,
          { pidx },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Payment successful and verified");
        } else {
          toast.error(response.data.message || "Payment verification failed");
        }
      } catch (verificationError) {
        console.error("Payment verification error:", verificationError);
        toast.error(verificationError.response?.data?.message || "Payment verification failed");
      } finally {
        navigate("/bookings", { replace: true });
        await fetchUserBookings(false);
      }
    };

    verifyReturnedPayment();
  }, [location.search]);

  // Listen for WebSocket notifications for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBookingNotification = (data) => {
      console.log('📬 Received booking notification:', data);
      // Refresh bookings when notification received
      fetchUserBookings(false);
      
      // Show toast notification
      if (data.type === 'NEW_BOOKING') {
        toast.success(data.message || 'New booking created!');
      } else if (data.type === 'BOOKING_STATUS_UPDATE') {
        toast.info(data.message || 'Booking status updated');
      } else if (data.type === 'BOOKING_CANCELLED') {
        toast.info(data.message || 'Booking cancelled');
      }
    };

    const handleAutoCancelledBooking = (data) => {
      console.log('🚫 Booking auto-cancelled:', data);
      // Refresh bookings when auto-cancellation happens
      fetchUserBookings(false);
      
      // Show toast notification
      toast.error(`${data.message || 'Booking cancelled'} - Technician arrived after 15 minutes.`);
    };

    socket.on('booking:notification', handleBookingNotification);
    socket.on('booking:autoCancelled', handleAutoCancelledBooking);

    return () => {
      socket.off('booking:notification', handleBookingNotification);
      socket.off('booking:autoCancelled', handleAutoCancelledBooking);
    };
  }, [socket]);

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
    const normalizedQuery = searchQuery.toLowerCase();
    filteredBookings = filteredBookings.filter((booking) => 
      (booking.technicianName || "").toLowerCase().includes(normalizedQuery) ||
      (booking.serviceType || "").toLowerCase().includes(normalizedQuery) ||
      String(booking.id || "").toLowerCase().includes(normalizedQuery)
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
      case "Expired":
      case "Cancelled":
      case "Declined":
        return "bg-red-100 text-red-700";
      case "Rescheduled":
      case "Inprogress":
        return "bg-amber-100 text-amber-700";
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

  // Rating modal handlers
  const handleOpenRatingModal = (booking) => {
    setRatingBooking(booking);
    setShowRatingModal(true);
    setSelectedRating(0);
    setHoverRating(0);
    setReviewComment("");
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
    setRatingBooking(null);
    setSelectedRating(0);
    setHoverRating(0);
    setReviewComment("");
  };

  const handleSubmitReview = async () => {
    if (selectedRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!user?._id) {
      toast.error("User information not found");
      return;
    }

    try {
      setSubmittingReview(true);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      await apiClient.post(
        `/api/reviews/${ratingBooking.id}`,
        {
          bookingId: ratingBooking.id,
          rating: selectedRating,
          comment: reviewComment,
          userId: user._id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success("Review submitted successfully!");
      handleCloseRatingModal();
      
      // Refetch bookings to get updated hasReview status from backend
      await fetchUserBookings(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Open cancellation confirmation modal
  const handleOpenCancelModal = (bookingId) => {
    setBookingToCancel(bookingId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  // Close cancellation modal
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setBookingToCancel(null);
    setCancelReason("");
  };

  // Confirm and cancel booking
  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      setCancellingBookingId(bookingToCancel);
      const token = Cookies.get("token") || localStorage.getItem("token");
      
      const response = await apiClient.put(
        `/api/bookings/${bookingToCancel}/cancel`,
        { reason: cancelReason.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Booking cancelled successfully");
        await fetchUserBookings(false);
        
        // Emit WebSocket event for real-time update
        if (socket && response.data.booking) {
          const technicianId = typeof response.data.booking.technician === 'object' 
            ? response.data.booking.technician._id 
            : response.data.booking.technician;
          socket.emit('booking:statusUpdate', {
            bookingId: bookingToCancel,
            userId: user?._id,
            technicianId: technicianId,
            status: 'cancelled'
          });
          console.log('📡 Emitted booking cancellation to technician:', technicianId);
        }
      } else {
        toast.error(response.data.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingBookingId(null);
      handleCloseCancelModal();
    }
  };

  // Get progress stage based on booking status
  const getProgressStage = (status) => {
    switch (status) {
      case "Confirmed":
        return 1;
      case "Inprogress":
        return 2;
      case "Completed":
        return 3;
      default:
        return 0;
    }
  };

  const getLatestStatusHistoryEntry = (booking, targetStatus) => {
    if (!booking?.statusHistory?.length) return null;
    const filtered = booking.statusHistory.filter(
      (entry) => (entry?.status || "").toLowerCase() === targetStatus.toLowerCase()
    );
    if (!filtered.length) return null;
    return filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
  };

  // Payment modal handlers
  const handleOpenPaymentModal = (booking) => {
    setPaymentBooking(booking);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentBooking(null);
    setIsProcessingPayment(false);
  };

  const handlePayWithKhalti = async () => {
    if (!paymentBooking) return;

    try {
      setIsProcessingPayment(true);

      const token = Cookies.get("token") || localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await apiClient.post(
        `/api/bookings/${paymentBooking.id}/initiate-khalti-payment`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const paymentUrl = response.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error(response.data?.message || "Failed to get Khalti payment URL");
      }

      toast.success("Redirecting to Khalti...");
      setShowPaymentModal(false);
      // Use window.open to allow user to return via browser back button
      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error(error.response?.data?.message || error.message || "Payment processing failed");
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-12 pb-16 min-h-screen bg-stone-50 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          {/* <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
            Management
          </p> */}
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
            Technician Bookings
          </h1>
          <p className="text-base text-stone-600 max-w-2xl">
            View and manage all your technician bookings in one place
          </p>
        </section>

        {/* Tab Filter Section with Search */}
        <section className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 border-b border-stone-300">
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
                          <img src={VerifiedIcon} alt="Verified Technician" className="w-4 h-4 shrink-0 ml-1" title="Verified Technician" />
                        )}
                        {booking.highRated && (
                          <img src={HighRatedIcon} alt="High Rated" className="w-4 h-4 shrink-0 ml-1" title="Highly Rated Technician" />
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
                          <button 
                            onClick={() => handleViewClick(booking)}
                            className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                            Details
                          </button>
                          <button 
                            onClick={() => handleOpenPaymentModal(booking)}
                            disabled={booking.paymentStatus === "paid"}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-opacity whitespace-nowrap ${
                              booking.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                                : "bg-color-main text-white hover:opacity-90"
                            }`}>
                            {booking.paymentStatus === "paid" ? "Paid" : "Pay"}
                          </button>
                          <button 
                            onClick={() => !reviewedBookings.has(booking.id) && handleOpenRatingModal(booking)}
                            disabled={reviewedBookings.has(booking.id)}
                            title={reviewedBookings.has(booking.id) ? "You have already reviewed this booking" : "Rate this booking"}
                            className={`px-3 py-1.5 border text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                              reviewedBookings.has(booking.id)
                                ? "border-stone-300 text-stone-400 cursor-not-allowed opacity-60"
                                : "border-color-primary text-color-primary hover:bg-blue-50"
                            }`}>
                            Rate
                          </button>
                        </>
                      ) : booking.status === "Confirmed" ? (
                        <>
                          <button 
                            onClick={() => handleViewClick(booking)}
                            className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                            Details
                          </button>
                          <button 
                            onClick={() => handleOpenCancelModal(booking.id)}
                            disabled={cancellingBookingId === booking.id}
                            className="px-3 py-1.5 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel"}
                          </button>
                        </>
                      ) : booking.status === "Inprogress" ? (
                        <button 
                          onClick={() => handleViewClick(booking)}
                          className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                          View Details
                        </button>
                      ) : booking.status === "Cancelled" ? (
                        <button 
                          onClick={() => handleViewClick(booking)}
                          className="px-3 py-1.5 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors whitespace-nowrap">
                          View Detail
                        </button>
                      ) : booking.status === "Declined" ? (
                        <button 
                          onClick={() => handleViewClick(booking)}
                          className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors whitespace-nowrap">
                          View Details
                        </button>
                      ) : booking.status === "Expired" ? (
                        <button 
                          onClick={() => navigate(`/booktechnician/${booking.technicianId}`)}
                          className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap">
                          Reschedule
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenCancelModal(booking.id)}
                          disabled={cancellingBookingId === booking.id}
                          className="px-3 py-1.5 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                          {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel"}
                        </button>
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
                          <button 
                            onClick={() => handleViewClick(booking)}
                            className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                            Details
                          </button>
                          <button 
                            onClick={() => handleOpenPaymentModal(booking)}
                            disabled={booking.paymentStatus === "paid"}
                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-full transition-opacity ${
                              booking.paymentStatus === "paid"
                                ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                                : "bg-color-main text-white hover:opacity-90"
                            }`}>
                            {booking.paymentStatus === "paid" ? "Paid" : "Pay Now"}
                          </button>
                          <button 
                            onClick={() => !reviewedBookings.has(booking.id) && handleOpenRatingModal(booking)}
                            disabled={reviewedBookings.has(booking.id)}
                            title={reviewedBookings.has(booking.id) ? "You have already reviewed this booking" : "Rate this booking"}
                            className={`flex-1 px-3 py-2 border text-xs font-semibold rounded-full transition-colors ${
                              reviewedBookings.has(booking.id)
                                ? "border-stone-300 text-stone-400 cursor-not-allowed opacity-60"
                                : "border-color-primary text-color-primary hover:bg-blue-50"
                            }`}>
                            Rate
                          </button>
                        </>
                      ) : booking.status === "Confirmed" ? (
                        <>
                          <button 
                            onClick={() => handleViewClick(booking)}
                            className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                            Details
                          </button>
                          <button 
                            onClick={() => handleOpenCancelModal(booking.id)}
                            disabled={cancellingBookingId === booking.id}
                            className="flex-1 px-3 py-2 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel"}
                          </button>
                        </>
                      ) : booking.status === "Inprogress" ? (
                        <button 
                          onClick={() => handleViewClick(booking)}
                          className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                          View Details
                        </button>
                      ) : booking.status === "Cancelled" ? (
                        <button 
                          onClick={() => handleViewClick(booking)}
                          className="flex-1 px-3 py-2 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors">
                          Details
                        </button>
                      ) : booking.status === "Declined" ? (
                        <button 
                          onClick={() => handleViewClick(booking)}
                          className="flex-1 px-3 py-2 bg-stone-200 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-300 transition-colors">
                          Details
                        </button>
                      ) : booking.status === "Expired" ? (
                        <button 
                          onClick={() => navigate(`/booktechnician/${booking.technicianId}`)}
                          className="flex-1 px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity">
                          Reschedule
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenCancelModal(booking.id)}
                          disabled={cancellingBookingId === booking.id}
                          className="flex-1 px-3 py-2 border border-red-600 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel"}
                        </button>
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

      {/* Modal */}
      {showModal && selectedBooking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white text-color-primary px-6 py-4 flex items-center justify-between border-b rounded-t-2xl border-stone-200">
              <h2 className="text-xl font-semibold">Booking Details</h2>
              <button
                onClick={handleCloseModal}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 pr-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
              {/* Technician Information */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-color-main" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Technician Information
                </h3>
                <div className="bg-stone-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Name</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.technicianName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Specialty</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.specialty}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Email</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Phone</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.phone}</p>
                    </div>
                  </div>
                  {(selectedBooking.isVerifiedTechnician || selectedBooking.highRated) && (
                    <div className="flex items-center gap-2 mt-2">
                      {selectedBooking.isVerifiedTechnician && (
                        <div className="flex items-center gap-2 bg-emerald-100 p-3 rounded-lg">
                          <img src={VerifiedIcon} alt="Verified Technician" className="w-5 h-5" />
                          <span className="text-sm font-medium text-emerald-700">Verified Technician</span>
                        </div>
                      )}
                      {selectedBooking.highRated && (
                        <div className="flex items-center gap-2 bg-amber-100 p-3 rounded-lg">
                            
              <img src={HighRatedIcon} alt="High Rated" className="w-4 h-4 shrink-0" />
          
                          <span className="text-sm font-medium text-amber-700">High Rated</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Indicator for Confirmed, Inprogress, and Completed Bookings */}
              {(selectedBooking.status === "Confirmed" || selectedBooking.status === "Inprogress" || selectedBooking.status === "Completed") && (
                <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">Service Progress</h3>

                  <div className="relative mt-6">
                    <div className="absolute left-0 right-0 top-4 h-[3px] rounded-full bg-stone-200" />
                    <div
                      className={`absolute left-0 top-4 h-[3px] rounded-full bg-emerald-400 transition-all duration-500 ${
                        getProgressStage(selectedBooking.status) >= 3
                          ? "w-full"
                          : getProgressStage(selectedBooking.status) >= 2
                            ? "w-1/2"
                            : "w-0"
                      }`}
                    />

                    <div className="relative grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            getProgressStage(selectedBooking.status) > 1
                              ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                              : getProgressStage(selectedBooking.status) === 1
                                ? "bg-sky-100 border-sky-300 text-sky-600"
                                : "bg-stone-100 border-stone-300 text-stone-500"
                          }`}
                        >
                          {getProgressStage(selectedBooking.status) > 1 ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>
                        <p
                          className={`mt-2.5 text-[11px] sm:text-xs font-semibold ${
                            getProgressStage(selectedBooking.status) >= 1
                              ? "text-sky-600"
                              : "text-stone-500"
                          }`}
                        >
                          Accepted
                        </p>
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            getProgressStage(selectedBooking.status) > 2
                              ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                              : getProgressStage(selectedBooking.status) === 2
                                ? "bg-sky-100 border-sky-300 text-sky-600"
                                : "bg-stone-100 border-stone-300 text-stone-500"
                          }`}
                        >
                          {getProgressStage(selectedBooking.status) > 2 ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>
                        <p
                          className={`mt-2.5 text-[11px] sm:text-xs font-semibold ${
                            getProgressStage(selectedBooking.status) >= 2
                              ? "text-sky-600"
                              : "text-stone-500"
                          }`}
                        >
                          In Progress
                        </p>
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            getProgressStage(selectedBooking.status) >= 3
                              ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                              : "bg-stone-100 border-stone-300 text-stone-500"
                          }`}
                        >
                          {getProgressStage(selectedBooking.status) >= 3 ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>
                        <p
                          className={`mt-2.5 text-[11px] sm:text-xs font-semibold ${
                            getProgressStage(selectedBooking.status) >= 3
                              ? "text-emerald-600"
                              : "text-stone-500"
                          }`}
                        >
                          Completed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service & Booking Details */}
              <div className="mt-6">
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-color-main" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  Booking Details
                </h3>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Service Type</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Status</p>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Booking Date</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.bookingDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">Booking Time</p>
                      <p className="text-sm text-neutral-900">{selectedBooking.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedBooking.status === "Cancelled" && getLatestStatusHistoryEntry(selectedBooking, "cancelled")?.note && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-neutral-900 mb-3">Cancellation Reason</h3>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-800 leading-relaxed">
                      {getLatestStatusHistoryEntry(selectedBooking, "cancelled")?.note}
                    </p>
                  </div>
                </div>
              )}

              {selectedBooking.status === "Completed" && getLatestStatusHistoryEntry(selectedBooking, "completed")?.note && (
                <div className="mt-6">
                  <h3 className="text-base font-semibold text-neutral-900 mb-3">Service Completion Note</h3>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      {getLatestStatusHistoryEntry(selectedBooking, "completed")?.note}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t flex gap-3 justify-end rounded-b-2xl border-stone-300">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingBooking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseRatingModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white text-color-primary px-6 py-4 flex items-center justify-between border-b rounded-t-2xl">
              <h2 className="text-xl font-semibold">Rate Your Experience</h2>
              <button
                onClick={handleCloseRatingModal}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Technician Info */}
              <div className="text-center">
                <p className="text-sm text-stone-600 mb-1">How was your experience with</p>
                <p className="text-lg font-semibold text-neutral-900">{ratingBooking.technicianName}</p>
                <p className="text-sm text-color-main">{ratingBooking.specialty}</p>
              </div>

              {/* Star Rating */}
              <div className="flex flex-col items-center space-y-3">
                <p className="text-base font-semibold text-neutral-900">
                  {selectedRating === 0 ? "Select Rating" : 
                   selectedRating === 1 ? "Poor" :
                   selectedRating === 2 ? "Fair" :
                   selectedRating === 3 ? "Good" :
                   selectedRating === 4 ? "Very Good" : "Excellent"}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <svg
                        className={`w-12 h-12 transition-colors ${
                          star <= (hoverRating || selectedRating)
                            ? "fill-orange-500 text-orange-500"
                            : "fill-stone-300 text-stone-300"
                        }`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Write Your Review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Please share your experience with us ..."
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-color-main focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || selectedRating === 0}
                className="w-full py-3 bg-color-main text-white font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseCancelModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Cancel Booking</h2>
              <button
                onClick={handleCloseCancelModal}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <p className="text-center text-neutral-900 font-semibold mb-2">Are you sure?</p>
              <p className="text-center text-stone-600 text-sm">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Cancellation reason
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why are you cancelling this booking?"
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-neutral-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-color-main focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t flex gap-3 justify-end rounded-b-2xl">
              <button
                onClick={handleCloseCancelModal}
                className="px-4 py-2 bg-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-300 transition-colors text-sm"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={cancellingBookingId === bookingToCancel}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingBookingId === bookingToCancel ? "Cancelling..." : "Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentBooking && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleClosePaymentModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white text-color-primary px-6 py-4 flex items-center justify-between border-b rounded-t-2xl">
              <h2 className="text-xl font-semibold">Payment Bill</h2>
              <button
                onClick={handleClosePaymentModal}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Booking Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Booking Details</h3>
                <div className="space-y-3 bg-stone-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-stone-600">Technician</span>
                    <span className="text-sm font-semibold text-neutral-900 text-right">{paymentBooking.technicianName}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-stone-600">Service</span>
                    <span className="text-sm font-semibold text-neutral-900 text-right">{paymentBooking.serviceType}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-stone-600">Specialty</span>
                    <span className="text-sm font-semibold text-neutral-900 text-right">{paymentBooking.specialty}</span>
                  </div>
                  <div className="h-px bg-stone-200"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-stone-600">Date & Time</span>
                    <span className="text-sm font-semibold text-neutral-900 text-right">{paymentBooking.bookingDate} • {paymentBooking.time}</span>
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-stone-600">Service Charge</span>
                  <span className="text-sm font-semibold text-neutral-900">Rs. {paymentBooking.fee}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-stone-600">Platform Fee</span>
                  <span className="text-sm font-semibold text-neutral-900">Rs. 50</span>
                </div>
                <div className="h-px bg-stone-200 my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-neutral-900">Total Amount</span>
                  <span className="text-xl font-bold text-color-main">Rs. {paymentBooking.fee + PLATFORM_FEE}</span>
                </div>
                <p className="mt-2 text-xs text-stone-500">
                  Payment Status: <span className="font-semibold uppercase">{paymentBooking.paymentStatus}</span>
                </p>
              </div>

              {/* Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Please ensure all booking details are correct before proceeding. To cancel payment after redirect, use your browser's back button or close the Khalti payment page.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t flex gap-3 justify-end rounded-b-2xl">
              <button
                onClick={handleClosePaymentModal}
                disabled={isProcessingPayment}
                className="px-4 py-2.5 bg-stone-200 text-stone-700 font-medium rounded-full hover:bg-stone-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePayWithKhalti}
                disabled={isProcessingPayment || paymentBooking.paymentStatus === "paid"}
                className="px-4 py-2.5 bg-color-main text-white font-medium rounded-full hover:opacity-90 transition-opacity text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h6v-2h-6v2z" />
                    </svg>
                    {paymentBooking.paymentStatus === "paid" ? "Already Paid" : "Pay with Khalti"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BookingChatPopup
        bookings={bookings}
        currentUserId={user?._id}
        headerTitle="Chat with Provider"
        partnerNameKey="technicianName"
      />

      <Footer />
    </>
  );
}

export default Booking;

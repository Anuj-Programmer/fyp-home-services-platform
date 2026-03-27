import React, { useState, useEffect } from "react";
import { Star } from "phosphor-react";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import "../../css/landingPage.css";

const TABS = ["All", "5 Stars", "4 Stars", "3 Stars", "Below 3"];

function TechnicianReview() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technician, setTechnician] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  // Fetch technician data from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setTechnician(parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  // Fetch technician reviews
  useEffect(() => {
    if (!technician?._id) return;

    let isMounted = true;
    let intervalId;

    const fetchTechnicianReviews = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const token = Cookies.get("token") || localStorage.getItem("token");
        const response = await apiClient.get(
          `/api/reviews/technician/${technician._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          // Transform backend data to match frontend format
          const transformedReviews = response.data.reviews.map((review) => ({
            id: review._id,
            bookingId: review.bookingId,
            userName: `${review.userId?.firstName || "User"} ${review.userId?.lastName || ""}`.trim(),
            userEmail: review.userId?.email || "N/A",
            rating: review.rating,
            comment: review.comment,
            createdAt: new Date(review.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            createdTime: new Date(review.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          if (isMounted) {
            setReviews(transformedReviews);
            // Calculate average rating
            if (transformedReviews.length > 0) {
              const avg =
                transformedReviews.reduce((sum, r) => sum + r.rating, 0) /
                transformedReviews.length;
              setAverageRating(Math.round(avg * 10) / 10);
            }
          }
        } else {
          if (isMounted) setReviews([]);
          toast.error("Failed to fetch reviews");
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        if (isMounted) setReviews([]);
      } finally {
        if (showLoading && isMounted) setLoading(false);
      }
    };

    // Initial fetch with loading
    fetchTechnicianReviews(true);
    // Poll every 10 seconds (without loading spinner)
    intervalId = setInterval(() => {
      fetchTechnicianReviews(false);
    }, 10000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [technician]);

  // Filter reviews based on active tab and search query
  let filteredReviews = reviews;

  if (activeTab === "5 Stars") {
    filteredReviews = reviews.filter((review) => review.rating === 5);
  } else if (activeTab === "4 Stars") {
    filteredReviews = reviews.filter((review) => review.rating === 4);
  } else if (activeTab === "3 Stars") {
    filteredReviews = reviews.filter((review) => review.rating === 3);
  } else if (activeTab === "Below 3") {
    filteredReviews = reviews.filter((review) => review.rating < 3);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    filteredReviews = filteredReviews.filter(
      (review) =>
        review.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Render star rating
  const renderStars = (rating, size = 16) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            weight={star <= rating ? "fill" : "regular"}
            className={
              star <= rating
                ? "text-orange-500"
                : "text-stone-300"
            }
          />
        ))}
      </div>
    );
  };

  const handleViewClick = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReview(null);
  };

  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-16 pb-16 min-h-screen bg-stone-50 space-y-8">
        {/* Header */}
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
            Customer Reviews
          </h1>
          <p className="text-base text-stone-600 max-w-2xl">
            View and manage all the reviews you have received from customers
          </p>
        </section>

        {/* Summary Card */}
        <section className="bg-linear-to-r from-orange-50 to-amber-50 rounded-3xl border border-orange-200 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm text-stone-600 mb-2">Overall Rating</p>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-orange-600">
                  {averageRating}
                </div>
                <div>
                  {renderStars(Math.round(averageRating), 24)}
                  <p className="text-sm text-stone-600 mt-2">
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="w-full md:w-64 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviews.filter((r) => r.rating === rating).length;
                const percentage =
                  reviews.length > 0
                    ? (count / reviews.length) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-stone-600 w-8">
                      {rating}★
                    </span>
                    <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-stone-600 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
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
                placeholder="Search by name or comment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-stone-300 text-stone-900 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-color-main focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading reviews...</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-stone-500 uppercase text-xs tracking-wide border-b bg-stone-50">
                    <th className="px-6 py-4 font-semibold w-40">Customer Name</th>
                    <th className="px-6 py-4 font-semibold w-20">Rating</th>
                    <th className="px-6 py-4 font-semibold flex-1">Comment</th>
                    <th className="px-6 py-4 font-semibold w-32">Date</th>
                    <th className="px-6 py-4 font-semibold w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                      <tr
                        key={review.id}
                        className="border-b hover:bg-stone-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-semibold text-neutral-900 w-40 truncate">
                          {review.userName}
                        </td>
                        <td className="px-6 py-4 w-20">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating, 14)}
                            <span className="text-xs font-semibold text-orange-600 ml-1">
                              {review.rating}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-stone-700 flex-1">
                          <p className="line-clamp-2 text-sm">{review.comment}</p>
                        </td>
                        <td className="px-6 py-4 text-stone-600 text-xs w-32">
                          <div>{review.createdAt}</div>
                          <div className="text-stone-500">{review.createdTime}</div>
                        </td>
                        <td className="px-6 py-4 w-20">
                          <button
                            onClick={() => handleViewClick(review)}
                            className="px-3 py-1.5 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-stone-500">
                        No reviews found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3">
            {loading ? (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">Loading reviews...</p>
              </div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 hover:shadow-md hover:border-stone-300 transition-all duration-200"
                >
                  {/* Top: Name and Rating */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-color-main uppercase tracking-wide mb-1">
                        Customer
                      </p>
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {review.userName}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {renderStars(review.rating, 16)}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-stone-100"></div>

                  {/* Rating & Date */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-stone-500 mb-0.5">Rating</p>
                      <p className="text-sm font-semibold text-orange-600">
                        {review.rating} out of 5
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500 mb-0.5">Date</p>
                      <p className="text-sm font-medium text-stone-700">
                        {review.createdAt}
                      </p>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="text-xs text-stone-500 mb-1">Comment</p>
                    <p className="text-sm text-stone-700 line-clamp-3">
                      {review.comment}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-stone-100"></div>

                  {/* View Button */}
                  <button
                    onClick={() => handleViewClick(review)}
                    className="w-full px-3 py-2 bg-color-main text-white text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
                  >
                    View Full Review
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-stone-500 text-base">
                  No reviews found for this filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white text-color-primary px-6 py-4 flex items-center justify-between border-b">
              <h2 className="text-lg font-semibold">Customer Review</h2>
              <button
                onClick={handleCloseModal}
                className="text-stone-600 hover:text-stone-900 rounded-full p-1 transition-colors text-2xl font-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-color-main"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Customer Information
                </h3>
                <div className="bg-stone-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">
                      Name
                    </p>
                    <p className="text-sm text-neutral-900">{selectedReview.userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-600 uppercase tracking-wide font-semibold mb-1">
                      Email
                    </p>
                    <p className="text-sm text-neutral-900">{selectedReview.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Rating Details */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-color-main"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Rating
                </h3>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-orange-600">
                      {selectedReview.rating}
                    </div>
                    <div>
                      {renderStars(selectedReview.rating, 32)}
                      <p className="text-sm text-stone-600 mt-2">
                        Out of 5 stars
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-color-main"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                  Review Comment
                </h3>
                <div className="bg-stone-50 p-4 rounded-lg border-l-4 border-color-main">
                  <p className="text-sm text-neutral-900 leading-relaxed">
                    {selectedReview.comment}
                  </p>
                </div>
              </div>

              {/* Review Date */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-color-main"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  Review Date
                </h3>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-900 font-medium">
                    {selectedReview.createdAt} at {selectedReview.createdTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t flex gap-3 justify-end">
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

      <Footer />
    </>
  );
}

export default TechnicianReview;

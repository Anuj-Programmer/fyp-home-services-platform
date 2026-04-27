const Review = require("../models/reviewModel");
const Booking = require("../models/bookingModel");
const Technician = require("../models/technicianModel");

const getTechnicianRatingStats = (reviews) => {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    highRated: fiveStarCount >= 20
  };
};

// Create/Write a new review
exports.addReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, userId } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Verify that the user who is reviewing is the one who booked
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own bookings"
      });
    }

    // Check if a review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this booking"
      });
    }

    // Create new review
    const review = new Review({
      bookingId,
      technicianId: booking.technician,
      userId: booking.user,
      rating,
      comment: comment || ""
    });

    await review.save();

    // Update booking with hasReview flag
    booking.hasReview = true;
    booking.review = {
      rating,
      comment,
      createdAt: new Date()
    };
    await booking.save();

    // Update technician's average rating
    const allReviews = await Review.find({ technicianId: booking.technician });
    const ratingStats = getTechnicianRatingStats(allReviews);

    await Technician.findByIdAndUpdate(booking.technician, {
      averageRating: ratingStats.averageRating,
      highRated: ratingStats.highRated
    });

    // Return updated booking with hasReview flag for frontend
    const updatedBooking = await Booking.findById(bookingId);
    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message
    });
  }
};

// Get reviews for a technician
exports.getTechnicianReviews = async (req, res) => {
  try {
    const { technicianId } = req.params;

    const reviews = await Review.find({ technicianId })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message
    });
  }
};

// Get reviews by booking
exports.getBookingReview = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const review = await Review.findOne({ bookingId })
      .populate("userId", "firstName lastName email")
      .populate("technicianId", "firstName lastName");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found for this booking"
      });
    }

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching review",
      error: error.message
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns this review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews"
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Update review
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Recalculate technician's average rating
    const allReviews = await Review.find({ technicianId: review.technicianId });
    const ratingStats = getTechnicianRatingStats(allReviews);

    await Technician.findByIdAndUpdate(review.technicianId, {
      averageRating: ratingStats.averageRating,
      highRated: ratingStats.highRated
    });

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating review",
      error: error.message
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user owns this review
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews"
      });
    }

    const technicianId = review.technicianId;

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    // Recalculate technician's average rating
    const allReviews = await Review.find({ technicianId });
    const ratingStats = getTechnicianRatingStats(allReviews);

    await Technician.findByIdAndUpdate(technicianId, {
      averageRating: ratingStats.averageRating,
      highRated: ratingStats.highRated
    });

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: error.message
    });
  }
};

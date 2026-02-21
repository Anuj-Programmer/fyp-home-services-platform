const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const {
  addReview,
  getTechnicianReviews,
  getBookingReview,
  updateReview,
  deleteReview
} = require("../controllers/reviewCtrl");

// Create a new review for a booking api/reviews/:bookingId
router.post("/:bookingId", authMiddleware, addReview);

// Get review for a specific booking api/reviews/:bookingId
router.get("/:bookingId", getBookingReview);

// Get reviews for a technician api/reviews/technician/:technicianId
router.get("/technician/:technicianId", getTechnicianReviews);

// Update a review
router.put("/:reviewId", authMiddleware, updateReview);

// Delete a review
router.delete("/:reviewId", authMiddleware, deleteReview);

module.exports = router;
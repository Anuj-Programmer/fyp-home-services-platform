const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const {
  createBooking,
  getUserBookings,
  getTechnicianBookings,
  getBookingById,
  updateBookingStatus,
  addReview,
  cancelBooking,
  rescheduleBooking,
  deleteBooking,
} = require('../controllers/bookingCtrl');

// Create a new booking
router.post('/create', authMiddleware, createBooking);

// Get all bookings for a user
router.get('/user-bookings', authMiddleware, getUserBookings);

// Get all bookings for a technician
router.get('/technician-bookings', authMiddleware, getTechnicianBookings);

// Get single booking by ID
router.get('/:bookingId', authMiddleware, getBookingById);

// Update booking status
router.put('/:bookingId/status', authMiddleware, updateBookingStatus);

// Add review to booking
router.post('/:bookingId/review', authMiddleware, addReview);

// Cancel booking
router.put('/:bookingId/cancel', authMiddleware, cancelBooking);

// Reschedule booking
router.put('/:bookingId/reschedule', authMiddleware, rescheduleBooking);

// Delete booking
router.delete('/:bookingId', authMiddleware, deleteBooking);

module.exports = router;
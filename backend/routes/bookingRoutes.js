const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const {
  createBooking,
  getUserBookings,
  getTechnicianBookings,
  getUserPaymentHistory,
  getTechnicianEarnings,
  getAdminRevenue,
  getBookingById,
  updateBookingStatus,
  addReview,
  cancelBooking,
  rescheduleBooking,
  deleteBooking,
  getBookedSlots,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} = require('../controllers/bookingCtrl');

// Create a new booking api/bookings/create
router.post('/create', authMiddleware, createBooking);

// Get all bookings for a user
router.get('/user-bookings', authMiddleware, getUserBookings);

// Get all bookings for a technician
router.get('/technician-bookings', authMiddleware, getTechnicianBookings);

// Get payment history for logged-in user
router.get('/user-payments', authMiddleware, getUserPaymentHistory);

// Get earnings for logged-in technician
router.get('/technician-earnings', authMiddleware, getTechnicianEarnings);

// Get admin revenue from platform fees
router.get('/admin-revenue', authMiddleware, getAdminRevenue);

// Get single booking by ID
router.get('/:bookingId', authMiddleware, getBookingById);

// Get booked slots for a technician on a specific date
router.get('/booked-slots/:technicianId/:date', getBookedSlots);

// api/bookings/:bookingId/status Update booking status
router.put('/:bookingId/status', authMiddleware, updateBookingStatus);

// Add review to booking
router.post('/:bookingId/review', authMiddleware, addReview);

// Cancel booking api/bookings/:bookingId/cancel
router.put('/:bookingId/cancel', authMiddleware, cancelBooking);

// Initiate Khalti payment for completed booking
router.post('/:bookingId/initiate-khalti-payment', authMiddleware, initiateKhaltiPayment);

// Verify Khalti payment for completed booking
router.post('/:bookingId/verify-khalti-payment', authMiddleware, verifyKhaltiPayment);

// Reschedule booking
router.put('/:bookingId/reschedule', authMiddleware, rescheduleBooking);

// Delete booking
router.delete('/:bookingId', authMiddleware, deleteBooking);

module.exports = router;
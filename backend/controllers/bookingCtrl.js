const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { technician, serviceDate, serviceTime, fee, orderNote, technicianInfo } = req.body;

    // Validate required fields
    if (!technician || !serviceDate || !serviceTime || !fee) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: technician, serviceDate, serviceTime, fee',
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get technician details
    const technicianData = await Technician.findById(technician);
    if (!technicianData) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found',
      });
    }

    // Create booking object
    const newBooking = new Booking({
      user: userId,
      technician,
      serviceDate: new Date(serviceDate),
      serviceTime,
      fee,
      note: orderNote,
      status: 'pending',
      technicianInfo: {
        firstname: technicianInfo.firstname,
        lastname: technicianInfo.lastname,
        servicetype: technicianInfo.servicetype,
        experienceYears: technicianInfo.experienceYears,
        location: technicianInfo.location,
        description: technicianInfo.description,
        email: technicianInfo.email,
        phone: technicianData.phone,
      },
      userInfo: {
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
      },
    });

    // Save booking
    const savedBooking = await newBooking.save();

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: savedBooking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
    });
  }
};

// Get all bookings for a user
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId })
      .populate('technician')
      .populate('user')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

// Get all bookings for a technician
exports.getTechnicianBookings = async (req, res) => {
  try {
    const technicianId = req.user._id;

    const bookings = await Booking.find({ technician: technicianId })
      .populate('user')
      .populate('technician')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching technician bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message,
    });
  }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('technician')
      .populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message,
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'ontheway', 'inprogress', 'rescheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true, runValidators: true }
    ).populate('technician').populate('user');

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message,
    });
  }
};

// Add review to booking
exports.addReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;

    // Validate review data
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Update booking with review
    booking.review = {
      rating,
      comment,
      createdAt: new Date(),
    };
    booking.hasReview = true;

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Review added successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message,
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled booking',
      });
    }

    booking.status = 'cancelled';
    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
    });
  }
};

// Reschedule booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { serviceDate, serviceTime } = req.body;

    if (!serviceDate || !serviceTime) {
      return res.status(400).json({
        success: false,
        message: 'serviceDate and serviceTime are required',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if booking can be rescheduled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a completed or cancelled booking',
      });
    }

    booking.serviceDate = new Date(serviceDate);
    booking.serviceTime = serviceTime;
    booking.status = 'rescheduled';

    const updatedBooking = await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rescheduling booking',
      error: error.message,
    });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting booking',
      error: error.message,
    });
  }
};

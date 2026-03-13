const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const EXPIRATION_MINUTES = 30; // Technician has 30 min to accept
    const userId = req.body.userId;
    const { technician, serviceDate, serviceTime, fee, orderNote, technicianInfo, selectedAddress } = req.body;

    // Validate required fields
    if (!technician || !serviceDate || !serviceTime || !fee) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: technician, serviceDate, serviceTime, fee',
      });
    }

    // Validate selectedAddress
    if (!selectedAddress || !selectedAddress.address || !selectedAddress.phone || !selectedAddress.landMark || !selectedAddress._id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or incomplete address. Please select a valid address.',
      });
    }

    // Extract addressId from selectedAddress
    const addressId = selectedAddress._id;

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

    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRATION_MINUTES * 60000); // add 30 min

    // Create booking object
    const newBooking = new Booking({
      user: userId,
      technician,
      serviceDate: new Date(serviceDate),
      serviceTime,
      fee,
      note: orderNote,
      status: 'pending',
      expiresAt,
      technicianInfo: {
        firstname: technicianInfo.firstname,
        lastname: technicianInfo.lastname,
        servicetype: technicianInfo.servicetype,
        experienceYears: technicianInfo.experienceYears,
        location: technicianInfo.location,
        description: technicianInfo.description,
        email: technicianInfo.email,
        phone: technicianData.phone,
        isVerifiedTechnician: technicianData.isVerifiedTechnician || false,
      },
      userInfo: {
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        address: selectedAddress?.address || '',
        phone: selectedAddress?.phone || user.phone || '',
        landMark: selectedAddress?.landMark || '',
        addressId: addressId,
        isHouseVerified: selectedAddress?.isHouseVerified || false,
      },
      hasReview: false,
    });

    // Save booking
    const savedBooking = await newBooking.save();

    user.notification = user.notification || [];
    user.notification.push({
      type: 'booking',
      message: `Your Booking status is pending. Awaiting ${technicianInfo.firstname} ${technicianInfo.lastname}'s confirmation.`,
      bookingId: savedBooking._id,
      date: new Date(),
      read: false,
    });
    await user.save();

    technicianData.notification = technicianData.notification || [];
    technicianData.notification.push({
      type: 'booking',
      message: `New booking assigned by user ${user.firstName} ${user.lastName}`, 
      bookingId: savedBooking._id,
      date: new Date(),
      read: false,
    });
    await technicianData.save();

    // Emit WebSocket event for real-time notification to technician
    const io = req.app.get('io');
    if (io) {
      const technicianIdStr = technician.toString();
      
      // Notify the technician
      io.to(`user_${technicianIdStr}`).emit('booking:notification', {
        type: 'NEW_BOOKING',
        message: `New booking from ${user.firstName} ${user.lastName}`,
        data: {
          technicianId: technicianIdStr,
          userId: userId.toString(),
          bookingId: savedBooking._id.toString(),
          serviceDate: savedBooking.serviceDate,
          serviceTime: savedBooking.serviceTime
        }
      });

      // Notify the user
      const userIdStr = userId.toString();
      io.to(`user_${userIdStr}`).emit('booking:notification', {
        type: 'BOOKING_CREATED',
        message: `Your booking has been created successfully. Awaiting ${technicianInfo.firstname} ${technicianInfo.lastname}'s confirmation.`,
        data: {
          userId: userIdStr,
          technicianId: technicianIdStr,
          bookingId: savedBooking._id.toString(),
          serviceDate: savedBooking.serviceDate,
          serviceTime: savedBooking.serviceTime,
          technicianName: `${technicianInfo.firstname} ${technicianInfo.lastname}`
        }
      });
      
      // Broadcast to all users (for anyone viewing the BookTechnicianPage)
      io.emit('booking:slotsUpdate', {
        technicianId: technicianIdStr,
        serviceDate: savedBooking.serviceDate,
        serviceTime: savedBooking.serviceTime
      });
      
      console.log(`📤 Emitted new booking notification to technician ${technicianIdStr}`.green);
      console.log(`📤 Emitted booking confirmation to user ${userIdStr}`.green);
      console.log(`📢 Broadcasted slots update for technician ${technicianIdStr}`.green);
    }

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
    const userId = req.body.userId;

    const bookings = await Booking.find({ user: userId })
      .populate('technician')
      .populate('user')
      .sort({ createdAt: -1 });

    const now = new Date();

    for (let booking of bookings) {
      if (booking.status === 'pending' && booking.expiresAt && now > booking.expiresAt) {
        booking.status = 'expired';
        await booking.save();

        // Push notification to user
        const user = await User.findById(booking.user);
        if (user) {
          user.notification = user.notification || [];
          user.notification.push({
            type: 'booking',
            message: `Your booking with ${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname} has expired.`,
            bookingId: booking._id,
            date: new Date(),
            read: false,
          });
          await user.save();
        }

        // Push notification to technician
        const technician = await Technician.findById(booking.technician);
        if (technician) {
          technician.notification = technician.notification || [];
          technician.notification.push({
            type: 'booking',
            message: `Booking with ${booking.userInfo.firstname} ${booking.userInfo.lastname} has expired.`,
            bookingId: booking._id,
            date: new Date(),
            read: false,
          });
          await technician.save();
        }
      }
    }

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
    const technicianId = req.body.technicianId;

    const bookings = await Booking.find({ technician: technicianId })
      .populate('user')
      .populate('technician')
      .sort({ createdAt: -1 });

    const now = new Date();

    for (let booking of bookings) {
      if (booking.status === 'pending' && booking.expiresAt && now > booking.expiresAt) {
        booking.status = 'expired';
        await booking.save();

        // Push notification to user
        const user = await User.findById(booking.user);
        if (user) {
          user.notification = user.notification || [];
          user.notification.push({
            type: 'booking',
            message: `Your booking with ${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname} has expired.`,
            bookingId: booking._id,
            date: new Date(),
            read: false,
          });
          await user.save();
        }

        // Push notification to technician
        const technician = await Technician.findById(booking.technician);
        if (technician) {
          technician.notification = technician.notification || [];
          technician.notification.push({
            type: 'booking',
            message: `Booking with ${booking.userInfo.firstname} ${booking.userInfo.lastname} has expired.`,
            bookingId: booking._id,
            date: new Date(),
            read: false,
          });
          await technician.save();
        }
      }
    }

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

// Get booked time slots for a technician on a specific date (excluding cancelled and expired bookings)
exports.getBookedSlots = async (req, res) => {
  try {
    const { technicianId, date } = req.params;

    // Parse the date and get start and end of that day
    const selectedDate = new Date(date);
    const dayStart = new Date(selectedDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Find bookings for this technician on this date, excluding cancelled and expired
    const bookings = await Booking.find({
      technician: technicianId,
      serviceDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'expired', 'declined'] } // Exclude cancelled and expired bookings
    });

    // Extract booked time slots
    const bookedSlots = bookings.map(booking => booking.serviceTime);

    return res.status(200).json({
      success: true,
      bookedSlots,
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booked slots',
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
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'ontheway', 'inprogress', 'rescheduled','declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const booking = await Booking.findById(bookingId).populate('technician').populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if trying to set status to 'inprogress'
    if (status === 'inprogress') {
      // Service start time buffer (in minutes) - change this to adjust when technicians can start service
      const SERVICE_START_BUFFER_MINUTES = 60; 
      const now = new Date();
      const bookingDateTime = new Date(booking.serviceDate);
      
      // Parse the service time (assuming format like "2:00 PM" or "14:00")
      const timeParts = booking.serviceTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const period = timeParts[3];

        // Convert to 24-hour format if AM/PM is present
        if (period) {
          if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }

        bookingDateTime.setHours(hours, minutes, 0, 0);
        
        // Allow service to start based on SERVICE_START_BUFFER_MINUTES before scheduled time
        bookingDateTime.setMinutes(bookingDateTime.getMinutes() - SERVICE_START_BUFFER_MINUTES);

        // Check if current time is before the allowed start time
        if (now < bookingDateTime) {
          return res.status(400).json({
            success: false,
            message: `Service can only start ${SERVICE_START_BUFFER_MINUTES} minutes before scheduled time of ${booking.serviceTime}`,
          });
        }
      }
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

    // Send notification to user if status is confirmed
    if (status === 'confirmed') {
      const user = await User.findById(updatedBooking.user);
      if (user) {
        const bookingDate = new Date(updatedBooking.serviceDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        
        user.notification = user.notification || [];
        user.notification.push({
          type: 'booking',
          message: `Your booking with ${updatedBooking.technicianInfo.firstname} ${updatedBooking.technicianInfo.lastname} has been confirmed for ${bookingDate} ${updatedBooking.serviceTime}.`,
          bookingId: updatedBooking._id,
          date: new Date(),
          read: false,
        });
        await user.save();
      }
    }

    // Send notification to user if status is inprogress
    if (status === 'inprogress') {
      const user = await User.findById(updatedBooking.user);
      if (user) {
        user.notification = user.notification || [];
        user.notification.push({
          type: 'booking',
          message: `Your booking with ${updatedBooking.technicianInfo.firstname} ${updatedBooking.technicianInfo.lastname} is now in progress.`,
          bookingId: updatedBooking._id,
          date: new Date(),
          read: false,
        });
        await user.save();
      }
    }

    // Send notification to user if status is completed
    if (status === 'completed') {
      const user = await User.findById(updatedBooking.user);
      if (user) {
        user.notification = user.notification || [];
        user.notification.push({
          type: 'booking',
          message: `Your booking with ${updatedBooking.technicianInfo.firstname} ${updatedBooking.technicianInfo.lastname} has been completed.`,
          bookingId: updatedBooking._id,
          date: new Date(),
          read: false,
        });
        await user.save();
      }
    }

    // Emit WebSocket event for real-time slots update (when declined, slot becomes available)
    const io = req.app.get('io');
    if (io && status === 'declined') {
      // Broadcast to all users (slot is now available again)
      io.emit('booking:slotsUpdate', {
        technicianId: updatedBooking.technician._id.toString(),
        serviceDate: updatedBooking.serviceDate,
        serviceTime: updatedBooking.serviceTime,
        status: 'declined'
      });
      console.log(`📤 Emitted booking decline slots update for technician ${updatedBooking.technician._id}`.yellow);
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

    // Send notification to user
    const user = await User.findById(booking.user);
    if (user) {
      user.notification = user.notification || [];
      user.notification.push({
        type: 'booking',
        message: `You have cancelled your booking with ${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname}.`,
        bookingId: booking._id,
        date: new Date(),
        read: false,
      });
      await user.save();
    }

    // Send notification to technician
    const technician = await Technician.findById(booking.technician);
    if (technician) {
      technician.notification = technician.notification || [];
      technician.notification.push({
        type: 'booking',
        message: `${booking.userInfo.firstname} ${booking.userInfo.lastname} has cancelled their booking.`,
        bookingId: booking._id,
        date: new Date(),
        read: false,
      });
      await technician.save();
    }

    // Emit WebSocket event for real-time slots update
    const io = req.app.get('io');
    if (io) {
      // Broadcast to all users (slot is now available again)
      io.emit('booking:slotsUpdate', {
        technicianId: booking.technician.toString(),
        serviceDate: booking.serviceDate,
        serviceTime: booking.serviceTime,
        status: 'cancelled'
      });
      console.log(`📤 Emitted booking cancellation slots update for technician ${booking.technician}`.yellow);
    }

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

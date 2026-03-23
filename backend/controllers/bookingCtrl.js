const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');
const ChatMessage = require('../models/chatMessageModel');
const Payment = require('../models/paymentModel');
const { findOrCreateConversation } = require('../utils/conversationService');
const https = require('https');

const KHALTI_INITIATE_URL = process.env.KHALTI_INITIATE_URL || 'https://dev.khalti.com/api/v2/epayment/initiate/';
const KHALTI_LOOKUP_URL = process.env.KHALTI_LOOKUP_URL || 'https://dev.khalti.com/api/v2/epayment/lookup/';
const PLATFORM_FEE_NPR = 50;

// Helper function to calculate service start deadline (serviceTime + 15 minutes)
const calculateServiceStartDeadline = (serviceDate, serviceTime) => {
  const bookingDateTime = new Date(serviceDate);
  
  // Parse the service time (assuming format like "2:00 PM" or "14:00")
  const timeParts = serviceTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
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
    // Add 15 minutes for the deadline
    bookingDateTime.setMinutes(bookingDateTime.getMinutes() + 15);
    
    return bookingDateTime;
  }
  
  return null;
};

// Helper function to check and auto-cancel confirmed bookings that are late
const checkAndAutoCancelLateBookings = async (bookings, io) => {
  const now = new Date();
  
  for (let booking of bookings) {
    // Check if booking is confirmed and service start deadline has passed
    if (booking.status === 'confirmed') {
      const serviceStartDeadline = calculateServiceStartDeadline(booking.serviceDate, booking.serviceTime);
      
      if (serviceStartDeadline && now > serviceStartDeadline) {
        // Auto-cancel the booking
        booking.status = 'cancelled';
        booking.cancellationReason = 'auto_cancelled_late_arrival';
        await booking.save();

        // Push notification to user
        const user = await User.findById(booking.user);
        if (user) {
          user.notification = user.notification || [];
          user.notification.push({
            type: 'booking',
            message: `Your booking with ${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname} has been automatically cancelled because the technician did not arrive within 15 minutes of the scheduled time.`,
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
            message: `Your booking with ${booking.userInfo.firstname} ${booking.userInfo.lastname} has been automatically cancelled due to late arrival (did not start service within 15 minutes of scheduled time).`,
            bookingId: booking._id,
            date: new Date(),
            read: false,
          });
          await technician.save();
        }

        // Emit WebSocket notification for real-time update
        if (io) {
          const userIdStr = booking.user.toString();
          const technicianIdStr = booking.technician.toString();
          
          // Notify the user
          io.to(`user_${userIdStr}`).emit('booking:autoCancelled', {
            type: 'BOOKING_AUTO_CANCELLED',
            message: `Your booking with ${booking.technicianInfo.firstname} ${booking.technicianInfo.lastname} has been automatically cancelled - technician arrived after 15 minutes.`,
            data: {
              bookingId: booking._id.toString(),
              userId: userIdStr,
              technicianId: technicianIdStr,
              reason: 'late_arrival',
              serviceDate: booking.serviceDate,
              serviceTime: booking.serviceTime,
            }
          });

          // Notify the technician
          io.to(`user_${technicianIdStr}`).emit('booking:autoCancelled', {
            type: 'BOOKING_AUTO_CANCELLED',
            message: `Your booking with ${booking.userInfo.firstname} ${booking.userInfo.lastname} has been automatically cancelled - you arrived after 15 minutes.`,
            data: {
              bookingId: booking._id.toString(),
              userId: userIdStr,
              technicianId: technicianIdStr,
              reason: 'late_arrival',
              serviceDate: booking.serviceDate,
              serviceTime: booking.serviceTime,
            }
          });

          console.log(`📢 Emitted auto-cancellation notification for booking ${booking._id}`.cyan);
        }
        
        console.log(`⏰ Auto-cancelled booking ${booking._id} - technician late`.red);
      }
    }
  }
};

// Get payment history for logged-in user
exports.getUserPaymentHistory = async (req, res) => {
  try {
    const userId = req.body.userId;

    const payments = await Payment.find({
      user: userId,
      status: 'paid',
    })
      .populate('technician', 'firstName lastName serviceType')
      .populate('booking', 'serviceDate serviceTime')
      .sort({ paidAt: -1, createdAt: -1 });

    const history = payments.map((payment) => {
      const technicianName = payment.technician
        ? `${payment.technician.firstName || ''} ${payment.technician.lastName || ''}`.trim()
        : 'Technician';

      return {
        id: payment._id,
        bookingId: payment.booking?._id || null,
        technicianId: payment.technician?._id || null,
        technicianName,
        serviceType: payment.technician?.serviceType || 'Service',
        amount: payment.totalAmount,
        paymentDate: payment.paidAt || payment.verifiedAt || payment.createdAt,
        serviceDate: payment.booking?.serviceDate || null,
        serviceTime: payment.booking?.serviceTime || null,
        status: payment.status,
        transactionId: payment.transactionId || null,
      };
    });

    const totalPaid = history.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return res.status(200).json({
      success: true,
      totalPaid,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Error fetching user payment history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message,
    });
  }
};

// Get payment earnings for logged-in technician
exports.getTechnicianEarnings = async (req, res) => {
  try {
    const technicianId = req.body.technicianId;

    const payments = await Payment.find({
      technician: technicianId,
      status: 'paid',
    })
      .populate('user', 'firstName lastName')
      .populate('booking', 'serviceDate serviceTime')
      .sort({ paidAt: -1, createdAt: -1 });

    const history = payments.map((payment) => {
      const userName = payment.user
        ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim()
        : 'Customer';

      return {
        id: payment._id,
        bookingId: payment.booking?._id || null,
        userId: payment.user?._id || null,
        customerName: userName,
        amount: payment.technicianAmount,
        paymentDate: payment.paidAt || payment.verifiedAt || payment.createdAt,
        serviceDate: payment.booking?.serviceDate || null,
        serviceTime: payment.booking?.serviceTime || null,
        status: payment.status,
        transactionId: payment.transactionId || null,
      };
    });

    const totalEarnings = history.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return res.status(200).json({
      success: true,
      totalEarnings,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Error fetching technician earnings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message,
    });
  }
};

// Get admin revenue from platform fees
exports.getAdminRevenue = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.body.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access revenue data',
      });
    }

    const payments = await Payment.find({
      status: 'paid',
    })
      .populate('user', 'firstName lastName email')
      .populate('technician', 'firstName lastName serviceType')
      .populate('booking', 'serviceDate serviceTime')
      .sort({ paidAt: -1, createdAt: -1 });

    const revenue = payments.map((payment) => {
      const userName = payment.user
        ? `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim()
        : 'Customer';

      const technicianName = payment.technician
        ? `${payment.technician.firstName || ''} ${payment.technician.lastName || ''}`.trim()
        : 'Technician';

      return {
        id: payment._id,
        bookingId: payment.booking?._id || null,
        userId: payment.user?._id || null,
        technicianId: payment.technician?._id || null,
        customerName: userName,
        technicianName,
        serviceType: payment.technician?.serviceType || 'Service',
        platformFee: payment.platformFee,
        totalAmount: payment.totalAmount,
        paidAt: payment.paidAt || payment.verifiedAt || payment.createdAt,
        serviceDate: payment.booking?.serviceDate || null,
        serviceTime: payment.booking?.serviceTime || null,
        transactionId: payment.transactionId || null,
      };
    });

    const totalRevenue = revenue.reduce((sum, payment) => sum + Number(payment.platformFee || 0), 0);

    return res.status(200).json({
      success: true,
      totalRevenue,
      count: revenue.length,
      revenue,
    });
  } catch (error) {
    console.error('Error fetching admin revenue:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching revenue data',
      error: error.message,
    });
  }
};

const postToKhalti = ({ endpointUrl, payload, secretKey }) => {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const requestUrl = new URL(endpointUrl);

    const options = {
      hostname: requestUrl.hostname,
      port: requestUrl.port || 443,
      path: `${requestUrl.pathname}${requestUrl.search}`,
      method: 'POST',
      headers: {
        Authorization: `Key ${secretKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        let parsedBody = {};

        try {
          parsedBody = body ? JSON.parse(body) : {};
        } catch (parseError) {
          return reject(new Error('Invalid response from Khalti verification API'));
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          return resolve(parsedBody);
        }

        const error = new Error(parsedBody.detail || parsedBody.message || 'Khalti verification failed');
        error.statusCode = response.statusCode;
        error.data = parsedBody;
        return reject(error);
      });
    });

    req.on('error', (error) => reject(error));
    req.write(requestBody);
    req.end();
  });
};

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

    // Check and auto-cancel confirmed bookings that are late (15+ minutes past service time)
    const io = req.app.get('io');
    await checkAndAutoCancelLateBookings(bookings, io);

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

    // Check and auto-cancel confirmed bookings that are late (15+ minutes past service time)
    const io = req.app.get('io');
    await checkAndAutoCancelLateBookings(bookings, io);

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
      //const SERVICE_START_BUFFER_MINUTES = 60; 
      const SERVICE_START_BUFFER_MINUTES = 1440; 
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

    // Check if trying to set status to 'confirmed' - verify deadline hasn't passed
    if (status === 'confirmed') {
      const serviceStartDeadline = calculateServiceStartDeadline(booking.serviceDate, booking.serviceTime);
      const now = new Date();
      
      if (serviceStartDeadline && now > serviceStartDeadline) {
        return res.status(400).json({
          success: false,
          message: 'Cannot confirm booking - service start deadline has passed (more than 15 minutes after scheduled service time)',
        });
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
      const bookingUserId = updatedBooking.user?._id || updatedBooking.user;
      const bookingTechnicianId = updatedBooking.technician?._id || updatedBooking.technician;

      const conversation = await findOrCreateConversation({
        userId: bookingUserId,
        technicianId: bookingTechnicianId,
        bookingId: updatedBooking._id,
      });

      if (!updatedBooking.conversation || String(updatedBooking.conversation) !== String(conversation._id)) {
        updatedBooking.conversation = conversation._id;
        await updatedBooking.save();
      }

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

      // Seed a first chat message once so both participants know chat is available.
      const existingChatCount = await ChatMessage.countDocuments({ conversation_id: conversation._id });
      if (existingChatCount === 0) {
        await ChatMessage.create({
          conversation_id: conversation._id,
          booking_id: updatedBooking._id,
          sender_id: bookingTechnicianId,
          message: 'Booking confirmed, you can start chatting',
          timestamp: new Date(),
        });
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

// Verify Khalti payment and mark booking as paid
exports.initiateKhaltiPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.body.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to initiate payment for this booking',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be initiated after service is marked as completed',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Booking is already marked as paid',
        paymentStatus: 'paid',
      });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: 'Khalti secret key is missing on server',
      });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serviceAmount = Number(booking.fee);
    const platformFee = PLATFORM_FEE_NPR;
    const totalAmount = serviceAmount + platformFee;
    const totalAmountPaisa = Math.round((Number(booking.fee) + PLATFORM_FEE_NPR) * 100);
    const payload = {
      return_url: `${clientUrl}/bookings?khalti=callback&bookingId=${bookingId}`,
      website_url: clientUrl,
      amount: totalAmountPaisa,
      purchase_order_id: bookingId,
      purchase_order_name: `${booking.technicianInfo?.servicetype || 'Service'} Booking Payment`,
      customer_info: {
        name: `${booking.userInfo?.firstname || ''} ${booking.userInfo?.lastname || ''}`.trim(),
        email: booking.userInfo?.email || undefined,
        phone: booking.userInfo?.phone || undefined,
      },
    };

    const khaltiResponse = await postToKhalti({
      endpointUrl: KHALTI_INITIATE_URL,
      payload,
      secretKey,
    });

    await Payment.findOneAndUpdate(
      { pidx: khaltiResponse.pidx },
      {
        booking: booking._id,
        user: booking.user,
        technician: booking.technician,
        provider: 'khalti',
        currency: 'NPR',
        serviceAmount,
        platformFee,
        technicianAmount: serviceAmount,
        adminAmount: platformFee,
        totalAmount,
        amountInPaisa: totalAmountPaisa,
        status: 'initiated',
        pidx: khaltiResponse.pidx,
        initiatedAt: new Date(),
        metadata: {
          initiateResponse: khaltiResponse,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Khalti payment initiated successfully',
      paymentUrl: khaltiResponse.payment_url,
      pidx: khaltiResponse.pidx,
      expiresAt: khaltiResponse.expires_at,
      amount: totalAmountPaisa,
    });
  } catch (error) {
    console.error('Error initiating Khalti payment:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error initiating Khalti payment',
      khalti: error.data,
    });
  }
};

// Verify Khalti payment (lookup) and mark booking as paid
exports.verifyKhaltiPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { pidx } = req.body;
    const userId = req.body.userId;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: 'pidx is required for payment verification',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to verify this payment',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment can only be completed after service is marked as completed',
      });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Booking is already marked as paid',
        paymentStatus: 'paid',
      });
    }

    const expectedAmount = Math.round((Number(booking.fee) + PLATFORM_FEE_NPR) * 100);
    const serviceAmount = Number(booking.fee);
    const platformFee = PLATFORM_FEE_NPR;
    const totalAmount = serviceAmount + platformFee;

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: 'Khalti secret key is missing on server',
      });
    }

    const khaltiResponse = await postToKhalti({
      endpointUrl: KHALTI_LOOKUP_URL,
      payload: { pidx },
      secretKey,
    });

    if (khaltiResponse.status !== 'Completed') {
      booking.paymentStatus = 'failed';
      await booking.save();

      await Payment.findOneAndUpdate(
        { pidx },
        {
          booking: booking._id,
          user: booking.user,
          technician: booking.technician,
          provider: 'khalti',
          currency: 'NPR',
          serviceAmount,
          platformFee,
          technicianAmount: serviceAmount,
          adminAmount: platformFee,
          totalAmount,
          amountInPaisa: expectedAmount,
          status: 'failed',
          pidx,
          khaltiStatus: khaltiResponse.status,
          verifiedAt: new Date(),
          failureReason: `Payment not completed. Current status: ${khaltiResponse.status}`,
          metadata: {
            lookupResponse: khaltiResponse,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.status(400).json({
        success: false,
        message: `Payment not completed. Current status: ${khaltiResponse.status}`,
        khalti: khaltiResponse,
      });
    }

    if (Number(khaltiResponse.total_amount) !== expectedAmount) {
      booking.paymentStatus = 'failed';
      await booking.save();

      await Payment.findOneAndUpdate(
        { pidx },
        {
          booking: booking._id,
          user: booking.user,
          technician: booking.technician,
          provider: 'khalti',
          currency: 'NPR',
          serviceAmount,
          platformFee,
          technicianAmount: serviceAmount,
          adminAmount: platformFee,
          totalAmount,
          amountInPaisa: expectedAmount,
          status: 'failed',
          pidx,
          khaltiStatus: khaltiResponse.status,
          verifiedAt: new Date(),
          failureReason: 'Payment amount mismatch',
          metadata: {
            lookupResponse: khaltiResponse,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch',
        expectedAmount,
        khalti: khaltiResponse,
      });
    }

    booking.paymentStatus = 'paid';
    await booking.save();

    await Payment.findOneAndUpdate(
      { pidx },
      {
        booking: booking._id,
        user: booking.user,
        technician: booking.technician,
        provider: 'khalti',
        currency: 'NPR',
        serviceAmount,
        platformFee,
        technicianAmount: serviceAmount,
        adminAmount: platformFee,
        totalAmount,
        amountInPaisa: expectedAmount,
        status: 'paid',
        pidx,
        transactionId: khaltiResponse.transaction_id,
        khaltiStatus: khaltiResponse.status,
        verifiedAt: new Date(),
        paidAt: new Date(),
        metadata: {
          lookupResponse: khaltiResponse,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentStatus: booking.paymentStatus,
      transactionId: khaltiResponse.transaction_id,
      khalti: khaltiResponse,
    });
  } catch (error) {
    console.error('Error verifying Khalti payment:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error verifying Khalti payment',
      khalti: error.data,
    });
  }
};

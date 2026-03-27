
const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const { BrevoClient } = require("@getbrevo/brevo");
// const nodemailer = require("nodemailer"); // SMTP backup import
const jwt = require("jsonwebtoken");
const Technician = require("../models/technicianModel.js");
const Booking = require("../models/bookingModel.js");
const Payment = require("../models/paymentModel.js");
const fs = require("fs");
const path = require("path");

const emitAdminDataChanged = (req, changes = []) => {
  const io = req.app.get("io");
  if (io && typeof io.emitAdminDataChanged === "function") {
    io.emitAdminDataChanged(changes);
  }
};

if (!process.env.EMAIL_USER) {
  console.error("EMAIL_USER is not set in environment");
}
if (!process.env.BREVO_API_KEY) {
  console.error("BREVO_API_KEY is not set in environment");
}

const brevoClient = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendBrevoEmail = async ({ toEmail, subject, html }) => {
  return brevoClient.transactionalEmails.sendTransacEmail({
    sender: {
      email: process.env.EMAIL_USER,
      name: "HomeCare",
    },
    to: [{ email: toEmail }],
    subject,
    htmlContent: html,
  });
};

// SMTP backup (disabled by default)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

  const changeTechnicianStatus = async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { status } = req.body;  // "approved" or "rejected"
  
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be 'approved' or 'rejected'."
        });
      }
  
      // Find technician
      const technician = await Technician.findById(technicianId);
  
      if (!technician) {
        return res.status(404).json({
          success: false,
          message: "Technician not found"
        });
      }
  
      // Update status
      technician.status = status;
      // If approved, send notification
      if (status === "approved") {
        technician.notification.push({
          message: "Your account has been approved, please complete your profile to activate your account.",
          createdAt: new Date(),
          type: "account_approved"
        });
      }
      await technician.save();
  
      // Prepare email message
      const messageText =
        status === "approved"
          ? `Hello ${technician.firstName}, your technician account has been approved but is still inactive. You may now log in and start using the platform. Please complete your profile after logging in to activate your account.`
          : `Hello ${technician.firstName}, unfortunately your technician application has been rejected. You may contact support for details.`;

      const titleText = 
        status === "approved"
          ? "Your Technician Account Has Been Approved"
          : "Your Technician Application Has Been Rejected";

      const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;

      const actionButton = 
        status === "approved"
          ? `<p style="margin: 0; margin-top: 40px;">
              <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; background: #1A2D6F; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Log In Now</a>
            </p>`
          : `<p style="margin: 0; margin-top: 40px; color: #666666; font-size: 14px;">
              If you have any questions, please contact our support team.
            </p>`;
  
      // Read and populate the template
      const templatePath = path.join(__dirname, "../templates/technicianAcc.html");
      let htmlTemplate = fs.readFileSync(templatePath, "utf8");
      
      htmlTemplate = htmlTemplate
        .replace("{{ACCOUNT_STATUS_TITLE}}", titleText)
        .replace("{{MESSAGE}}", messageText)
        .replace("{{ACTION_BUTTON}}", actionButton);

      console.log("Template path:", templatePath);
      console.log("Template loaded successfully");
  
      // Send email
      await sendBrevoEmail({
        toEmail: technician.email,
        subject: titleText,
        html: htmlTemplate,
      });

      // Emit WebSocket event for real-time notification to technician
      const io = req.app.get('io');
      if (io) {
        const technicianIdStr = technicianId.toString();
        io.to(`user_${technicianIdStr}`).emit('booking:notification', {
          type: status === 'approved' ? 'ACCOUNT_APPROVED' : 'ACCOUNT_REJECTED',
          message: status === 'approved' 
            ? 'Your account has been approved! You can now log in.' 
            : 'Your application has been rejected. Please contact support.',
          data: {
            technicianId: technicianIdStr,
            status: status
          }
        });
        console.log(`📤 Emitted technician status update to ${technicianIdStr}`.green);
      }
  
      emitAdminDataChanged(req, ["technicians", "dashboard-stats"]);

      return res.status(200).json({
        success: true,
        message: `Technician status updated to ${status} and email sent.`,
        technician
      });
  
    } catch (error) {
      console.error("Error changing technician status:", error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  };

  

// Admin changes technician certificate status
const changeTechnicianCertificateStatus = async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'."
      });
    }

    // Find technician
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found"
      });
    }

    // Update status
    technician.certificateStatus = status;
    technician.isVerifiedTechnician = (status === 'approved');
    await technician.save();

    // Notify technician
    technician.notification = technician.notification || [];
    technician.notification.push({
      message:
        status === 'approved'
          ? 'Your certificate has been approved. You are now a verified technician.'
          : 'Your certificate was rejected. Please upload a valid certificate.',
      createdAt: new Date(),
      type: 'certificate_' + status
    });
    await technician.save();

    // Emit WebSocket event for real-time notification to technician
    const io = req.app.get('io');
    if (io) {
      const technicianIdStr = technicianId.toString();
      io.to(`user_${technicianIdStr}`).emit('booking:notification', {
        type: status === 'approved' ? 'CERTIFICATE_APPROVED' : 'CERTIFICATE_REJECTED',
        message: status === 'approved'
          ? 'Your certificate has been approved. You are now a verified technician.'
          : 'Your certificate was rejected. Please upload a valid certificate.',
        data: {
          technicianId: technicianIdStr,
          certificateStatus: status
        }
      });
      console.log(`📤 Emitted certificate status update to ${technicianIdStr}`.green);
    }

    emitAdminDataChanged(req, ["technicians", "dashboard-stats"]);

    return res.status(200).json({
      success: true,
      message: `Technician certificate status updated to ${status}.`,
      technician
    });
  } catch (error) {
    console.error('Error changing technician certificate status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// Admin changes house verification status for a user
const changeHouseVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'."
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update status
    user.houseCertificateStatus = status;
    user.isHouseVerified = (status === 'approved');
    await user.save();

    // Notify user
    user.notification = user.notification || [];
    user.notification.push({
      message:
        status === 'approved'
          ? 'Your house certificate has been approved. Your address is now verified.'
          : 'Your house certificate was rejected. Please upload a valid document.',
      createdAt: new Date(),
      type: 'house_certificate_' + status
    });
    await user.save();

    // Emit WebSocket event for real-time notification to user
    const io = req.app.get('io');
    if (io) {
      const userIdStr = userId.toString();
      io.to(`user_${userIdStr}`).emit('booking:notification', {
        type: status === 'approved' ? 'HOUSE_CERTIFICATE_APPROVED' : 'HOUSE_CERTIFICATE_REJECTED',
        message: status === 'approved'
          ? 'Your house certificate has been approved. Your address is now verified.'
          : 'Your house certificate was rejected. Please upload a valid document.',
        data: {
          userId: userIdStr,
          houseCertificateStatus: status
        }
      });
      console.log(`📤 Emitted house certificate status update to ${userIdStr}`.green);
    }

    // Optionally, send email (not required, but can be added)

    emitAdminDataChanged(req, ["users", "dashboard-stats"]);

    return res.status(200).json({
      success: true,
      message: `House certificate status updated to ${status}.`,
      user
    });
  } catch (error) {
    console.error('Error changing house verification status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const changeAddressVerificationStatus = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const { status } = req.body; // "approved" or "rejected"
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'."
      });
    }
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    } 
    // Find address
    const address = user.addressBook.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }
    // Update address verification status
    address.houseCertificateStatus = status;
    address.isHouseVerified = (status === 'approved');
    user.notification = user.notification || [];
    user.notification.push({
      message:
        status === 'approved'
          ? 'Your address certificate has been approved. Your address is now verified.'
          : 'Your address certificate was rejected. Please upload a valid document.',
      createdAt: new Date(),
      type: 'address_certificate_' + status
    });
    await user.save();

    // Emit WebSocket event for real-time notification to user
    const io = req.app.get('io');
    if (io) {
      const userIdStr = userId.toString();
      io.to(`user_${userIdStr}`).emit('booking:notification', {
        type: status === 'approved' ? 'ADDRESS_CERTIFICATE_APPROVED' : 'ADDRESS_CERTIFICATE_REJECTED',
        message: status === 'approved'
          ? 'Your address certificate has been approved. Your address is now verified.'
          : 'Your address certificate was rejected. Please upload a valid document.',
        data: {
          userId: userIdStr,
          addressId: addressId.toString(),
          addressCertificateStatus: status
        }
      });
      console.log(`📤 Emitted address certificate status update to ${userIdStr}`.green);
    }

    emitAdminDataChanged(req, ["users", "dashboard-stats"]);

    return res.status(200).json({
      success: true,
      message: `Address verification status updated to ${status}.`,
      address
    });
  } catch (error) {
    console.error('Error changing address verification status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getAllTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      technicians
    });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({  
      success: false,
      message: 'Server error',
      error: error.message
    });
  }

};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    if (!req.body.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete users",
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin user cannot be deleted",
      });
    }

    await User.findByIdAndDelete(userId);

    emitAdminDataChanged(req, ["users", "dashboard-stats"]);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("technician", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({  
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.body.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access dashboard stats',
      });
    }

    // Get counts
    const totalTechnicians = await Technician.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalBookings = await Booking.countDocuments();

    // Get this month revenue
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const paidPayments = await Payment.find({
      status: 'paid',
    });

    const thisMonthRevenue = paidPayments
      .filter((payment) => {
        const paymentDate = new Date(payment.paidAt || payment.createdAt);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + Number(payment.platformFee || 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalTechnicians,
        totalUsers,
        totalBookings,
        thisMonthRevenue,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message,
    });
  }
};

const broadcastNotificationToAll = async (req, res) => {
  try {
    if (!req.body.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only admins can broadcast notifications",
      });
    }

    const {
      message,
      title = "Announcement",
      type = "admin_broadcast",
      onClickPath = "",
      target = "all",
    } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    if (!["all", "users", "technicians"].includes(target)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target. Use 'all', 'users', or 'technicians'.",
      });
    }

    const createdAt = new Date();
    const notificationPayload = {
      type,
      title,
      message: String(message).trim(),
      onClickPath,
      createdAt,
      date: createdAt,
      read: false,
      action: "broadcast",
    };

    let userUpdateResult = { modifiedCount: 0 };
    let technicianUpdateResult = { modifiedCount: 0 };
    let users = [];
    let technicians = [];

    if (target === "all" || target === "users") {
      [userUpdateResult, users] = await Promise.all([
        User.updateMany(
          { isAdmin: false },
          { $push: { notification: notificationPayload } },
        ),
        User.find({ isAdmin: false }).select("_id"),
      ]);
    }

    if (target === "all" || target === "technicians") {
      [technicianUpdateResult, technicians] = await Promise.all([
        Technician.updateMany(
          {},
          { $push: { notification: notificationPayload } },
        ),
        Technician.find({}).select("_id"),
      ]);
    }

    const io = req.app.get("io");
    if (io) {
      users.forEach((user) => {
        io.to(`user_${String(user._id)}`).emit("booking:notification", {
          ...notificationPayload,
          data: {
            recipientId: String(user._id),
            recipientType: "user",
          },
        });
      });

      technicians.forEach((technician) => {
        io.to(`user_${String(technician._id)}`).emit("booking:notification", {
          ...notificationPayload,
          data: {
            recipientId: String(technician._id),
            recipientType: "technician",
          },
        });
      });
    }

    emitAdminDataChanged(req, ["notifications"]);

    return res.status(200).json({
      success: true,
      message: "Notification broadcasted successfully",
      counts: {
        users: userUpdateResult.modifiedCount || 0,
        technicians: technicianUpdateResult.modifiedCount || 0,
      },
      target,
    });
  } catch (error) {
    console.error("Error broadcasting notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

  module.exports = {
    changeTechnicianStatus,
    changeHouseVerificationStatus,
    changeTechnicianCertificateStatus,
    changeAddressVerificationStatus,
    getAllTechnicians,
    getAllUsers,
    deleteUserByAdmin,
    getAllBookings,
    getDashboardStats,
    broadcastNotificationToAll,
  };
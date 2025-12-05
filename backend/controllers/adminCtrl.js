const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Technician = require("../models/technicianModel.js")

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

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
      await technician.save();
  
      // Prepare email
      const subject =
        status === "approved"
          ? "Your Technician Account Has Been Approved"
          : "Your Technician Application Has Been Rejected";
  
      const message =
        status === "approved"
          ? `Hello ${technician.firstName}, your technician account has been approved but is still inactive. You may now log in and start using the platform. Please complete your profile after logging in to activate your account.`
          : `Hello ${technician.firstName}, unfortunately your technician application has been rejected. You may contact support for details.`;
  
      // Send email
      await transporter.sendMail({
        to: technician.email,
        subject,
        text: message
      });
  
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

  module.exports = {
    changeTechnicianStatus
  };
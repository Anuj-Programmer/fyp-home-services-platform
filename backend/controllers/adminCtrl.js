const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Technician = require("../models/technicianModel.js");
const fs = require("fs");
const path = require("path");

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

      const actionButton = 
        status === "approved"
          ? `<p style="margin: 0; margin-top: 40px;">
              <a href="http://localhost:5173/login" style="display: inline-block; padding: 12px 30px; background: #1A2D6F; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Log In Now</a>
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
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: technician.email,
        subject: titleText,
        html: htmlTemplate,
        text: messageText
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
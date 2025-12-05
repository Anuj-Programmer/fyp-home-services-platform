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

const registerTechnician = async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        phone,
        identityDocumentUrl,
        experienceYears,
        serviceType,
        certificateUrl,
        email
      } = req.body;
      
      // Create technician entry
      const technician = new Technician({
        firstName,
        lastName,
        phone,
        email,
        isEmailVerified: true,
        identityDocumentUrl,
        experienceYears,
        serviceType,
        certificateUrl
      });
  
      await technician.save();
  
      // Find admin user
      const admin = await User.findOne({ isAdmin: true });
  
      if (!admin) {
        return res.status(500).json({
          success: false,
          message: "Technician registered, but no admin found."
        });
      }
  
      // Push minimal notification
      admin.notification.push({
        technicianId: technician._id,
        name: `${firstName} ${lastName}`,
        action: "approve_or_reject",
        createdAt: new Date()
      });
  
      await admin.save();
  
      return res.status(201).json({
        success: true,
        message: "Technician applied successfully. Waiting for admin approval."
      });
  
    } catch (error) {
      console.error("Error registering technician:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during technician registration",
        error: error.message
      });
    }
  };

  const updateTechnicianProfile = async (req, res) => {
    try {
      const { technicianId, userId } = req.body;
      const id = userId || technicianId;

      if (!id) {
        return res.status(401).json({ message: "Unauthorized: No technician ID found" });
      }

      const {
        firstName,
        lastName,
        phone,
        experienceYears,
        availability,
        fee,
        location,
        photoUrl,
        description
      } = req.body;

      // Find technician
      const technician = await Technician.findById(id);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }

      // Update allowed fields only
      if (firstName) technician.firstName = firstName;
      if (lastName) technician.lastName = lastName;
      if (phone) technician.phone = phone;
      if (experienceYears !== undefined) technician.experienceYears = experienceYears;
      if (fee !== undefined) technician.fee = fee;
      if (location) technician.location = location;
      if (photoUrl) technician.photoUrl = photoUrl;
      if (description) technician.description = description;
      
      // Update availability if provided
      if (availability) {
        // Convert availability object to array format for storage
        if (typeof availability === 'object' && !Array.isArray(availability)) {
          const availabilityArray = [];
          Object.keys(availability).forEach(day => {
            if (availability[day].isAvailable) {
              availabilityArray.push({
                day,
                startTime: availability[day].startTime,
                endTime: availability[day].endTime,
                slotDuration: 60 // default 60 minutes
              });
            }
          });
          technician.availability = availabilityArray;
        } else if (Array.isArray(availability)) {
          technician.availability = availability;
        }
      }

      await technician.save();

      res.json({
        message: "Technician profile updated successfully",
        technician,
        role: "technician"
      });

    } catch (error) {
      console.error("Error updating technician profile:", error);
      res.status(500).json({
        success: false,
        message: "Server error during technician profile update",
        error: error.message
      });
    }
  };

  

module.exports = {
  registerTechnician,
  updateTechnicianProfile
}
  
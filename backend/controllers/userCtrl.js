const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Technician = require("../models/technicianModel.js");
// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// ------------------- 3) Create Profile -------------------
const createProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      address,
      phone,
      detailedAddress = {},
    } = req.body;

    if (!firstName || !lastName || !email || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.firstName = firstName;
      user.lastName = lastName;
      user.address = address;
      if (phone) user.phone = phone;
      user.detailedAddress = {
        ...(user.detailedAddress?.toObject?.() || user.detailedAddress || {}),
        ...detailedAddress,
      };
      await user.save();
      return res.json({ message: "Profile updated successfully", user });
    }

    user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      detailedAddress,
      isEmailVerified: true,
      address,
    });

    res.json({ message: "Profile created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating profile" });
  }
};


// ------------------- Register User -------------------
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, address } = req.body;

    // All fields required
    if (!firstName || !lastName || !email || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      isEmailVerified: true, 
      address
    });
    const token = jwt.sign({ userId: newUser._id, isAdmin: false }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ message: "User registered successfully", user: newUser, token, role:"user" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      address,
      phone,
      detailedAddress,
      userId,
      technicianId,
    } = req.body;

    // Get ID from auth middleware
    const id = userId || technicianId;
    if (!id) {
      return res.status(401).json({ message: "Unauthorized: No user ID found" });
    }

    let user;
    let role = "user";

    // Try finding in User collection first
    user = await User.findById(id);
    
    // If not found and we have technicianId, search in Technician collection
    if (!user && technicianId) {
      user = await Technician.findById(technicianId);
      if (user) role = "technician";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update common fields for all roles
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    // Update address only for normal users (not technicians or admins)
    if (!user.isAdmin && role === "user") {
      user.address = address || user.address;
      if (detailedAddress) {
        user.detailedAddress = {
          ...user.detailedAddress,
          ...detailedAddress,
        };
      }
    }

    await user.save();

    // Return updated user with role included
    const userObj = user.toObject ? user.toObject() : user;
    
    res.json({
      message: "Profile updated successfully",
      user: { ...userObj, role: user.isAdmin ? "admin" : role },
      role: user.isAdmin ? "admin" : role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};



const markAllNotification = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const seenNotifications = user.seenNotications;
    const notification = user.notification;
    
    seenNotifications.push(...notification);
    user.notification = [];
    user.seenNotifications = seenNotifications;

    const updatedUser = await user.save();
    
    res.status(200).send({
        success: true,
        message: "All notifications marked as read",
        data: updatedUser,
    });
} catch (error) {
    console.log(error);
    res.status(500).send({
        message: "Error in notification",
        success: false,
        error,
    });
}
}

const deleteAllNotifications = async (req, res) => {
  try {
      const user = await User.findOne({ _id: req.body.userId });
      user.notification = [];
      user.seenNotifications = [];
      
      const updatedUser = await user.save();
      
      res.status(200).send({
          success: true,
          message: "All notifications deleted",
          data: updatedUser,
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          message: "Error in notification",
          success: false,
          error,
      });
  }
}; 

module.exports = {
  createProfile,
  registerUser,
  updateProfile,
  deleteAllNotifications,
  markAllNotification,
};

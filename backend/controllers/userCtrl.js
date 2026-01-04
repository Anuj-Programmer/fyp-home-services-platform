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
    const userId = req.body.userId;
    
    // Try finding in User collection first
    let user = await User.findOne({ _id: userId });
    if (user) {
      const seenNotifications = user.seenNotifications || [];
      const notification = user.notification || [];
      seenNotifications.push(...notification);
      user.notification = [];
      user.seenNotifications = seenNotifications;
      const updatedUser = await user.save();
      const role = updatedUser.isAdmin ? "admin" : "user";
      const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
      return res.status(200).send({
        success: true,
        message: "All notifications marked as read",
        data: { ...userObj, role },
      });
    }
    
    // If not found in User, try Technician collection
    let technician = await Technician.findOne({ _id: userId });
    if (technician) {
      const seenNotifications = technician.seenNotifications || [];
      const notification = technician.notification || [];
      seenNotifications.push(...notification);
      technician.notification = [];
      technician.seenNotifications = seenNotifications;
      const updatedTechnician = await technician.save();
      const userObj = updatedTechnician.toObject ? updatedTechnician.toObject() : updatedTechnician;
      return res.status(200).send({
        success: true,
        message: "All notifications marked as read",
        data: { ...userObj, role: "technician" },
      });
    }
    
    // User not found in either collection
    return res.status(404).send({
        success: false,
        message: "User not found",
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
      const userId = req.body.userId;
      
      // Try finding in User collection first
      let user = await User.findOne({ _id: userId });
        if (user) {
          user.notification = [];
          user.seenNotifications = [];
          const updatedUser = await user.save();
          const role = updatedUser.isAdmin ? "admin" : "user";
          const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
          return res.status(200).send({
          success: true,
          message: "All notifications deleted",
          data: { ...userObj, role },
          });
        }
      
      // If not found in User, try Technician collection
      let technician = await Technician.findOne({ _id: userId });
        if (technician) {
          technician.notification = [];
          technician.seenNotifications = [];
          const updatedTechnician = await technician.save();
          const userObj = updatedTechnician.toObject ? updatedTechnician.toObject() : updatedTechnician;
          return res.status(200).send({
          success: true,
          message: "All notifications deleted",
          data: { ...userObj, role: "technician" },
          });
        }
      
      // User not found in either collection
      return res.status(404).send({
          success: false,
          message: "User not found",
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

const getCurrentUser = async (req, res) => {
  try {
    // Try to get userId from request body first (for backward compatibility)
    let userId = req.body.userId || req.body.technicianId;
    const isTechnician = req.body.isTechnician || false;

    // If no userId in body, extract from JWT token
    if (!userId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.technicianId;
      } catch (tokenError) {
        console.log("Token decode error:", tokenError.message);
      }
    }

    if (!userId) return res.status(401).json({ message: "Unauthorized: No user ID found" });

    let user;
    let role = "user";

    if (isTechnician) {
      // Try Technician collection first
      user = await Technician.findById(userId);
      if (user) role = "technician";
      else {
        // Fallback to User collection if not found in Technician
        user = await User.findById(userId);
        if (user?.isAdmin) role = "admin";
      }
    } else {
      // Regular user/admin - try User collection first
      user = await User.findById(userId);
      if (user) {
        role = user.isAdmin ? "admin" : "user";
      } else {
        // Fallback to Technician collection if not found in User
        user = await Technician.findById(userId);
        if (user) role = "technician";
      }
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const userObj = user?.toObject ? user.toObject() : user;

    // Return user info with safe role
    res.json({ 
      ...userObj, 
      role: role 
    });

  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({ message: "Server error fetching user" });
  }
};

const uploadHouseCertificate = async (req, res) => {
  try {
    const { userId, certificateUrl } = req.body;

    if (!userId || !certificateUrl) {
      return res.status(400).json({ message: "User ID and certificate URL are required" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user with certificate
    user.houseCertificateUrl = certificateUrl;
    user.houseCertificateStatus = 'pending';
    await user.save();

    // Find all admins and send notification
    const admins = await User.find({ isAdmin: true });
    
    const notificationMessage = {
      type: 'certificate-upload',
      message: `${user.firstName} ${user.lastName} has uploaded a house certificate for verification`,
      userId: user._id,
      onClickPath: '/admin/users',
      timestamp: new Date(),
    };

    // Push notification to all admins
    for (const admin of admins) {
      admin.notification = admin.notification || [];
      admin.notification.push(notificationMessage);
      await admin.save();
    }

    res.status(200).json({
      message: "Certificate uploaded successfully. Awaiting admin approval.",
      user: {
        ...user.toObject(),
        role: user.isAdmin ? "admin" : "user",
      },
    });
  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ message: "Server error uploading certificate" });
  }
};



module.exports = {
  createProfile,
  registerUser,
  updateProfile,
  deleteAllNotifications,
  markAllNotification,
  getCurrentUser,
  uploadHouseCertificate
};

const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

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
    const { firstName, lastName, email, address } = req.body;

    if (!firstName || !lastName || !email || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      isEmailVerified: true,
      address
    });

    res.json({ message: "Profile created successfully", user: newUser });
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
      isEmailVerified: true, // must be true after OTP verified
      address
    });
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: "User registered successfully", user: newUser, token});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

module.exports = { registerUser };


module.exports = {
  createProfile,
  registerUser
};

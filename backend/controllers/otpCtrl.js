const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const Technician = require("../models/technicianModel.js");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Validate envs early
if (!process.env.EMAIL_USER ) {
  console.error("EMAIL_USER or EMAIL_PASS is not set in environment");
}else if (!process.env.EMAIL_PASS){
  console.error("EMAIL_PASS is not set in environment");
}

// Use explicit SMTP config and verify
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify transporter on startup (async)
transporter.verify().then(() => {
  console.log("Mailer configured and verified");
}).catch((err) => {
  console.error("Mailer verification failed:", err);
});

// ------------------- 1) Send OTP -------------------
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check User collection
    const existingUser = await User.findOne({ email });

    // Check Technician collection
    const existingTechnician = await Technician.findOne({ email });

    // If email exists in either collection, block registration
    if (existingUser || existingTechnician) {
      return res.status(409).json({
        message: "Email already registered. Please log in instead."
      });
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await OTP.create({ email, otp: otpCode, expiresAt });

      // ---- Load Template ----
    const templatePath = path.join(process.cwd(), "templates", "otpTemplate.html");
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace the {{OTP}} placeholder
    htmlTemplate = htmlTemplate.replace("{{OTP}}", otpCode);

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: htmlTemplate
    });

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error sending OTP" });
  }
};


// ------------------- 2) Verify OTP -------------------
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });

    // OTP verified → remove all OTPs for this email
    await OTP.deleteMany({ email });

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

// ------------------- Send Login OTP -------------------
// const sendLoginOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ message: "Email is required" });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

//     await OTP.create({ email, otp: otpCode, expiresAt });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your Login OTP",
//       text: `Your OTP code is ${otpCode}. It expires in 5 minutes.`
//     });

//     res.json({ message: "OTP sent to your email" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error sending OTP" });
//   }
// };

const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    let user = await User.findOne({ email });
    let role = "user";

    if (user) {
      role = user.isAdmin ? "admin" : "user";
    } else {
      // Check Technician collection
      user = await Technician.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow login if technician is approved
      if (user.status !== "approved") {
        return res.status(403).json({
          message: `Technician account is ${user.status}. Cannot login yet.`,
        });
      }
      role = "technician";
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({ email, otp: otpCode, expiresAt });

      // ---- Load Template ----
    const templatePath = path.join(process.cwd(), "templates", "otpTemplate.html");
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace the {{OTP}} placeholder
    htmlTemplate = htmlTemplate.replace("{{OTP}}", otpCode);

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
          subject: "Your Login OTP",
          html: htmlTemplate,
    });

    res.json({ message: "OTP sent to your email", role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error sending OTP", error: error.message });
  }
};


const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: "Invalid OTP" });
    if (record.expiresAt < new Date())
      return res.status(400).json({ message: "OTP expired" });

    await OTP.deleteMany({ email });

    // Check if email belongs to a user/admin first
    let user = await User.findOne({ email });
    let role = "user";

    if (user) {
      role = user.isAdmin ? "admin" : "user";
    } else {
      // Check technician collection
      user = await Technician.findOne({ email });
      if (user) role = "technician";
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate JWT (keep the old middleware-compatible keys)
    let payload = {};
    if (role === "admin" || role === "user") payload.userId = user._id;
    if (role === "admin") payload.isAdmin = true;
    if (role === "technician") payload.technicianId = user._id;

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      token,
      user,
      role // send role so frontend knows where to redirect
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error verifying OTP", error: error.message });
  }
};

// ------------------- Contact Form -------------------
const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    // Send email to your support/admin
    await transporter.sendMail({
      from: `"${name}" <${email}>`, // sender info
      to: process.env.EMAIL_USER,   // your receiving email
      subject: "New Contact Form Message",
      text: message,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong><br/>${message}</p>`,
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error sending message" });
  }
};


module.exports = {
  sendOtp,
  verifyOtp,
  sendLoginOtp,
  verifyLoginOtp,
  sendContactMessage
};

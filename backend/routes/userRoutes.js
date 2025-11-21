const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");

const { createProfile, registerUser, updateProfile } = require("../controllers/userCtrl");

// Register a new user
// POST /api/users/register
router.post("/register", registerUser);

// Create / update profile
// POST /api/users/profile
router.post("/profile", createProfile);
router.put("/update-profile", authMiddleware,  updateProfile);

module.exports = router;
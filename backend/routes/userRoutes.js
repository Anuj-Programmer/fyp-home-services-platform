const express = require("express");
const router = express.Router();

const { createProfile, registerUser } = require("../controllers/userCtrl");

// Register a new user
// POST /api/users/register
router.post("/register", registerUser);

// Create / update profile
// POST /api/users/profile
router.post("/profile", createProfile);

module.exports = router;
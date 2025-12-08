const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");

const { createProfile, registerUser, updateProfile, markAllNotification,deleteAllNotifications, getCurrentUser} = require("../controllers/userCtrl");

// Register a new user
// POST /api/users/register
router.post("/register", registerUser);

// Create / update profile
// POST /api/users/profile
router.post("/profile", createProfile);
router.put("/update-profile", authMiddleware,  updateProfile);

//Mark All Notifications || POST
router.post('/mark-all-notifications', authMiddleware, markAllNotification);

//Delete All Notifications || POST
router.post('/delete-all-notifications', authMiddleware, deleteAllNotifications);

// Get Current User || GET /api/users/current-user
router.get('/current-user', authMiddleware, getCurrentUser);


module.exports = router;
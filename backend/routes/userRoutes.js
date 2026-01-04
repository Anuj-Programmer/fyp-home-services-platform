const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");

const { createProfile, registerUser, updateProfile, markAllNotification,deleteAllNotifications, getCurrentUser, uploadHouseCertificate, addAddress, updateAddress, deleteAddress, uploadAddressCertificate} = require("../controllers/userCtrl");

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

// Upload House Certificate || POST /api/users/upload-certificate
router.post('/upload-certificate', authMiddleware, uploadHouseCertificate);

// Upload Address Certificate || POST /api/users/upload-address-certificate
router.post('/upload-address-certificate', authMiddleware, uploadAddressCertificate);

// Address Book Management
// Add Address || POST /api/users/add-address
router.post('/add-address', authMiddleware, addAddress);

// Update Address || PUT /api/users/update-address
router.put('/update-address', authMiddleware, updateAddress);

// Delete Address || DELETE /api/users/delete-address
router.delete('/delete-address', authMiddleware, deleteAddress);


module.exports = router;
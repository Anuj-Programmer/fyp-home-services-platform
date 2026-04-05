const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware'); 

const {
	changeTechnicianStatus,
	changeTechnicianCertificateStatus,
	changeHouseVerificationStatus,
	changeAddressVerificationStatus,
	getAllTechnicians,
	getAllUsers,
	deleteUserByAdmin,
	deleteTechnician,
	getAllBookings,
	getDashboardStats,
	broadcastNotificationToAll,
} = require('../controllers/adminCtrl');


// Technician account status
router.patch("/:technicianId/status", changeTechnicianStatus);

// Technician certificate status
//api/admin/technician/:technicianId/certificate-status
router.patch("/technician/:technicianId/certificate-status", authMiddleware, changeTechnicianCertificateStatus);

// User house certificate status
router.patch("/user/:userId/house-certificate-status", authMiddleware, changeHouseVerificationStatus);

// User address certificate status
router.patch("/user/:userId/address/:addressId/verification-status", authMiddleware, changeAddressVerificationStatus);

// Get all technicians /api/admin/technicians
router.get("/technicians", authMiddleware, getAllTechnicians);

// Get all users /api/admin/users
router.get("/users", authMiddleware, getAllUsers);

// Delete user /api/admin/users/:userId
router.delete("/users/:userId", authMiddleware, deleteUserByAdmin);

// Delete technician /api/admin/technicians/:technicianId
router.delete("/technicians/:technicianId", authMiddleware, deleteTechnician);

// Get all bookings
router.get("/bookings", authMiddleware, getAllBookings);

// Get dashboard statistics
router.get("/dashboard-stats", authMiddleware, getDashboardStats);

// Broadcast notification to all users and technicians
router.post('/broadcast-notification', authMiddleware, broadcastNotificationToAll);

module.exports = router;


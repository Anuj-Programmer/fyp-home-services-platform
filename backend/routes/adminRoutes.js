const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware'); 

const {
	changeTechnicianStatus,
	changeTechnicianCertificateStatus,
	changeHouseVerificationStatus,
	changeAddressVerificationStatus
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

module.exports = router;


const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const {registerTechnician, updateTechnicianProfile, getActiveTechnicians, getTechnicianById, searchTechnician, uploadTechnicianCertificate, allGetActiveTechnicians} = require('../controllers/technicianCtrl');

router.post("/registerTechnician", registerTechnician);

router.put("/update-technician-profile", authMiddleware, updateTechnicianProfile);

//api/technicians/get-active-technicians
router.get("/get-active-technicians", getActiveTechnicians);

router.get("/all-get-active-technicians", allGetActiveTechnicians);

router.get("/get-technician/:id", getTechnicianById);

router.get("/search-technician", authMiddleware, searchTechnician);

// Upload Technician Certificate || POST /api/technicians/upload-certificate
router.post("/upload-certificate", authMiddleware, uploadTechnicianCertificate);

module.exports = router;


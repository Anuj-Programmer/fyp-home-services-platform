const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const {registerTechnician, updateTechnicianProfile} = require('../controllers/technicianCtrl');

router.post("/registerTechnician", registerTechnician);

router.put("/update-technician-profile", authMiddleware, updateTechnicianProfile);

module.exports = router;


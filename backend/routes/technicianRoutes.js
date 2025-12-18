const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');

const {registerTechnician, updateTechnicianProfile, getActiveTechnicians, getTechnicianById} = require('../controllers/technicianCtrl');

router.post("/registerTechnician", registerTechnician);

router.put("/update-technician-profile", authMiddleware, updateTechnicianProfile);

//api/technicians/get-active-technicians
router.get("/get-active-technicians", getActiveTechnicians);

router.get("/get-technician/:id", getTechnicianById);

module.exports = router;


const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware'); 

const {changeTechnicianStatus} = require('../controllers/adminCtrl');

//api/admin/:technicianId/status
router.patch("/:technicianId/status", changeTechnicianStatus);

module.exports = router;


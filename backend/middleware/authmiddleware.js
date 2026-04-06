const JWT = require('jsonwebtoken');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');

module.exports = async (req, res, next) => {
    if (!req.body) req.body = {};

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Auth Failed",
        });
    }

    try {
        const decode = JWT.verify(token, process.env.JWT_SECRET);

        // For users/admins
        if (decode.userId) {
            const user = await User.findById(decode.userId).select("_id isAdmin");
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Account not found. Please log in again.",
                });
            }

            req.body.userId = String(user._id);
            req.body.isAdmin = Boolean(user.isAdmin);
        }

        // For technicians
        if (decode.technicianId) {
            const technician = await Technician.findById(decode.technicianId).select("_id");
            if (!technician) {
                return res.status(401).json({
                    success: false,
                    message: "Account not found. Please log in again.",
                });
            }

            req.body.technicianId = String(technician._id);
            req.body.isTechnician = true;
        }

        if (!decode.userId && !decode.technicianId) {
            return res.status(401).json({
                success: false,
                message: "Auth Failed",
            });
        }

        next();
    } catch (error) {
        if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Auth Failed",
            });
        }

        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

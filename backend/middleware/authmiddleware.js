const JWT = require('jsonwebtoken');

module.exports = async (req, res, next) => {

    if (!req.body) req.body = {};

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Auth Failed"
        });
    }

    try {
        JWT.verify(token, process.env.JWT_SECRET, (err, decode) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: "Auth Failed"
                });
            }

            // For users/admins
            if (decode.userId) {
                req.body.userId = decode.userId;
                req.body.isAdmin = decode.isAdmin || false;
            }

            // For technicians
            if (decode.technicianId) {
                req.body.technicianId = decode.technicianId;
                req.body.isTechnician = true;
            }

            next();
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

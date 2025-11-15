    const express = require('express');
    const router = express.Router();

    const { sendOtp, verifyOtp, sendLoginOtp, verifyLoginOtp, sendContactMessage } = require('../controllers/otpCtrl');   

    // Send OTP
    //Post /api/otp/send
    router.post('/send', sendOtp);

    // Verify OTP
    //Post /api/otp/verify
    router.post('/verify', verifyOtp);

    // Send Login OTP
    //Post /api/otp/login/send
    router.post('/login/send', sendLoginOtp);

    // Verify Login OTP & Issue JWT
    //Post /api/otp/login/verify
    router.post('/login/verify', verifyLoginOtp);

    // Contact Form
    //Post /api/otp/contact
    router.post('/contact', sendContactMessage);

    module.exports = router;
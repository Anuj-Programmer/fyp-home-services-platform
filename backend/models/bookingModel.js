const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    serviceDate: { type: Date, required: true },
    serviceTime: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'ontheway', 'inprogress', 'rescheduled','expired', 'declined'], default: 'pending' },
    fee: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    technicianInfo: {
      firstname: String,
      lastname: String,
      servicetype: String,
      experienceYears: Number,
      location: String,
      description: String,
      email: String,
      phone: String,
      isVerifiedTechnician: Boolean,
      highRated: Boolean
    },
    userInfo: {
        firstname: String,
        lastname: String,
        email: String,
        address: String,
        phone: String,
        landMark: String,
        isHouseVerified: Boolean,
    },
    note: { type: String },
    statusHistory: [
      {
        status: { type: String }, // cancelled, completed, rescheduled, etc
        note: { type: String }, // post-booking note / reason / description
        by: { type: String }, // 'user', 'technician', 'admin', 'system'
        date: { type: Date, default: Date.now },
      },
    ],
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    hasReview: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed'], default: 'unpaid' },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
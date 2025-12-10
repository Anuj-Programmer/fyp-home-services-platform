const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    serviceDate: { type: Date, required: true },
    serviceTime: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'ontheway', 'inprogress', 'rescheduled'], default: 'pending' },
    fee: { type: Number, required: true },
    technicianInfo: {
      firstname: String,
      lastname: String,
      servicetype: String,
      experienceYears: Number,
      location: String,
      description: String,
      email: String,
    },
    userInfo: {
        firstname: String,
        lastname: String,
        email: String,
    },
    // Review and rating for this booking
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now }
    },
    hasReview: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
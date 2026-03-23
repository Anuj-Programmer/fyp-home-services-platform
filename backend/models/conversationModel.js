const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    technician_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
      required: true,
      index: true,
    },
    booking_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ user_id: 1, technician_id: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);

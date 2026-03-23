const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Technician',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['khalti'],
      default: 'khalti',
      required: true,
    },
    currency: {
      type: String,
      default: 'NPR',
      required: true,
      uppercase: true,
      trim: true,
    },
    serviceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    technicianAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    adminAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountInPaisa: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['initiated', 'paid', 'failed'],
      default: 'initiated',
      index: true,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'transferred'],
      default: 'pending',
      index: true,
    },
    pidx: {
      type: String,
      index: true,
      sparse: true,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    khaltiStatus: {
      type: String,
      trim: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    payoutTransferredAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

paymentSchema.index({ booking: 1, createdAt: -1 });
paymentSchema.index({ pidx: 1, booking: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

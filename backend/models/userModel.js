const mongoose = require("mongoose");

// Optional detailed address schema for profile section
const detailedAddressSchema = new mongoose.Schema({
  street: { type: String },
  houseNumber: { type: String },
  ward: { type: String },
  colonyName: { type: String },
  buildingName: { type: String },
  district: { type: String },
  province: { type: String },
  country: { type: String, default: "Nepal" }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },

  // Contact info
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  isEmailVerified: { type: Boolean, default: false },

  // Simple address (required at signup)
  address: { type: String, required: true },

  // Optional detailed address (added later in profile)
  detailedAddress: detailedAddressSchema,

  // House verification
  houseDocuments: [{ type: String }], // uploaded proof
  isHouseVerified: { type: Boolean, default: false },
  houseCertificateUrl: { type: String }, // latest certificate upload
  houseCertificateStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  // Admin flag
  isAdmin: { type: Boolean, default: false },

  notification:{
    type: Array,
    default: []
  },
  seenNotifications:{
    type: Array,
    default: []
  }
}, { timestamps: true });

// Virtual for full name
userSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);

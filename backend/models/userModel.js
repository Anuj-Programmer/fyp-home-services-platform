const mongoose = require("mongoose");

// Optional detailed address schema for profile section (deprecated - kept for backward compatibility)
const detailedAddressSchema = new mongoose.Schema({
  landMark: { type: String },
  houseNumber: { type: String },
  ward: { type: String },
  colonyName: { type: String },
  buildingName: { type: String },
  district: { type: String },
  province: { type: String },
  country: { type: String, default: "Nepal" }
});

// Address Book Schema - multiple addresses with individual verification
const addressSchema = new mongoose.Schema({
  contactName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }, // Simple address line
  landMark: { type: String, required: true },
  addressType: { type: String, enum: ['home', 'office', 'other'], default: 'home' },
  
  // House verification per address
  isHouseVerified: { type: Boolean, default: false },
  houseCertificateUrl: { type: String },
  houseCertificateStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },

  // Contact info
  phone: { type: String, required: true, trim: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  isEmailVerified: { type: Boolean, default: false },

  // Simple address (required at signup) - deprecated, kept for backward compatibility
  address: { type: String, enum: ["lalitpur", "bhaktapur", "kathmandu"], required: true },

  // Optional detailed address (added later in profile) - deprecated
  detailedAddress: detailedAddressSchema,

  // NEW: Address Book - multiple addresses
  addressBook: [addressSchema],

  // House verification - deprecated (moved to individual addresses)
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

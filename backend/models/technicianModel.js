const mongoose = require("mongoose");

const TechnicianSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },

  lastName: {
    type: String,
    required: true
  },

   email: { type: String, unique: true, sparse: true },
   isEmailVerified: { type: Boolean, default: false },

  phone: {
    type: String,
    required: true,
    unique: true
  },

  location: {
    type: String,
    default: null
  },

  identityDocumentUrl: {
    type: String,
    //required: true 
    default: null
  },

  experienceYears: {
    type: Number,
    default: 0
  },

  serviceType: {
    type: String,
    required: true,
    enum: [
      "Plumbing",
      "Electrical",
      "Carpentry",
      "Appliance Repair",
      "Bathroom Remodeling",
      "Locksmith"
    ]
  },    

  certificateUrl: {
    type: String,
    default: null   // optional certificate
  },

  isVerifiedTechnician: {
    type: Boolean,
    default: false   // becomes true ONLY if certificate is provided
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected","active","inactive"],
    default: "pending"
  },
  availability: [
  {
    day: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] },
    startTime: { type: String }, // "09:00"
    endTime: { type: String },   // "18:00"
    slotDuration: { type: Number, default: 60 } // in minutes
  }
],
 reviews: [
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
  }
],
averageRating: { type: Number, default: 0 }
,
  notification: {
    type: Array,
    default: [] 
  },
  seenNotifications: {
    type: Array,
    default: []
  },
  fee: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ""
  },
  photoUrl: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-set verified status if certificate exists
TechnicianSchema.pre("save", function (next) {
  if (this.certificateUrl) {
    this.isVerifiedTechnician = true;
  }
  next();
});

module.exports = mongoose.model("Technician", TechnicianSchema);

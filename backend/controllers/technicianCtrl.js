
const OTP = require("../models/otpModel.js");
const User = require("../models/userModel.js");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Technician = require("../models/technicianModel.js")

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

const registerTechnician = async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        phone,
        identityDocumentUrl,
        experienceYears,
        serviceType,
        certificateUrl,
        email
      } = req.body;
      
      // Create technician entry
      const technician = new Technician({
        firstName,
        lastName,
        phone,
        email,
        isEmailVerified: true,
        identityDocumentUrl,
        experienceYears,
        serviceType,
        certificateUrl
      });
  
      await technician.save();
  
      // Find admin user
      const admin = await User.findOne({ isAdmin: true });
  
      if (!admin) {
        return res.status(500).json({
          success: false,
          message: "Technician registered, but no admin found."
        });
      }
  
      // Push minimal notification
      admin.notification.push({
        technicianId: technician._id,
        name: `${firstName} ${lastName}`,
        action: "approve_or_reject",
        createdAt: new Date()
      });
  
      await admin.save();
  
      return res.status(201).json({
        success: true,
        message: "Technician applied successfully. Waiting for admin approval."
      });
  
    } catch (error) {
      console.error("Error registering technician:", error);
      return res.status(500).json({
        success: false,
        message: "Server error during technician registration",
        error: error.message
      });
    }
  };

  const updateTechnicianProfile = async (req, res) => {
    try {
      const { technicianId, userId } = req.body;
      const id = userId || technicianId;

      if (!id) {
        return res.status(401).json({ message: "Unauthorized: No technician ID found" });
      }

      const {
        firstName,
        lastName,
        phone,
        experienceYears,
        availability,
        fee,
        location,
        photoUrl,
        description
      } = req.body;

      // Find technician
      const technician = await Technician.findById(id);
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }

      // Store previous status to track if it changes to active
      const previousStatus = technician.status;

      // Update allowed fields only
      if (firstName !== undefined) technician.firstName = firstName;
      if (lastName !== undefined) technician.lastName = lastName;
      if (phone !== undefined) technician.phone = phone;
      if (experienceYears !== undefined) technician.experienceYears = Number(experienceYears);
      if (fee !== undefined) technician.fee = Number(fee);
      if (location !== undefined) technician.location = location;
      if (photoUrl !== undefined) technician.photoUrl = photoUrl;
      if (description !== undefined) technician.description = description;
      
      // Update availability if provided
      if (availability) {
        // Convert availability object to array format for storage
        if (typeof availability === 'object' && !Array.isArray(availability)) {
          const availabilityArray = [];
          Object.keys(availability).forEach(day => {
            if (availability[day].isAvailable) {
              availabilityArray.push({
                day,
                startTime: availability[day].startTime,
                endTime: availability[day].endTime,
                slotDuration: 60 // default 60 minutes
              });
            }
          });
          technician.availability = availabilityArray;
        } else if (Array.isArray(availability)) {
          technician.availability = availability;
        }
      }

      // Helper to check for non-empty string
      const notEmpty = (val) => typeof val === 'string' ? val.trim().length > 0 : !!val;
      // Helper to check for valid number
      const validNumber = (val) => typeof val === 'number' && !isNaN(val) && val !== null && val !== undefined;

      const isProfileComplete = 
        notEmpty(technician.firstName) &&
        notEmpty(technician.lastName) &&
        notEmpty(technician.phone) &&
        validNumber(technician.experienceYears) && technician.experienceYears > 0 &&
        validNumber(technician.fee) && technician.fee > 0 &&
        notEmpty(technician.location) &&
        notEmpty(technician.photoUrl) &&
        notEmpty(technician.description) &&
        technician.availability &&
        Array.isArray(technician.availability) &&
        technician.availability.length > 0;


      // If profile is complete and status was not active before, set to active
      if (isProfileComplete) {
        if (previousStatus !== "active") {
          technician.status = "active";
          // Push notification about profile activation
          technician.notification.push({
            message: "🎉 Your profile setup is complete! Your technician account is now active.",
            createdAt: new Date(),
            type: "system"
          });
        }
      } else {
        // If any required field is missing, set status to inactive
        technician.status = "inactive";
      }

      // If status is 'approved', treat as 'inactive' for profile
      if (technician.status === "approved") {
        technician.status = "inactive";
      }

      await technician.save();

      res.json({
        message: "Technician profile updated successfully",
        technician,
        role: "technician"
      });

    } catch (error) {
      console.error("Error updating technician profile:", error);
      res.status(500).json({
        success: false,
        message: "Server error during technician profile update",
        error: error.message
      });
    }
  };

const getActiveTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.find({ status: "active" });
    res.json({ 
      success: true,
      technicians 
    });
  } catch (error) {
    console.error("Error fetching active technicians:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching active technicians",
      error: error.message
    });
  }
};

// Get technician by ID
const getTechnicianById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Technician ID is required" });
    }
    const technician = await Technician.findById(id);
    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician not found" });
    }
    res.json({ success: true, technician });
  } catch (error) {
    console.error("Error fetching technician by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching technician by ID",
      error: error.message
    });
  }
};

// Search technicians with filters, pagination, and sorting
const searchTechnician = async (req, res) => {
  try {
    const {
      serviceType,
      location,
      minRating,
      maxFee,
      availabilityDay,
      availabilityStartTime,
      availabilityEndTime,
      page = 1,
      pageSize = 10,
      sortBy,
      sortOrder = "desc"
    } = req.query;

    // Build dynamic filter object
    const filter = { status: "active" }; // Only search active technicians

    // Filter by serviceType (exact match)
    if (serviceType) {
      filter.serviceType = serviceType;
    }

    // Filter by location (case-insensitive partial match)
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // Filter by minimum average rating
    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (!isNaN(ratingValue)) {
        filter.averageRating = { $gte: ratingValue };
      }
    }

    // Filter by maximum fee
    if (maxFee) {
      const feeValue = parseFloat(maxFee);
      if (!isNaN(feeValue)) {
        filter.fee = { $lte: feeValue };
      }
    }

    // Filter by availability (day and optional time range)
    if (availabilityDay) {
      filter["availability.day"] = availabilityDay;

      // If both start and end times are provided, add time range filter
      if (availabilityStartTime && availabilityEndTime) {
        filter.$expr = {
          $anyElementTrue: {
            $map: {
              input: "$availability",
              as: "avail",
              in: {
                $and: [
                  { $eq: ["$$avail.day", availabilityDay] },
                  { $lte: ["$$avail.startTime", availabilityStartTime] },
                  { $gte: ["$$avail.endTime", availabilityEndTime] }
                ]
              }
            }
          }
        };
      }
    }

    // Calculate pagination
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const pageSizeNumber = Math.max(1, Math.min(100, parseInt(pageSize) || 10)); // Max 100 per page
    const skip = (pageNumber - 1) * pageSizeNumber;

    // Build sort object
    const sortObj = {};
    if (sortBy && ["averageRating", "fee"].includes(sortBy)) {
      sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      // Default sort by creation date (newest first)
      sortObj.createdAt = -1;
    }

    // Execute query with pagination and sorting
    const technicians = await Technician.find(filter)
      .select("firstName lastName serviceType location averageRating fee availability photoUrl description experienceYears isVerifiedTechnician")
      .sort(sortObj)
      .skip(skip)
      .limit(pageSizeNumber)
      .lean();

    // Get total count for pagination metadata
    const totalCount = await Technician.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSizeNumber);

    res.json({
      success: true,
      data: technicians,
      pagination: {
        currentPage: pageNumber,
        pageSize: pageSizeNumber,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error searching technicians:", error);
    res.status(500).json({
      success: false,
      message: "Server error searching technicians",
      error: error.message
    });
  }
};

module.exports = {
  registerTechnician,
  updateTechnicianProfile,
  getActiveTechnicians,
  getTechnicianById,
  searchTechnician
}
  
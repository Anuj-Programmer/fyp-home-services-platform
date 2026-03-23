require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Technician = require('./models/technicianModel');

const dummyTechnicians = [
  {
    firstName: "Anil",
    lastName: "Sharma",
    email: "anil.sharma@test.com",
    isEmailVerified: true,
    phone: "9841234567",
    location: "kathmandu",
    identityDocumentUrl: "https://dummy-doc.com/anil-sharma-id.pdf",
    experienceYears: 8,
    serviceType: "Plumbing",
    certificateUrl: "https://dummy-cert.com/anil-plumbing.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "18:00", slotDuration: 60 },
      { day: "Tuesday", startTime: "09:00", endTime: "18:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "09:00", endTime: "18:00", slotDuration: 60 },
      { day: "Friday", startTime: "10:00", endTime: "17:00", slotDuration: 60 }
    ],
    averageRating: 4.8,
    fee: 450,
    description: "Expert plumber with 8 years of experience in residential and commercial pipe installations.",
    photoUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Binita",
    lastName: "Singh",
    email: "binita.singh@test.com",
    isEmailVerified: true,
    phone: "9851234568",
    location: "pokhara",
    identityDocumentUrl: "https://dummy-doc.com/binita-singh-id.pdf",
    experienceYears: 6,
    serviceType: "Electrical",
    certificateUrl: "https://dummy-cert.com/binita-electrical.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Thursday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Saturday", startTime: "09:00", endTime: "16:00", slotDuration: 60 }
    ],
    averageRating: 4.6,
    fee: 500,
    description: "Skilled electrical technician specializing in home rewiring and circuit installations.",
    photoUrl: "https://randomuser.me/api/portraits/women/10.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Chandra",
    lastName: "Khatri",
    email: "chandra.khatri@test.com",
    isEmailVerified: true,
    phone: "9861234569",
    location: "chitwan",
    identityDocumentUrl: "https://dummy-doc.com/chandra-khatri-id.pdf",
    experienceYears: 10,
    serviceType: "Carpentry",
    certificateUrl: "https://dummy-cert.com/chandra-carpentry.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "07:00", endTime: "17:00", slotDuration: 60 },
      { day: "Thursday", startTime: "07:00", endTime: "17:00", slotDuration: 60 },
      { day: "Friday", startTime: "07:00", endTime: "17:00", slotDuration: 60 },
      { day: "Saturday", startTime: "08:00", endTime: "14:00", slotDuration: 60 }
    ],
    averageRating: 5.0,
    fee: 600,
    description: "Master carpenter with 10 years of experience in furniture making and wood repairs.",
    photoUrl: "https://randomuser.me/api/portraits/men/2.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Dipika",
    lastName: "Poudel",
    email: "dipika.poudel@test.com",
    isEmailVerified: true,
    phone: "9841234570",
    location: "kathmandu",
    identityDocumentUrl: "https://dummy-doc.com/dipika-poudel-id.pdf",
    experienceYears: 5,
    serviceType: "Appliance Repair",
    certificateUrl: null,
    certificateStatus: "pending",
    isVerifiedTechnician: false,
    status: "active",
    availability: [
      { day: "Monday", startTime: "10:00", endTime: "19:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "10:00", endTime: "19:00", slotDuration: 60 },
      { day: "Friday", startTime: "10:00", endTime: "19:00", slotDuration: 60 }
    ],
    averageRating: 4.3,
    fee: 350,
    description: "Experienced appliance technician for washing machines, refrigerators, and AC units.",
    photoUrl: "https://randomuser.me/api/portraits/women/2.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Gaurav",
    lastName: "Joshi",
    email: "gaurav.joshi@test.com",
    isEmailVerified: true,
    phone: "9851234571",
    location: "pokhara",
    identityDocumentUrl: "https://dummy-doc.com/gaurav-joshi-id.pdf",
    experienceYears: 7,
    serviceType: "Bathroom Remodeling",
    certificateUrl: "https://dummy-cert.com/gaurav-bathroom.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "09:00", endTime: "18:00", slotDuration: 60 },
      { day: "Thursday", startTime: "09:00", endTime: "18:00", slotDuration: 60 },
      { day: "Saturday", startTime: "10:00", endTime: "17:00", slotDuration: 60 }
    ],
    averageRating: 4.7,
    fee: 800,
    description: "Professional bathroom renovation specialist with expertise in tile and fixture installation.",
    photoUrl: "https://randomuser.me/api/portraits/men/3.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Hari",
    lastName: "Subedi",
    email: "hari.subedi@test.com",
    isEmailVerified: true,
    phone: "9861234572",
    location: "chitwan",
    identityDocumentUrl: "https://dummy-doc.com/hari-subedi-id.pdf",
    experienceYears: 4,
    serviceType: "Locksmith",
    certificateUrl: "https://dummy-cert.com/hari-locksmith.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "08:00", endTime: "20:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "08:00", endTime: "20:00", slotDuration: 60 },
      { day: "Friday", startTime: "08:00", endTime: "20:00", slotDuration: 60 },
      { day: "Saturday", startTime: "09:00", endTime: "18:00", slotDuration: 60 }
    ],
    averageRating: 4.5,
    fee: 400,
    description: "Certified locksmith offering 24/7 emergency lock and key services.",
    photoUrl: "https://randomuser.me/api/portraits/men/4.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Ishwari",
    lastName: "Niraula",
    email: "ishwari.niraula@test.com",
    isEmailVerified: true,
    phone: "9841234573",
    location: "kathmandu",
    identityDocumentUrl: "https://dummy-doc.com/ishwari-niraula-id.pdf",
    experienceYears: 3,
    serviceType: "Plumbing",
    certificateUrl: null,
    certificateStatus: "not_provided",
    isVerifiedTechnician: false,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "18:00", slotDuration: 60 },
      { day: "Thursday", startTime: "10:00", endTime: "18:00", slotDuration: 60 }
    ],
    averageRating: 3.8,
    fee: 350,
    description: "Plumbing trainee with hands-on experience in basic repairs and installations.",
    photoUrl: "https://randomuser.me/api/portraits/women/3.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Karan",
    lastName: "Magar",
    email: "karan.magar@test.com",
    isEmailVerified: true,
    phone: "9851234574",
    location: "pokhara",
    identityDocumentUrl: "https://dummy-doc.com/karan-magar-id.pdf",
    experienceYears: 6,
    serviceType: "Electrical",
    certificateUrl: "https://dummy-cert.com/karan-electrical.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "17:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "09:00", endTime: "17:00", slotDuration: 60 },
      { day: "Friday", startTime: "09:00", endTime: "17:00", slotDuration: 60 }
    ],
    averageRating: 4.4,
    fee: 480,
    description: "Reliable electrical technician proficient in fault diagnosis and power distribution.",
    photoUrl: "https://randomuser.me/api/portraits/men/5.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Lila",
    lastName: "Gurung",
    email: "lila.gurung@test.com",
    isEmailVerified: true,
    phone: "9861234575",
    location: "chitwan",
    identityDocumentUrl: "https://dummy-doc.com/lila-gurung-id.pdf",
    experienceYears: 9,
    serviceType: "Carpentry",
    certificateUrl: "https://dummy-cert.com/lila-carpentry.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Thursday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Saturday", startTime: "09:00", endTime: "15:00", slotDuration: 60 }
    ],
    averageRating: 4.9,
    fee: 700,
    description: "Expert carpenter specializing in custom woodwork and interior design layouts.",
    photoUrl: "https://randomuser.me/api/portraits/women/4.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Manoj",
    lastName: "Rai",
    email: "manoj.rai@test.com",
    isEmailVerified: true,
    phone: "9841234576",
    location: "kathmandu",
    identityDocumentUrl: "https://dummy-doc.com/manoj-rai-id.pdf",
    experienceYears: 5,
    serviceType: "Appliance Repair",
    certificateUrl: "https://dummy-cert.com/manoj-appliance.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "10:00", endTime: "18:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "10:00", endTime: "18:00", slotDuration: 60 },
      { day: "Friday", startTime: "10:00", endTime: "18:00", slotDuration: 60 },
      { day: "Sunday", startTime: "11:00", endTime: "16:00", slotDuration: 60 }
    ],
    averageRating: 4.5,
    fee: 420,
    description: "Expert in repairing kitchen appliances and microwave ovens with quick turnaround.",
    photoUrl: "https://randomuser.me/api/portraits/men/6.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Neha",
    lastName: "Thapa",
    email: "neha.thapa@test.com",
    isEmailVerified: true,
    phone: "9851234577",
    location: "pokhara",
    identityDocumentUrl: "https://dummy-doc.com/neha-thapa-id.pdf",
    experienceYears: 8,
    serviceType: "Bathroom Remodeling",
    certificateUrl: null,
    certificateStatus: "pending",
    isVerifiedTechnician: false,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "09:00", endTime: "17:00", slotDuration: 60 },
      { day: "Thursday", startTime: "09:00", endTime: "17:00", slotDuration: 60 },
      { day: "Saturday", startTime: "10:00", endTime: "16:00", slotDuration: 60 }
    ],
    averageRating: 4.5,
    fee: 750,
    description: "Bathroom remodeling specialist with creative design ideas and quality execution.",
    photoUrl: "https://randomuser.me/api/portraits/women/5.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Prakash",
    lastName: "Kosti",
    email: "prakash.kosti@test.com",
    isEmailVerified: true,
    phone: "9861234578",
    location: "chitwan",
    identityDocumentUrl: "https://dummy-doc.com/prakash-kosti-id.pdf",
    experienceYears: 2,
    serviceType: "Locksmith",
    certificateUrl: null,
    certificateStatus: "not_provided",
    isVerifiedTechnician: false,
    status: "active",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "19:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "09:00", endTime: "19:00", slotDuration: 60 },
      { day: "Friday", startTime: "09:00", endTime: "19:00", slotDuration: 60 }
    ],
    averageRating: 3.7,
    fee: 300,
    description: "Junior locksmith offering assistance with lock replacements and basic services.",
    photoUrl: "https://randomuser.me/api/portraits/men/7.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Riya",
    lastName: "Limbu",
    email: "riya.limbu@test.com",
    isEmailVerified: true,
    phone: "9841234579",
    location: "kathmandu",
    identityDocumentUrl: "https://dummy-doc.com/riya-limbu-id.pdf",
    experienceYears: 7,
    serviceType: "Plumbing",
    certificateUrl: "https://dummy-cert.com/riya-plumbing.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "08:00", endTime: "17:00", slotDuration: 60 },
      { day: "Friday", startTime: "08:00", endTime: "17:00", slotDuration: 60 }
    ],
    averageRating: 4.7,
    fee: 500,
    description: "Professional plumber specializing in drainage systems and water supply maintenance.",
    photoUrl: "https://randomuser.me/api/portraits/women/6.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Suresh",
    lastName: "Bhattarai",
    email: "suresh.bhattarai@test.com",
    isEmailVerified: true,
    phone: "9851234580",
    location: "pokhara",
    identityDocumentUrl: "https://dummy-doc.com/suresh-bhattarai-id.pdf",
    experienceYears: 4,
    serviceType: "Electrical",
    certificateUrl: null,
    certificateStatus: "rejected",
    isVerifiedTechnician: false,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "18:00", slotDuration: 60 },
      { day: "Thursday", startTime: "10:00", endTime: "18:00", slotDuration: 60 }
    ],
    averageRating: 3.9,
    fee: 380,
    description: "Electrical technician with experience in residential wiring and basic troubleshooting.",
    photoUrl: "https://randomuser.me/api/portraits/men/8.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Tara",
    lastName: "Sharma",
    email: "tara.sharma@test.com",
    isEmailVerified: true,
    phone: "9861234581",
    location: "chitwan",
    identityDocumentUrl: "https://dummy-doc.com/tara-sharma-id.pdf",
    experienceYears: 6,
    serviceType: "Carpentry",
    certificateUrl: "https://dummy-cert.com/tara-carpentry.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Monday", startTime: "07:00", endTime: "16:00", slotDuration: 60 },
      { day: "Wednesday", startTime: "07:00", endTime: "16:00", slotDuration: 60 },
      { day: "Friday", startTime: "07:00", endTime: "16:00", slotDuration: 60 },
      { day: "Sunday", startTime: "08:00", endTime: "14:00", slotDuration: 60 }
    ],
    averageRating: 4.6,
    fee: 550,
    description: "Talented carpenter with expertise in door and window installations.",
    photoUrl: "https://randomuser.me/api/portraits/women/7.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Vikram",
    lastName: "Devkota",
    email: "vikram.devkota@test.com",
    isEmailVerified: true,
    phone: "9841234582",
    location: "kathmandu",
    identityDocumentUrl: "https://dummy-doc.com/vikram-devkota-id.pdf",
    experienceYears: 9,
    serviceType: "Appliance Repair",
    certificateUrl: "https://dummy-cert.com/vikram-appliance.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "19:00", slotDuration: 60 },
      { day: "Thursday", startTime: "10:00", endTime: "19:00", slotDuration: 60 },
      { day: "Saturday", startTime: "11:00", endTime: "18:00", slotDuration: 60 },
      { day: "Sunday", startTime: "11:00", endTime: "17:00", slotDuration: 60 }
    ],
    averageRating: 4.8,
    fee: 650,
    description: "Senior appliance technician with 9 years experience in all major household appliances.",
    photoUrl: "https://randomuser.me/api/portraits/men/9.jpg",
    createdAt: new Date()
  },
  {
    firstName: "Yashin",
    lastName: "Tamang",
    email: "yashin.tamang@test.com",
    isEmailVerified: true,
    phone: "9851234583",
    location: "pokhara",
    identityDocumentUrl: "https://dummy-doc.com/yashin-tamang-id.pdf",
    experienceYears: 5,
    serviceType: "Bathroom Remodeling",
    certificateUrl: "https://dummy-cert.com/yashin-bathroom.pdf",
    certificateStatus: "approved",
    isVerifiedTechnician: true,
    status: "active",
    availability: [
      { day: "Wednesday", startTime: "09:00", endTime: "17:00", slotDuration: 60 },
      { day: "Friday", startTime: "09:00", endTime: "17:00", slotDuration: 60 },
      { day: "Saturday", startTime: "10:00", endTime: "17:00", slotDuration: 60 }
    ],
    averageRating: 4.4,
    fee: 700,
    description: "Bathroom remodeling expert with modern design aesthetics and quality tile work.",
    photoUrl: "https://randomuser.me/api/portraits/men/10.jpg",
    createdAt: new Date()
  }
];

// Seed function
const seedTechnicians = async () => {
  try {
    // Connect to MongoDB using .env configuration
    const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017/homeserviceapp';
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 Using URI:', mongoUri.substring(0, 50) + '...');
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing technicians (optional)
    // await Technician.deleteMany({});
    // console.log('Cleared existing technicians');
    
    // Insert dummy technicians
    const result = await Technician.insertMany(dummyTechnicians);
    console.log(`✅ Successfully seeded ${result.length} technicians`);
    
    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding technicians:', error);
    process.exit(1);
  }
};

// Run seed function
seedTechnicians();

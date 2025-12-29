import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import "../../css/landingPage.css";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function TechnicianProfile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [timeError, setTimeError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    experienceYears: "",
    fee: "",
    photoUrl: "",
    description: "",
  });

  const [availability, setAvailability] = useState({
    Monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    Saturday: { isAvailable: false, startTime: '10:00', endTime: '16:00' },
    Sunday: { isAvailable: false, startTime: '10:00', endTime: '16:00' },
  });

  const formatMemberSince = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const badgeData = [
    { label: "Completed jobs", value: "-" },
    { label: "Member since", value: formatMemberSince(user?.createdAt) },
    { label: "Rating", value: user?.averageRating ? `${user.averageRating}/5` : "—" },
  ];

  const hydrateFormFromUser = (data) => ({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    phone: data?.phone || "",
    location: data?.location || "",
    experienceYears: data?.experienceYears || "",
    fee: data?.fee || "",
    photoUrl: data?.photoUrl || "",
    description: data?.description || "",
  });

  const hydrateAvailabilityFromUser = (data) => {
    if (!data?.availability || !Array.isArray(data.availability)) {
      return {
        Monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
        Saturday: { isAvailable: false, startTime: '10:00', endTime: '16:00' },
        Sunday: { isAvailable: false, startTime: '10:00', endTime: '16:00' },
      };
    }

    const result = {};
    DAYS.forEach(day => {
      result[day] = { isAvailable: false, startTime: '09:00', endTime: '17:00' };
    });

    data.availability.forEach(slot => {
      if (result[slot.day]) {
        result[slot.day] = {
          isAvailable: true,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      }
    });

    return result;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData(hydrateFormFromUser(parsed));
      setAvailability(hydrateAvailabilityFromUser(parsed));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    // For number inputs, store as number immediately, or empty string if blank
    const finalValue = type === "number" ? (value === "" ? "" : Number(value)) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handlePhotoUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      const response = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        photoUrl: response.secure_url,
      }));
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Photo upload failed");
    }
  };

  const handleToggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable
      }
    }))
  };

  const handleTimeChange = (day, type, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }))
  };

  const openTimeModal = (day) => {
    setEditingDay(day);
    setShowTimeModal(true);
    setTimeError(""); // Clear error when opening modal
  };

  const closeTimeModal = () => {
    setShowTimeModal(false);
    setEditingDay(null);
    setTimeError("");
  };

  const validateTimeRange = (day) => {
    const { startTime, endTime } = availability[day];
    
    // Convert time strings to minutes for comparison
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    // Check if end time is after start time
    if (endTotalMin <= startTotalMin) {
      return "End time must be after start time.";
    }
    
    // Check if time range doesn't cross midnight or exceed 24 hours
    const durationMins = endTotalMin - startTotalMin;
    if (durationMins > 24 * 60) {
      return "Time range cannot exceed 24 hours.";
    }
    
    return ""; // No error
  };

  const handleTimeChangeWithValidation = (day, type, value) => {
    handleTimeChange(day, type, value);
    // Validate after state updates
    setTimeout(() => {
      const error = validateTimeRange(day);
      setTimeError(error);
    }, 0);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        experienceYears: formData.experienceYears === "" ? 0 : Number(formData.experienceYears),
        fee: formData.fee === "" ? 0 : Number(formData.fee),
        photoUrl: formData.photoUrl,
        description: formData.description,
        availability: availability,
      };

      // Include userId in payload so backend can identify the technician
      if (user?._id) {
        payload.userId = user._id;
      }

      const { data } = await axios.put(
        "/api/technicians/update-technician-profile",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const updatedTechnician = {
        ...data.technician,
        role: "technician" // Ensure role is preserved
      };

      // Check if status changed to active and show appropriate toast
      if (user?.status !== "active" && updatedTechnician.status === "active") {
        toast.success("🎉 Your profile setup is complete! Your account is now active!");
      } else {
        toast.success(data.message || "Profile saved successfully");
      }

      setUser(updatedTechnician);
      setFormData(hydrateFormFromUser(updatedTechnician));
      setAvailability(hydrateAvailabilityFromUser(updatedTechnician));
      localStorage.setItem("user", JSON.stringify(updatedTechnician));
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.message || "Unable to save profile right now";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploadingCertificate(true);
      const response = await uploadToCloudinary(file);

      // Send certificate URL to backend
      const { data } = await axios.post(
        "/api/technicians/upload-certificate",
        {
          technicianId: user._id,
          certificateUrl: response.secure_url,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success(data.message || "Certificate uploaded successfully");
      
      // Update user state with new certificate info
      const updatedUser = {
        ...user,
        certificateUrl: response.secure_url,
        certificateStatus: 'pending',
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setShowCertificateModal(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Certificate upload failed"
      );
    } finally {
      setUploadingCertificate(false);
    }
  };

  const getCertificateStatusText = () => {
    if (!user?.certificateUrl) return "Upload proof";
    if (user?.certificateStatus === "pending") return "Approval Pending";
    if (user?.certificateStatus === "approved") return "Approved";
    if (user?.certificateStatus === "rejected") return "Rejected - Re-upload";
    return "Upload proof";
  };

  const getCertificateStatusColor = () => {
    if (!user?.certificateUrl) return "bg-amber-100 text-amber-700";
    if (user?.certificateStatus === "pending") return "bg-blue-100 text-blue-700";
    if (user?.certificateStatus === "approved") return "bg-emerald-100 text-emerald-700";
    if (user?.certificateStatus === "rejected") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <main className="px-4 sm:px-6 lg:px-32 pt-20 sm:pt-24 pb-12 sm:pb-16 min-h-screen bg-stone-50 space-y-8 sm:space-y-12">
        <section className="flex flex-col lg:flex-row items-start justify-between gap-6 sm:gap-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Technician Profile
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Hi {formData.firstName || "there"}, update your professional details
            </h1>
            <p className="text-base text-stone-600 max-w-2xl">
              Keep your profile current with experience, rates, certifications,
              and availability to attract more customers and build your reputation.
            </p>
          </div>

          <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 w-full lg:w-auto">
            {badgeData.map((badge) => (
              <div
                key={badge.label}
                className="bg-white rounded-2xl shadow-sm border px-3 sm:px-4 py-2 sm:py-3 text-center"
              >
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  {badge.label}
                </p>
                <p className="text-lg font-semibold txt-color-primary">
                  {badge.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold txt-color-primary">
                Professional information
              </h2>
              <p className="text-sm text-stone-500">
                Update your experience, location, rates, certifications, and availability
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* Basic Information */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                    First name
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                    required
                  />
                </label>
                  <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                    Last name
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                    placeholder="+977-"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                  Location / Service area
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                    placeholder="e.g. Kathmandu, Bhaktapur"
                  />
                </label>
              </div>

              {/* Professional Details */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-lg font-semibold txt-color-primary">
                    Professional details
                  </h3>
                  <p className="text-sm text-stone-500">
                    Showcase your expertise and pricing
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                    Years of experience
                    <input
                      type="text"
                      inputMode="numeric"
                      name="experienceYears"
                      value={formData.experienceYears}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, experienceYears: e.target.value }));
                      }}
                      onBlur={(e) => {
                        const numVal = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                        setFormData(prev => ({ ...prev, experienceYears: numVal }));
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                      placeholder="e.g. 5"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                    Service fee (₹)
                    <input
                      type="text"
                      inputMode="numeric"
                      name="fee"
                      value={formData.fee}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, fee: e.target.value }));
                      }}
                      onBlur={(e) => {
                        const numVal = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                        setFormData(prev => ({ ...prev, fee: numVal }));
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                      placeholder="e.g. 500"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                  Profile photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                  {formData.photoUrl && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Photo uploaded: {formData.photoUrl.substring(0, 50)}...
                    </p>
                  )}
                </label>

                <label className="flex flex-col gap-1 text-xs sm:text-sm font-medium text-stone-600">
                  About you / Bio
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 resize-none"
                    placeholder="Tell customers about your experience, expertise, and what makes you unique..."
                    rows="4"
                  />
                </label>
              </div>

              {/* Availability Schedule */}
              <div className="space-y-3 sm:space-y-4 pt-4 border-t">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold txt-color-primary">
                    Your availability
                  </h3>
                  <p className="text-sm text-stone-500">
                    Set your working hours for each day of the week. Click on available days to set times.
                  </p>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      onClick={() => openTimeModal(day)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                        availability[day].isAvailable
                          ? 'bg-green-50 border-green-300 hover:border-green-400 hover:shadow-md'
                          : 'bg-gray-50 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <h4 className="font-bold text-sm text-stone-700">{day.substring(0, 3)}</h4>
                        <span className={`text-xs font-semibold ${
                          availability[day].isAvailable 
                            ? 'text-green-700' 
                            : 'text-gray-600'
                        }`}>
                          {availability[day].isAvailable ? 'Available' : 'Off'}
                        </span>
                        {availability[day].isAvailable && (
                          <span className="text-xs text-stone-500 mt-1">
                            {availability[day].startTime} - {availability[day].endTime}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(hydrateFormFromUser(user));
                      setAvailability(hydrateAvailabilityFromUser(user));
                    }}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-700 w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 sm:py-3 bg-color-main text-white rounded-lg sm:rounded-xl font-semibold btn-filled-slide w-full sm:w-auto"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
              <h3 className="text-lg font-semibold txt-color-primary">
                Account health
              </h3>
              <p className="text-sm text-stone-500">
                Keep your account verified to unlock premium features and boost
                visibility.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                {/* Account Status */}
                <div className="flex items-center justify-between">
                  <span>Account status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user?.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user?.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Email verification */}
                <div className="flex items-center justify-between">
                  <span>Email verification</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {user?.isEmailVerified ? "Verified" : "Pending"}
                  </span>
                </div>

                {/* Certificate verification */}
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Certificate verification</span>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${getCertificateStatusColor()}`}
                      onClick={() => {
                        if (user?.certificateStatus !== 'approved') {
                          setShowCertificateModal(true);
                        }
                      }}
                    >
                      {getCertificateStatusText()}
                    </button>
                  </div>

                  {user?.certificateStatus === 'pending' && (
                    <p className="text-xs text-blue-600">
                      Your certificate is under review. You can upload a new one to replace it.
                    </p>
                  )}

                  {user?.certificateStatus === 'rejected' && (
                    <p className="text-xs text-red-600">
                      Your certificate was rejected. Please upload a valid certificate.
                    </p>
                  )}

                  {!user?.certificateUrl && (
                    <p className="text-xs text-stone-500">
                      Upload a valid certificate to get verified and increase
                      customer trust.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border p-4 sm:p-5 space-y-3">
              <h3 className="text-base sm:text-lg font-semibold txt-color-primary">
                Service type
              </h3>
              <p className="text-sm text-stone-500">
                Your primary service category
              </p>
              <div className="px-4 py-3 bg-stone-50 rounded-xl text-sm font-medium txt-color-primary">
                {user?.serviceType || "Not specified"}
              </div>
            </div>

            <div className="bg-blue-50 rounded-3xl border border-blue-200 p-4 sm:p-5 space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900">
                💡 Pro tips
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Set competitive rates to attract more bookings</li>
                <li>• Update your location for accurate search results</li>
                <li>• Upload certifications to build customer trust</li>
                <li>• Keep your availability updated for better visibility</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Certificate Upload Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Upload Technician Certificate</h3>
            
            {user?.certificateStatus === 'pending' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Your certificate is currently under review. You can upload a new certificate if needed.
                </p>
              </div>
            )}

            {user?.certificateStatus === 'rejected' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Your previous certificate was rejected. Please upload a valid certificate.
                </p>
              </div>
            )}
            
            <div className="mb-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleCertificateUpload}
                disabled={uploadingCertificate}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {uploadingCertificate && (
              <p className="text-sm text-gray-600 mb-4">
                Uploading certificate...
              </p>
            )}

            <button
              onClick={() => setShowCertificateModal(false)}
              disabled={uploadingCertificate}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Time Setting Modal */}
      {showTimeModal && editingDay && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold txt-color-primary">
                {editingDay} Schedule
              </h3>
              <button
                type="button"
                onClick={closeTimeModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                <span className="font-medium text-stone-700">Available on this day</span>
                <button
                  type="button"
                  onClick={() => handleToggleDay(editingDay)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    availability[editingDay].isAvailable
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {availability[editingDay].isAvailable ? 'Available' : 'Off'}
                </button>
              </div>

              {/* Time Inputs */}
              {availability[editingDay].isAvailable && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={availability[editingDay].startTime}
                      onChange={(e) => handleTimeChangeWithValidation(editingDay, 'startTime', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={availability[editingDay].endTime}
                      onChange={(e) => handleTimeChangeWithValidation(editingDay, 'endTime', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Error Message */}
                  {timeError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 font-medium">
                        ⚠️ {timeError}
                      </p>
                    </div>
                  )}

                  {/* Success Message */}
                  {!timeError && availability[editingDay].isAvailable && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700">
                        ✓ Valid time range: {availability[editingDay].startTime} - {availability[editingDay].endTime}
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 Set realistic working hours to manage customer expectations
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeTimeModal}
                  className="flex-1 px-4 py-3 bg-stone-100 text-stone-700 rounded-xl font-semibold hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={closeTimeModal}
                  disabled={timeError ? true : false}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition ${
                    timeError
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-color-main text-white hover:bg-blue-700'
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TechnicianProfile;

     
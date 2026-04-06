import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const serviceOptions = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Appliance Repair",
  "Bathroom Remodeling",
  "Locksmith",
];

const locationOptions = ["chitwan", "pokhara", "kathmandu"];

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const normalizePhone = (value) => value.replace(/[\s-]/g, "").replace(/^\+977/, "");

const validateName = (label, value) => {
  const trimmed = value.trim();
  if (trimmed.length < 2) return `${label} must be at least 2 letters`;
  if (trimmed.length > 30) return `${label} must be at most 30 characters`;
  if (!/^[A-Za-z][A-Za-z' -]*$/.test(trimmed)) {
    return `${label} can only include letters, spaces, apostrophes, and hyphens`;
  }
  return "";
};

const validatePhone = (value) => {
  const normalized = normalizePhone(value);
  if (!/^\d{10}$/.test(normalized)) return "Phone number must be exactly 10 digits";
  if (!/^9/.test(normalized)) return "Phone number must start with 9";
  return "";
};

const validateUploadFile = (file, label) => {
  if (!file) return `${label} is required`;
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return "Only JPG, PNG, WebP, or PDF files are allowed";
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return "File size must be under 5MB";
  }
  return "";
};

const validateTechnicianRegistration = (data) => {
  const experience = Number(data.experienceYears);
  const errors = {
    firstName: validateName("First name", data.firstName),
    lastName: validateName("Last name", data.lastName),
    phone: validatePhone(data.phone),
    location: locationOptions.includes(data.location) ? "" : "Please select a valid location",
    serviceType: serviceOptions.includes(data.serviceType) ? "" : "Please select a valid service type",
    experienceYears:
      Number.isInteger(experience) && experience >= 0 && experience <= 50
        ? ""
        : "Experience must be a whole number between 0 and 50 years",
    identityDocumentUrl: data.identityDocumentUrl
      ? ""
      : "Identity document is required",
  };

  return {
    errors,
    isValid: Object.values(errors).every((error) => !error),
  };
};

function TechnicianRegisterInfo() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: locationOptions[0],
    identityDocumentUrl: "",
    experienceYears: "",
    serviceType: serviceOptions[0],
    certificateUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    serviceType: "",
    experienceYears: "",
    identityDocumentUrl: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("technicianEmail");
    const otpVerified = localStorage.getItem("technicianOtpVerified");

    if (!storedEmail || otpVerified !== "true") {
      toast.error("Please verify your email before continuing.");
      navigate("/register-technician");
      return;
    }

    setEmail(storedEmail);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any upload is in progress
    if (uploadingIdentity || uploadingCertificate) {
      toast.error("Please wait for all uploads to complete before submitting.");
      return;
    }


    const { errors: formErrors, isValid } = validateTechnicianRegistration(formData);
    setErrors(formErrors);
    if (!isValid) {
      const firstError = Object.values(formErrors).find(Boolean);
      toast.error(firstError || "Please correct the form fields");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/technicians/registerTechnician", {
        email,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: normalizePhone(formData.phone),
        location: formData.location,
        identityDocumentUrl: formData.identityDocumentUrl,
        experienceYears: Number(formData.experienceYears),
        serviceType: formData.serviceType,
        certificateUrl: formData.certificateUrl || null,
      });

      toast.success(
        data.message || "Application submitted. Admin will review."
      );
      localStorage.removeItem("technicianEmail");
      localStorage.removeItem("technicianOtpVerified");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Server error while submitting application."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIdentityUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const uploadError = validateUploadFile(file, "Identity document");
      if (uploadError) {
        toast.error(uploadError);
        return;
      }
      
      setUploadingIdentity(true);
      const response = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        identityDocumentUrl: response.secure_url,
      }));
      setErrors((prev) => ({ ...prev, identityDocumentUrl: "" }));
      toast.success("Identity document uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Identity document upload failed");
    } finally {
      setUploadingIdentity(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const uploadError = validateUploadFile(file, "Certificate");
      if (uploadError) {
        toast.error(uploadError);
        return;
      }
      
      setUploadingCertificate(true);
      const response = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, certificateUrl: response.secure_url }));
      toast.success("Certificate uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Certificate upload failed");
    } finally {
      setUploadingCertificate(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold txt-color-primary mb-6 text-center">
            Technician Application
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    firstName: validateName("First name", formData.firstName),
                  }))
                }
                placeholder="Enter first name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={2}
                maxLength={30}
                required
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    lastName: validateName("Last name", formData.lastName),
                  }))
                }
                placeholder="Enter last name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={2}
                maxLength={30}
                required
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    phone: validatePhone(formData.phone),
                  }))
                }
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    location: locationOptions.includes(formData.location)
                      ? ""
                      : "Please select a valid location",
                  }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p className="mt-1 text-xs text-red-600">{errors.location}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Service Type</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    serviceType: serviceOptions.includes(formData.serviceType)
                      ? ""
                      : "Please select a valid service type",
                  }))
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.serviceType && (
                <p className="mt-1 text-xs text-red-600">{errors.serviceType}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-1">
                Experience Years
              </label>
              <input
                name="experienceYears"
                type="number"
                min="0"
                max="50"
                step="1"
                value={formData.experienceYears}
                onChange={handleChange}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    experienceYears:
                      Number.isInteger(Number(formData.experienceYears)) &&
                      Number(formData.experienceYears) >= 0 &&
                      Number(formData.experienceYears) <= 50
                        ? ""
                        : "Experience must be a whole number between 0 and 50 years",
                  }))
                }
                placeholder="e.g., 3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {errors.experienceYears && (
                <p className="mt-1 text-xs text-red-600">{errors.experienceYears}</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-1">
                Identity Document
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleIdentityUpload}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.identityDocumentUrl && (
                <p className="text-sm text-green-600 mt-1">
                  Uploaded: Document
                </p>
              )}
              {errors.identityDocumentUrl && (
                <p className="mt-1 text-xs text-red-600">{errors.identityDocumentUrl}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 mb-1">
                Certificate (optional)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCertificateUpload}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.certificateUrl && (
                <p className="text-sm text-green-600 mt-1">
                  Uploaded: Certificate
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`w-full bg-color-main hover:txt-color-hover text-white btn-filled-slide font-semibold py-2 px-4 rounded-lg transition ${
                loading || uploadingIdentity || uploadingCertificate ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading || uploadingIdentity || uploadingCertificate}
            >
              {uploadingIdentity || uploadingCertificate
                ? "Uploading…"
                : loading
                ? "Submitting..."
                : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default TechnicianRegisterInfo;

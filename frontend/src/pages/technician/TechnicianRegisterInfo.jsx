import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any upload is in progress
    if (uploadingIdentity || uploadingCertificate) {
      toast.error("Please wait for all uploads to complete before submitting.");
      return;
    }


    const {
      firstName,
      lastName,
      phone,
      location,
      identityDocumentUrl,
      experienceYears,
      serviceType,
      certificateUrl,
    } = formData;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !location ||
      !identityDocumentUrl ||
      experienceYears === "" ||
      !serviceType
    ) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/technicians/registerTechnician", {
        email,
        firstName,
        lastName,
        phone,
        location,
        identityDocumentUrl,
        experienceYears: Number(experienceYears),
        serviceType,
        certificateUrl: certificateUrl || null,
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
      
      setUploadingIdentity(true);
      const response = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        identityDocumentUrl: response.secure_url,
      }));
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
      <Toaster position="top-center" reverseOrder={false} />
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
                placeholder="Enter first name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Phone Number</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {locationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Service Type</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {serviceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">
                Experience Years
              </label>
              <input
                name="experienceYears"
                type="number"
                min="0"
                value={formData.experienceYears}
                onChange={handleChange}
                placeholder="e.g., 3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

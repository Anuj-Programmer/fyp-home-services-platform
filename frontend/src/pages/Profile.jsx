import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import "../css/landingPage.css";
import Cookies from "js-cookie";
import { useUser } from "../context/UserContext";
import {
  Trash,
  PencilSimple,
  Plus,
  MapPin,
  DotsThreeVertical,
} from "phosphor-react";

function Profile() {
  const [saving, setSaving] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressMenuOpen, setAddressMenuOpen] = useState(null);
  const [uploadingAddressCertificate, setUploadingAddressCertificate] =
    useState(false);
  const [tempAddressCertificateUrl, setTempAddressCertificateUrl] =
    useState("");
  const [addressCertificateUploadError, setAddressCertificateUploadError] =
    useState("");
  const [addressFormData, setAddressFormData] = useState({
    contactName: "",
    phone: "",
    address: "",
    landMark: "",
    addressType: "home",
    houseCertificateUrl: "",
    houseCertificateStatus: "not_provided",
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const token = Cookies.get("token") || localStorage.getItem("token");
  const { user, setUserData, refreshUser } = useUser();

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
    { label: "Completed bookings", value: "-" },
    { label: "Member since", value: formatMemberSince(user?.createdAt) },
  ];

  const hydrateFormFromUser = (data) => ({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    phone: data?.phone || "",
    address: data?.address || "",
    role: data?.role || "user",
  });

  useEffect(() => {
    if (user) {
      setFormData(hydrateFormFromUser(user));
    }
  }, [user]);

  // After loading user from localStorage
  const role = user?.role || "user";
  const showAddressBook = role === "user";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await axios.put(
        "/api/users/update-profile",
        {
          userId: user?._id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

  setUserData(response.data.user);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setTempAddressCertificateUrl("");
    setAddressCertificateUploadError("");
    setAddressFormData({
      contactName: `${formData.firstName} ${formData.lastName}`,
      phone: formData.phone || "",
      address: "",
      landMark: "",
      addressType: "home",
      houseCertificateUrl: "",
      houseCertificateStatus: "not_provided",
    });
    setShowAddressModal(true);
  };

  const openEditAddressModal = async (address) => {
    let sourceAddress = address;

    // Pull latest user data so status in modal reflects current DB value.
    try {
      const latestUser = await refreshUser();
      const latestMatch = latestUser?.addressBook?.find(
        (item) => item._id === address._id
      );
      if (latestMatch) {
        sourceAddress = latestMatch;
      }
    } catch (error) {
      console.error("Failed to refresh latest address status", error);
    }

    setEditingAddress(sourceAddress);
    setTempAddressCertificateUrl("");
    setAddressCertificateUploadError("");
    setAddressFormData({
      contactName: sourceAddress.contactName || "",
      phone: sourceAddress.phone || "",
      address: sourceAddress.address || "",
      landMark: sourceAddress.landMark || "",
      addressType: sourceAddress.addressType || "home",
      houseCertificateUrl: sourceAddress.houseCertificateUrl || "",
      houseCertificateStatus:
        sourceAddress.houseCertificateStatus || "not_provided",
    });
    setAddressMenuOpen(null);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    try {
      const dataToSave = { ...addressFormData };
      if (tempAddressCertificateUrl) {
        dataToSave.houseCertificateUrl = tempAddressCertificateUrl;
        dataToSave.houseCertificateStatus = "pending";
      }

      if (editingAddress) {
        // Update existing address
        const response = await axios.put(
          "/api/users/update-address",
          {
            userId: user._id,
            addressId: editingAddress._id,
            updates: dataToSave,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserData(response.data.user);
        toast.success("Address updated successfully!");
      } else {
        // Add new address
        const response = await axios.post(
          "/api/users/add-address",
          {
            userId: user._id,
            address: dataToSave,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserData(response.data.user);
        toast.success("Address added successfully!");
      }
      setShowAddressModal(false);
      setTempAddressCertificateUrl("");
      setAddressCertificateUploadError("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save address");
    }
  };

  const validateAddressCertificateFile = (file) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!file) {
      return "Please select a file";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 5MB";
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, WebP, or PDF files are allowed";
    }
    return "";
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await axios.delete("/api/users/delete-address", {
        data: {
          userId: user._id,
          addressId: addressId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(response.data.user);
      toast.success("Address deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete address");
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
        "/api/users/upload-certificate",
        {
          userId: user._id,
          certificateUrl: response.secure_url,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(data.message || "Certificate uploaded successfully");

      // Update user state with new certificate info
      const updatedUser = {
        ...user,
        houseCertificateUrl: response.secure_url,
        houseCertificateStatus: "pending",
      };
      setUserData(updatedUser);

      setShowCertificateModal(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Certificate upload failed");
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleAddressCertificateUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setAddressCertificateUploadError("");
      const validationError = validateAddressCertificateFile(file);
      if (validationError) {
        setAddressCertificateUploadError(validationError);
        e.target.value = "";
        return;
      }

      setUploadingAddressCertificate(true);
      const response = await uploadToCloudinary(file);

      // Keep uploaded certificate temporary; persist only on Add/Update Address
      setTempAddressCertificateUrl(response.secure_url);
      toast.success("Certificate uploaded. Click Add/Update Address to save.");
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.message ||
        (error.code === "ERR_NETWORK"
          ? "Network error while uploading certificate"
          : "Certificate upload failed");
      setAddressCertificateUploadError(message);
      toast.error(message);
    } finally {
      setUploadingAddressCertificate(false);
    }
  };

  const getCertificateStatusText = () => {
    if (!user?.houseCertificateUrl) return "Upload proof";
    if (user?.houseCertificateStatus === "pending") return "Approval Pending";
    if (user?.houseCertificateStatus === "approved") return "Approved";
    if (user?.houseCertificateStatus === "rejected")
      return "Rejected - Re-upload";
    return "Upload proof";
  };

  const getCertificateStatusColor = () => {
    if (!user?.houseCertificateUrl) return "bg-amber-100 text-amber-700";
    if (user?.houseCertificateStatus === "pending")
      return "bg-blue-100 text-blue-700";
    if (user?.houseCertificateStatus === "approved")
      return "bg-emerald-100 text-emerald-700";
    if (user?.houseCertificateStatus === "rejected")
      return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <>
      <Navbar />
      <main className="px-6 lg:px-32 pt-16 pb-16 min-h-screen bg-stone-50 space-y-12">
        <section className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
              Profile & preferences
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
              Hi {formData.firstName || "there"}, keep your details current
            </h1>
            <p className="text-base text-stone-600 max-w-2xl">
              Accurate contact information and service preferences help us match
              you with the right technicians, right on schedule.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {badgeData.map((badge) => (
              <div
                key={badge.label}
                className="bg-white rounded-2xl shadow-sm border px-4 py-3 text-center"
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

        <section className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold txt-color-primary">
                Personal information
              </h2>
              <p className="text-sm text-stone-500">
                Update your name, contact and communication preferences
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                  First name
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                  Last name
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                  Phone number
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                    placeholder="+977-"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                  Location
                  <select
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                    required
                  >
                    <option value="">Select Location</option>
                    <option value="chitwan">Chitwan</option>
                    <option value="pokhara">Pokhara</option>
                    <option value="kathmandu">Kathmandu Valley</option>
                  </select>
                  <p className="text-xs text-stone-500">
                    Switch cities to view technicians from nearby areas.
                  </p>
                </label>
              </div>

              <div className="flex items-center justify-end gap-4">
                {user && (
                  <button
                    type="button"
                    onClick={() => setFormData(hydrateFormFromUser(user))}
                    className="px-5 py-2 text-sm font-semibold text-stone-500 hover:text-stone-700"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-3 bg-color-main text-white rounded-xl font-semibold btn-filled-slide"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-3">
              <h3 className="text-lg font-semibold txt-color-primary">
                Account health
              </h3>
              <p className="text-sm text-stone-500">
                Keep your account verified to unlock express support and loyalty
                rewards.
              </p>
              <div className="flex flex-col gap-3 text-sm">
                {/* Email verification (always shown) */}
                <div className="flex items-center justify-between">
                  <span>Email verification</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    {user?.isEmailVerified ? "Verified" : "Pending"}
                  </span>
                </div>

                {/* Conditional: House verification for users only */}
                {/* {user?.role === "user" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span>House verification</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${getCertificateStatusColor()}`}
                        onClick={() => {
                          // Allow upload if no certificate or if rejected
                          if (!user?.houseCertificateUrl || user?.houseCertificateStatus === 'rejected' || user?.houseCertificateStatus === 'pending') {
                            setShowCertificateModal(true);
                          }
                        }}
                      >
                        {getCertificateStatusText()}
                      </span>
                    </div>
                  </>
                )} */}
              </div>
            </div>

            {/* <div className="bg-white rounded-3xl shadow-sm border p-5 space-y-4">
              <h3 className="text-lg font-semibold txt-color-primary">
                Saved notes
              </h3>
              <p className="text-sm text-stone-500">
                Let technicians know about pets, parking, or special requests.
              </p>
              <textarea
                rows={4}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                placeholder="Example: Please call before arriving. Elevator key at reception."
              />
              <button className="text-sm font-semibold text-color-main hover:underline">
                Save note
              </button>
            </div> */}
          </div>
        </section>

        {/* Address Book Section */}
        {user && showAddressBook && (
          <section className="grid lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2 border p-6 rounded-3xl shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-xl font-semibold txt-color-primary flex items-center gap-2">
                    <MapPin
                      size={18}
                      weight="fill"
                      className="text-color-main"
                    />
                    <span className="text-sm sm:text-xl">Address Book</span>
                  </h2>
                  <p className="text-[10px] sm:text-sm text-stone-500 mt-1">
                    Manage your saved addresses for faster booking
                  </p>
                </div>
                <button
                  onClick={openAddAddressModal}
                  className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 bg-color-main text-white rounded-xl font-semibold btn-filled-slide hover:bg-blue-700 text-xs sm:text-base"
                >
                  <Plus size={16} weight="bold" />
                  Add Address
                </button>
              </div>

              {/* Address List */}
              <div className="grid gap-4 sm:grid-cols-2">
                {user.addressBook && user.addressBook.length > 0 ? (
                  user.addressBook.map((address) => (
                    <div
                      key={address._id}
                      className="border border-gray-200 rounded-xl p-3 sm:p-4 space-y-2 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <h3 className="font-semibold text-gray-800 text-xs sm:text-base">
                              {address.contactName}
                            </h3>
                            <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                              {address.addressType}
                            </span>
                            {/* Certificate badge */}
                            {address.houseCertificateStatus === "approved" ? (
                              <span className="ml-auto text-[10px] sm:text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                Verified
                              </span>
                            ) : (
                              <span className="ml-auto text-[10px] sm:text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                                Not Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {address.address}
                          </p>
                          {address.landMark && (
                            <p className="text-xs sm:text-sm text-gray-600">
                              Landmark: {address.landMark}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-600">
                            {address.phone}
                          </p>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setAddressMenuOpen(
                                addressMenuOpen === address._id
                                  ? null
                                  : address._id
                              )
                            }
                            className="p-1 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            title="More options"
                          >
                            <DotsThreeVertical
                              size={16}
                              sm:size={20}
                              weight="bold"
                            />
                          </button>
                          {addressMenuOpen === address._id && (
                            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                              <button
                                onClick={() => openEditAddressModal(address)}
                                className="w-full text-left px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                              >
                                <PencilSimple size={12} sm:size={16} />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address._id)}
                                className="w-full text-left px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2 border-t border-gray-200"
                              >
                                <Trash size={12} sm:size={16} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 sm:py-12 bg-gray-50 rounded-xl">
                    <MapPin
                      size={32}
                      sm:size={48}
                      className="mx-auto text-gray-300 mb-2 sm:mb-3"
                    />
                    <p className="text-xs sm:text-gray-500 mb-2 sm:mb-4">
                      No addresses saved yet
                    </p>
                    <button
                      onClick={openAddAddressModal}
                      className="px-4 py-1 sm:px-6 sm:py-2 bg-color-main text-white rounded-xl font-semibold btn-filled-slide text-xs sm:text-base"
                    >
                      Add Your First Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />

      {/* Certificate Upload Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold txt-color-primary">
                Upload House Certificate
              </h3>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-2xl"
                disabled={uploadingCertificate}
              >
                ×
              </button>
            </div>

            <p className="text-sm text-stone-600">
              Please upload a document that verifies your house ownership or
              residency (e.g., utility bill, property deed, rental agreement).
            </p>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-stone-600 mb-2 block">
                  Select Certificate File
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleCertificateUpload}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploadingCertificate}
                />
              </label>

              {uploadingCertificate && (
                <p className="text-sm text-blue-600 text-center">
                  Uploading certificate...
                </p>
              )}

              {user?.houseCertificateStatus === "pending" && (
                <p className="text-sm text-blue-600">
                  Your previous certificate is pending approval. You can upload
                  a new one to replace it.
                </p>
              )}

              {user?.houseCertificateStatus === "rejected" && (
                <p className="text-sm text-red-600">
                  Your previous certificate was rejected. Please upload a new
                  one.
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-800"
                disabled={uploadingCertificate}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold txt-color-primary">
                {editingAddress ? "Edit Address" : "Add Address"}
              </h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-stone-400 hover:text-stone-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                Contact Name
                <input
                  type="text"
                  name="contactName"
                  value={addressFormData.contactName}
                  onChange={handleAddressInputChange}
                  className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                Phone Number
                <input
                  type="tel"
                  name="phone"
                  value={addressFormData.phone}
                  onChange={handleAddressInputChange}
                  className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                Address
                <input
                  type="text"
                  name="address"
                  value={addressFormData.address}
                  onChange={handleAddressInputChange}
                  className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                  placeholder="e.g., Lazimpat, Kathmandu"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                Landmark
                <input
                  type="text"
                  name="landMark"
                  value={addressFormData.landMark}
                  onChange={handleAddressInputChange}
                  className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                  placeholder="e.g., Near City Mall"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                Address Type
                <select
                  name="addressType"
                  value={addressFormData.addressType}
                  onChange={handleAddressInputChange}
                  className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <div className="border-t pt-4 mt-4">
                <label className="flex flex-col gap-2 text-sm font-medium text-stone-600">
                  <span>House Certificate (Optional)</span>
                  <div className="space-y-3">
                    {addressFormData.houseCertificateUrl && !tempAddressCertificateUrl && (
                      <div
                        className={`p-3 rounded-lg border ${
                          addressFormData.houseCertificateStatus === "rejected"
                            ? "bg-red-50 border-red-200"
                            : addressFormData.houseCertificateStatus === "pending"
                              ? "bg-yellow-50 border-yellow-200"
                              : addressFormData.houseCertificateStatus === "approved"
                                ? "bg-green-50 border-green-200"
                                : "bg-stone-50 border-stone-200"
                        }`}
                      >
                        <p
                          className={`text-xs font-semibold mb-2 ${
                            addressFormData.houseCertificateStatus === "rejected"
                              ? "text-red-700"
                              : addressFormData.houseCertificateStatus === "pending"
                                ? "text-yellow-700"
                                : addressFormData.houseCertificateStatus === "approved"
                                  ? "text-green-700"
                                  : "text-stone-700"
                          }`}
                        >
                          Certificate Uploaded
                        </p>
                        <p
                          className={`text-xs ${
                            addressFormData.houseCertificateStatus === "rejected"
                              ? "text-red-600"
                              : addressFormData.houseCertificateStatus === "pending"
                                ? "text-yellow-600"
                                : addressFormData.houseCertificateStatus === "approved"
                                  ? "text-green-600"
                                  : "text-stone-600"
                          }`}
                        >
                          Status: {addressFormData.houseCertificateStatus}
                        </p>
                      </div>
                    )}
                    {tempAddressCertificateUrl && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">
                          Certificate uploaded (not saved yet)
                        </p>
                        <p className="text-xs text-yellow-600">
                          Click Add/Update Address to apply pending status.
                        </p>
                      </div>
                    )}
                    {addressCertificateUploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-700">
                          {addressCertificateUploadError}
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleAddressCertificateUpload}
                      disabled={uploadingAddressCertificate}
                      className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900 cursor-pointer"
                    />
                    {uploadingAddressCertificate && (
                      <p className="text-xs text-blue-600">
                        Uploading certificate...
                      </p>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddressModal(false);
                    setTempAddressCertificateUrl("");
                    setAddressCertificateUploadError("");
                  }}
                  className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-800"
                  disabled={uploadingAddressCertificate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingAddressCertificate}
                  className="px-6 py-3 bg-color-main text-white rounded-xl font-semibold btn-filled-slide"
                >
                  {uploadingAddressCertificate
                    ? "Uploading..."
                    : editingAddress
                      ? "Update Address"
                      : "Add Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;

import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Footer from "@/blocks/Footer";
import "../css/landingPage.css";

function Profile() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    detailedAddress: {
      houseNumber: "",
      street: "",
      ward: "",
      district: "",
      province: "",
      country: "Nepal",
    },
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
    { label: "Completed bookings", value: "-" },
    { label: "Member since", value: formatMemberSince(user?.createdAt) },
    { label: "Loyalty tier", value: "-" },
  ];

  const hydrateFormFromUser = (data) => ({
    firstName: data?.firstName || "",
    lastName: data?.lastName || "",
    phone: data?.phone || "",
    address: data?.role === "user" ? data?.address || "" : "",
    detailedAddress:
      data?.role === "user"
        ? {
            houseNumber: data?.detailedAddress?.houseNumber || "",
            street: data?.detailedAddress?.street || "",
            ward: data?.detailedAddress?.ward || "",
            district: data?.detailedAddress?.district || "",
            province: data?.detailedAddress?.province || "",
            country: data?.detailedAddress?.country || "Nepal",
          }
        : {
            houseNumber: "",
            street: "",
            ward: "",
            district: "",
            province: "",
            country: "Nepal",
          },
    role: data?.role || "user",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFormData(hydrateFormFromUser(parsed));
    }
  }, []);

  // After loading user from localStorage
  const role = user?.role || "user"; // <-- add here
  const showDetailedAddress = role === "user"; // <-- add here

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailedChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      detailedAddress: {
        ...prev.detailedAddress,
        [name]: value,
      },
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      // Include userId in payload so backend can identify the user
      if (user?._id) {
        payload.userId = user._id;
      }

      if (showDetailedAddress) {
        payload.address = formData.address;
        payload.detailedAddress = formData.detailedAddress;
      }

      // Only send address info for normal users
      if (user?.role === "user") {
        payload.address = formData.address;
        payload.detailedAddress = formData.detailedAddress;
      }

      const { data } = await axios.put("/api/users/update-profile", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success(data.message || "Profile saved successfully");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.message || "Unable to save profile right now";
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <main className="px-6 lg:px-32 pt-24 pb-16 min-h-screen bg-stone-50 space-y-12">
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

          <div className="grid gap-3 sm:grid-cols-3">
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
              </div>

              {user && showDetailedAddress && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold txt-color-primary">
                      Primary service location
                    </h3>
                    <p className="text-sm text-stone-500">
                      Save your default address to speed up bookings
                    </p>
                  </div>

                  <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                    Address line
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      placeholder="e.g. Lazimpat, Kathmandu"
                      required
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                      House / apartment
                      <input
                        type="text"
                        name="houseNumber"
                        value={formData.detailedAddress.houseNumber}
                        onChange={handleDetailedChange}
                        className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                      Street
                      <input
                        type="text"
                        name="street"
                        value={formData.detailedAddress.street}
                        onChange={handleDetailedChange}
                        className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                      Ward
                      <input
                        type="text"
                        name="ward"
                        value={formData.detailedAddress.ward}
                        onChange={handleDetailedChange}
                        className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                      District
                      <input
                        type="text"
                        name="district"
                        value={formData.detailedAddress.district}
                        onChange={handleDetailedChange}
                        className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                      Province
                      <input
                        type="text"
                        name="province"
                        value={formData.detailedAddress.province}
                        onChange={handleDetailedChange}
                        className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                    Country
                    <input
                      type="text"
                      name="country"
                      value={formData.detailedAddress.country}
                      onChange={handleDetailedChange}
                      className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                    />
                  </label>
                </div>
              )}

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
                {user?.role === "user" && (
                  <div className="flex items-center justify-between">
                    <span>House verification</span>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                      {user?.isHouseVerified ? "Submitted" : "Upload proof"}
                    </span>
                  </div>
                )}

                {/* Conditional: Certificate verification for technicians only */}
                {user?.role === "technician" && (
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Certificate verification</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user?.isVerifiedTechnician
                            ? "bg-emerald-100 text-emerald-700" // verified
                            : "bg-amber-100 text-amber-700" // not verified
                        }`}
                      >
                        {user?.isVerifiedTechnician
                          ? "Verified"
                          : "Not verified"}
                      </span>
                    </div>

                    {/* Upload certificate button only if not verified */}
                    {!user?.isVerifiedTechnician && (
                      <button className="text-color-main font-semibold text-left hover:underline">
                        Upload certificate
                      </button>
                    )}
                  </div>
                )}
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
      </main>
      <Footer />
    </>
  );
}

export default Profile;

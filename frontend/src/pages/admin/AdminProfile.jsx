import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import AdminSidebar from "@/pages/admin/AdminSidebar";
import "../../css/landingPage.css";
import Cookies from "js-cookie";
import Navbar from "@/blocks/Navbar";
import { useUser } from "../../context/UserContext";

const LOCATION_OPTIONS = ["chitwan", "pokhara", "kathmandu"];

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

const validateAdminProfile = (data) => {
  const errors = {
    firstName: validateName("First name", data.firstName),
    lastName: validateName("Last name", data.lastName),
    phone: validatePhone(data.phone),
    address: LOCATION_OPTIONS.includes(data.address)
      ? ""
      : "Please select a valid location",
  };

  return {
    errors,
    isValid: Object.values(errors).every((error) => !error),
  };
};

function AdminProfile() {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const token = Cookies.get("token") || localStorage.getItem("token");
  const { user, setUserData } = useUser();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const { errors: formErrors, isValid } = validateAdminProfile(formData);
    setErrors(formErrors);
    if (!isValid) {
      const firstError = Object.values(formErrors).find(Boolean);
      toast.error(firstError || "Please correct the form fields");
      return;
    }

    setSaving(true);

    try {
      const response = await apiClient.put(
        "/api/users/update-profile",
        {
          userId: user?._id,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: normalizePhone(formData.phone),
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

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-stone-50 lg:pt-4">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-16 z-30 px-4 py-3 bg-white border-b border-stone-200 flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new Event("open-admin-sidebar"))}
            className="p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-stone-800 text-sm">Admin Profile</span>
        </div>
        <main className="px-4 sm:px-6 lg:px-16 xl:px-16 pt-6 lg:pt-10 pb-16 min-h-screen bg-stone-50 space-y-8 lg:space-y-12">
          <section className="flex flex-col xl:flex-row items-start justify-between gap-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-color-main uppercase tracking-wide">
                Profile & preferences
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold txt-color-primary">
                Hi {formData.firstName || "there"}, keep your details current
              </h1>
              <p className="text-base text-stone-600 max-w-2xl">
                Manage your admin account information and preferences.
              </p>
            </div>

            <div className="grid gap-3 grid-cols-2">
              {badgeData.map((badge) => (
                <div
                  key={badge.label}
                  className="bg-white rounded-2xl shadow-sm border border-stone-200 px-4 py-3 text-center"
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

          <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-stone-200 p-6 space-y-6">
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
                      onBlur={() =>
                        setErrors((prev) => ({
                          ...prev,
                          firstName: validateName("First name", formData.firstName),
                        }))
                      }
                      className="px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      minLength={2}
                      maxLength={30}
                      required
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-600">{errors.firstName}</p>
                    )}
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                    Last name
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={() =>
                        setErrors((prev) => ({
                          ...prev,
                          lastName: validateName("Last name", formData.lastName),
                        }))
                      }
                      className="px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      minLength={2}
                      maxLength={30}
                      required
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-600">{errors.lastName}</p>
                    )}
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
                      onBlur={() =>
                        setErrors((prev) => ({
                          ...prev,
                          phone: validatePhone(formData.phone),
                        }))
                      }
                      className="px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      placeholder="+977-"
                      required
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600">{errors.phone}</p>
                    )}
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-stone-600">
                    Location
                    <select
                      name="address"
                      value={formData.address || ""}
                      onChange={handleInputChange}
                      onBlur={() =>
                        setErrors((prev) => ({
                          ...prev,
                          address: LOCATION_OPTIONS.includes(formData.address)
                            ? ""
                            : "Please select a valid location",
                        }))
                      }
                      className="px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                      required
                    >
                      <option value="">Select Location</option>
                      <option value="chitwan">Chitwan</option>
                      <option value="pokhara">Pokhara</option>
                      <option value="kathmandu">Kathmandu Valley</option>
                    </select>
                    <p className="text-xs text-stone-500">
                      Your primary location for admin operations.
                    </p>
                    {errors.address && (
                      <p className="text-xs text-red-600">{errors.address}</p>
                    )}
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
              <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-5 space-y-3">
                <h3 className="text-lg font-semibold txt-color-primary">
                  Account health
                </h3>
                <p className="text-sm text-stone-500">
                  Your admin account status and verification.
                </p>
                <div className="flex flex-col gap-3 text-sm">
                  {/* Email verification */}
                  <div className="flex items-center justify-between">
                    <span>Email verification</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      {user?.isEmailVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      </div>
    </>
  );
}

export default AdminProfile;

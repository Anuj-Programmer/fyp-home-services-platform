import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";
import Cookies from "js-cookie";
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

const validateRegisterForm = ({ firstName, lastName, phone, address }) => {
  const errors = {
    firstName: validateName("First name", firstName),
    lastName: validateName("Last name", lastName),
    phone: validatePhone(phone),
    address: LOCATION_OPTIONS.includes(address) ? "" : "Please select a valid location",
  };

  return {
    errors,
    isValid: Object.values(errors).every((error) => !error),
  };
};

function RegisterInfo() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });
  const { setUserData } = useUser();

  const navigate = useNavigate();

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem("email");
    const otpVerified = localStorage.getItem("otpVerified");
    

    if (!storedEmail || !otpVerified) {
      toast.error("You must verify your email first!");
      navigate("/register");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const handleRegisterDetails = async (e) => {
    e.preventDefault();

    const { errors: formErrors, isValid } = validateRegisterForm({
      firstName,
      lastName,
      phone,
      address,
    });
    setErrors(formErrors);

    if (!isValid) {
      const firstError = Object.values(formErrors).find(Boolean);
      toast.error(firstError || "Please correct the form fields");
      return;
    }

    setLoading(true);

    try {
      const { data } = await apiClient.post("/api/users/register", {
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: normalizePhone(phone),
        address,
      });

      toast.success(data.message || "Registration completed!");

      // Clear localStorage flags after registration
      localStorage.removeItem("email");
      localStorage.removeItem("otpVerified");
       Cookies.set("token", data.token, {expires: 7, path: '/', sameSite:'Lax'}); 
      //localStorage.setItem("token", data.token);    
      // Cookies.set("token", data.token);
        // ⬇️ IMPORTANT: Store role together with user
    const userWithRole = {
      ...data.user,
      role: data.role || "user", // default to "user"
    };

    setUserData(userWithRole);
    localStorage.setItem("user", JSON.stringify(userWithRole));

      // Redirect to dashboard or home page
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

    <Navbar/>
    <div className="min-h-[calc(100vh-64px)] flex sm:items-center sm:justify-center px-4 mt-10 sm:mt-0">
      <div className="w-full max-w-md bg-white rounded-lg  p-6 sm:p-8">
        <h2 className="text-2xl font-bold txt-color-primary mb-10 text-center">
          Complete Your Profile
        </h2>

        <form onSubmit={handleRegisterDetails} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) {
                  setErrors((prev) => ({ ...prev, firstName: "" }));
                }
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  firstName: validateName("First name", firstName),
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
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) {
                  setErrors((prev) => ({ ...prev, lastName: "" }));
                }
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  lastName: validateName("Last name", lastName),
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
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  phone: validatePhone(phone),
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

          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Address</label>
            <select
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) {
                  setErrors((prev) => ({ ...prev, address: "" }));
                }
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  address: LOCATION_OPTIONS.includes(address)
                    ? ""
                    : "Please select a valid location",
                }))
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Location</option>
              <option value="chitwan">Chitwan</option>
              <option value="pokhara">Pokhara</option>
              <option value="kathmandu">Kathmandu Valley</option>
            </select>
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address}</p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full bg-color-main btn-filled-slide text-white font-semibold py-2 px-4 rounded-lg transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

export default RegisterInfo

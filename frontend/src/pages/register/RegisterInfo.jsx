import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";

function RegisterInfo() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

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
    if (!firstName || !lastName || !phone || !address)
      return toast.error("Please fill in all fields");

    setLoading(true);

    try {
      const { data } = await axios.post("/api/users/register", {
        email,
        firstName,
        lastName,
        phone,
        address,
      },{withCredentials: true});

      toast.success(data.message || "Registration completed!");

      // Clear localStorage flags after registration
      localStorage.removeItem("email");
      localStorage.removeItem("otpVerified");
      localStorage.setItem("token", data.token);    
      // Cookies.set("token", data.token);
        // ⬇️ IMPORTANT: Store role together with user
    const userWithRole = {
      ...data.user,
      role: data.role || "user", // default to "user"
    };

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
    <Toaster position="top-center" reverseOrder={false} />
    <Navbar/>
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
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
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

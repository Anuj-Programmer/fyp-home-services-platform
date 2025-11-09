import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
// import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function OtpPage() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve email from localStorage
    const otpVerified = localStorage.getItem("otpVerified");
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error("No email found. Please start registration again.");
      navigate("/register");
    }

    if (otpVerified) {
    // OTP already verified, don't allow this page
    navigate("/register-details"); // send directly to register info page
  }
  }, [navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) return toast.error("Please enter the OTP");

    try {
      const { data } = await axios.post("/api/otp/verify", { email, otp });

      toast.success(data.message || "OTP verified successfully!");

      localStorage.setItem("otpVerified", "true");

      // Redirect to registration details page
      setTimeout(() => {
        navigate("/register-details");
      }, 1000);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Invalid OTP or server error.");
      }
    }
  };

  return (
    <>
    <Toaster position="top-center" reverseOrder={false} />
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Verify OTP
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Enter the 6-digit OTP sent to <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition duration-200"
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

export default OtpPage;

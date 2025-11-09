import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function VerifyLoginOtp() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve email from localStorage
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error("No email found. Please start login again.");
      navigate("/login");
    }
  }, [navigate]);

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();

    if (!otp) return toast.error("Please enter the OTP");

    setLoading(true);
    try {
      const { data } = await axios.post("/api/otp/verify", { email, otp });

      toast.success(data.message || "Login successful!");

      // Save token & user in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Mark OTP verified
      localStorage.setItem("otpVerified", "true");

      // Redirect to home/dashboard


      navigate("/home");
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.message || "Invalid or expired OTP. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
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
            Enter the 6-digit OTP sent to{" "}
            <span className="font-semibold">{email}</span>
          </p>

          <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />

            <button
              type="submit"
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition duration-200 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default VerifyLoginOtp;

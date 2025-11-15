import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/blocks/Navbar";

function RegisterEmail() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
  e.preventDefault();
  if (!email) return toast.error("Please enter your email");

  setLoading(true);
  try {
    const { data } = await axios.post("/api/otp/send", { email });

    toast.success(data.message || "OTP sent successfully");

    // Only navigate to verify-otp if OTP was actually sent (not blocked by existing user)
    if (data && data.message === "OTP sent to your email") {
      localStorage.setItem("email", email);
      localStorage.removeItem("otpVerified");
      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 1000);
    }

  } catch (err) {
    console.error(err);

    // If the server responded that the user already exists, show specific message and redirect to login
    if (err.response?.status === 409) {
      toast.error(err.response.data.message || "User already exists. Please log in.");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } else {
      toast.error(
        err.response?.data?.message || "Server error. Try again later."
      );
    }

  } finally {
    setLoading(false);
  }
};


  return (
    <>
    <Navbar />
    <Toaster position="top-center" reverseOrder={false} />
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Register with Email
        </h2>

        {message && (
          <div className="bg-blue-100 text-blue-700 p-2 rounded mb-4 text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-color-main hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
    </>
  );
}



export default RegisterEmail

import React, { useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSendLoginOtp = async (e) => {
  e.preventDefault();

  if (!email) return toast.error("Please enter your email");

  setLoading(true);
  setMessage("");

  try {
    const { data } = await axios.post("/api/otp/login/send", { email });

    if (data && data.message) {
      // ✅ OTP sent successfully
      toast.success(data.message || "OTP sent successfully");
      setMessage(data.message);

      // Save email for verification step
      localStorage.setItem("email", email);

      // Redirect only if success confirmed
      navigate("/verify-otp-login");
    } else {
      // ⚠️ In case backend didn’t send success message
      toast.error("Unexpected response from server");
    }
  } catch (error) {
    console.error(error);
    const errMsg =
      error.response?.data?.message || "Failed to send OTP. Try again.";
    toast.error(errMsg);
    setMessage(errMsg);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Login with Email
          </h2>

          {message && (
            <div className="bg-blue-100 text-blue-700 p-2 rounded mb-4 text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleSendLoginOtp} className="space-y-4">
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
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Don't have an account?{" "}
            <a href="/register" className="text-blue-500 hover:underline">
              Register Here
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default LoginPage;

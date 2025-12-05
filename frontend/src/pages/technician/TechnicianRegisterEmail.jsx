import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/blocks/Navbar";
import Logo from "../../assets/faviconLogo.png";

function TechnicianRegisterEmail() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error("Please enter your email");
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/otp/send", { email });
      toast.success(data.message || "OTP sent successfully");

      if (data?.message === "OTP sent to your email") {
        localStorage.setItem("technicianEmail", email);
        localStorage.removeItem("technicianOtpVerified");
        setTimeout(() => {
          navigate("/verify-otp-technician", { state: { email } });
        }, 800);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        toast.error(
          err.response.data.message ||
            "Email already registered. Please log in instead."
        );
        setTimeout(() => navigate("/login"), 1000);
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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg p-6 sm:p-8">
          <img src={Logo} alt="Logo" className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold txt-color-primary mb-12 text-center">
            Become a Professional
          </h2>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="mb-6">
              <label className="block text-gray-700 mb-4">Email Address</label>
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
              className={`w-full bg-color-main hover:txt-color-hover text-white btn-filled-slide font-semibold py-2 px-4 rounded-lg transition ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-4 text-center">
            Already registered?{" "}
            <a href="/login" className="txt-color-primary hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default TechnicianRegisterEmail;


import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";
import Cookies from "js-cookie";

function VerifyLoginOtp() {
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error("No email found. Please start login again.");
      navigate("/login");
    }
  }, [navigate]);

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    // Auto-focus next box
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
        return;
      }
      if (index > 0) {
        document.getElementById(`otp-${index - 1}`).focus();
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
      }
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(paste)) {
      setOtpDigits(paste.split(""));
      document.getElementById("otp-5").focus();
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");

    if (otp.length !== 6) {
      return toast.error("Please enter all 6 digits.");
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/otp/login/verify", {
        email,
        otp,
      });

      toast.success(data.message || "Login successful!");

      localStorage.setItem("token", data.token);
      // Store user along with role
      const userWithRole = {
        ...data.user,
        role: data.role,
      };
      localStorage.setItem("user", JSON.stringify(userWithRole));
      localStorage.setItem("otpVerified", "true");

      const role = data.role;

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "technician") {
        navigate("/technician-dashboard"); // technician dashboard
      } else {
        navigate("/home"); // regular user
      }
    } catch (error) {
      console.error(error);
      const errMsg =
        error.response?.data?.message ||
        "Invalid or expired OTP. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]  px-4">
        <div className="bg-white rounded-2xl  w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Verify OTP
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Enter the 6-digit OTP sent to{" "}
            <span className="font-semibold">{email}</span>
          </p>

          <form onSubmit={handleVerifyLoginOtp} className="space-y-6">
            {/* OTP Boxes */}
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 border border-gray-300 rounded-xl 
                             text-center text-xl font-semibold
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>

            <button
              type="submit"
              className={`w-full bg-color-main hover:bg-color-hover text-white btn-filled-slide font-semibold py-2 rounded-xl transition duration-200 ${
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

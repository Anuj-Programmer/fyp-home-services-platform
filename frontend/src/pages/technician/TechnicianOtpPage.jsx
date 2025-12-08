import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";

function TechnicianOtpPage() {
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("technicianEmail");
    const otpVerified = localStorage.getItem("technicianOtpVerified");

    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error("No email found. Please start technician registration again.");
      navigate("/register-technician");
    }

    if (otpVerified === "true") {
      navigate("/register-technician-details");
    }
  }, [navigate]);

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 5) {
      document.getElementById(`tech-otp-${index + 1}`)?.focus();
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
        document.getElementById(`tech-otp-${index - 1}`)?.focus();
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
      document.getElementById("tech-otp-5")?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");

    if (otp.length !== 6) {
      return toast.error("Please enter all 6 digits.");
    }

    try {
      const { data } = await axios.post("/api/otp/verify", { email, otp });

      toast.success(data.message || "OTP verified successfully!");
      localStorage.setItem("technicianOtpVerified", "true");

      setTimeout(() => {
        navigate("/register-technician-details");
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Invalid OTP or server error.");
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />
      <div className="flex items-center justify-center lg:min-h-[calc(100vh-64px)] px-4 mt-16 lg:mt-0">
        <div className="bg-white rounded-2xl w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Verify Technician OTP
          </h2>

          <p className="text-center text-gray-500 mb-6">
            Enter the 6-digit OTP sent to{" "}
            <span className="font-semibold">{email || "your email"}</span>
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`tech-otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 border border-gray-300 rounded-xl text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-color-main hover:bg-color-hover text-white font-semibold btn-filled-slide py-2 rounded-xl transition duration-200"
            >
              Verify OTP
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default TechnicianOtpPage;

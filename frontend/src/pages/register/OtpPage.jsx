import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "@/blocks/Navbar";

function OtpPage() {
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const otpVerified = localStorage.getItem("otpVerified");
    const storedEmail = localStorage.getItem("email");

    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error("No email found. Please start registration again.");
      navigate("/register");
    }

    if (otpVerified) {
      navigate("/register-details");
    }
  }, [navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timerId = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, [resendCooldown]);

  // Handle input change
  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    // Auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle BACKSPACE anywhere
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      // If box has value → clear it
      if (otpDigits[index]) {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
        return;
      }

      // If box is empty → go to previous
      if (index > 0) {
        document.getElementById(`otp-${index - 1}`).focus();

        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
      }
    }
  };

  // Handle paste full OTP
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(paste)) {
      setOtpDigits(paste.split(""));
      document.getElementById("otp-5").focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");

    if (otp.length !== 6) {
      return toast.error("Please enter all 6 digits.");
    }

    try {
      const { data } = await apiClient.post("/api/otp/verify", { email, otp });

      toast.success(data.message || "OTP verified successfully!");

      localStorage.setItem("otpVerified", "true");

      setTimeout(() => {
        navigate("/register-details");
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Invalid OTP or server error.");
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0 || resendingOtp) return;

    setResendingOtp(true);
    try {
      const { data } = await apiClient.post("/api/otp/send", { email });
      toast.success(data?.message || "OTP resent successfully");
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(30);
      document.getElementById("otp-0")?.focus();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Unable to resend OTP right now");
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <>

      <Navbar/>
      <div className="flex items-center justify-center lg:min-h-[calc(100vh-64px)]  px-4 mt-16 lg:mt-0">
        <div className="bg-white rounded-2xl w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Verify OTP
          </h2>

          <p className="text-center text-gray-500 mb-6">
            Enter the 6-digit OTP sent to{" "}
            <span className="font-semibold">{email}</span>
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
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
              className="w-full bg-color-main hover:bg-color-hover text-white font-semibold  btn-filled-slide py-2 rounded-xl transition duration-200"
            >
              Verify OTP
            </button>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-center space-y-2">
              <p className="text-xs text-stone-600">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendingOtp || resendCooldown > 0}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-lg border border-color-main txt-color-primary hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendingOtp
                  ? "Resending..."
                  : resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Resend OTP"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default OtpPage;

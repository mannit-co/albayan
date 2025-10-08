import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuMail } from "react-icons/lu";
import { uid, BaseUrl } from "../../Api/Api";
import logo from "../../images/logo.png";
import { useLanguage } from "../../contexts/LanguageContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      setIsError(true);
      setErrorMessage(t("enterValidEmail"));
      setTimeout(() => setIsError(false), 3000);
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch(`${BaseUrl}/Wforgetpwd/web`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          xxxid: uid,
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (res.ok && (result.statusCode === 200 || result.status === "success")) {
        setIsSuccess(true);
        setSuccessMessage(t("otpSent"));
        setShowOtpField(true);
      } else {
        throw new Error(result.message || t("invalidOTP"));
      }
    } catch (error) {
      setIsError(true);
      setErrorMessage(error.message || t("invalidOTP"));
    } finally {
      setSendingOtp(false);
      setTimeout(() => {
        setIsError(false);
        setIsSuccess(false);
      }, 3000);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      setIsError(true);
      setErrorMessage(t("enterOTP"));
      setTimeout(() => setIsError(false), 3000);
      return;
    }

    setVerifyingOtp(true);

    try {
      const res = await fetch(`${BaseUrl}/WverifyOTP/web?Otp=${otp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          xxxid: uid,
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (res.ok && (result.statusCode === 200 || result.status === "success")) {
        setIsSuccess(true);
        setSuccessMessage(t("otpVerified") + " " + t("resetPasswordSuccess"));

        setTimeout(() => {
          setIsSuccess(false);
          navigate("/");
        }, 3000);
      } else {
        throw new Error(t("invalidOTP"));
      }
    } catch (error) {
      setIsError(true);
      setErrorMessage(t("invalidOTP"));
      setTimeout(() => setIsError(false), 3000);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img
              src={logo}
              alt="AssessHub Logo"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AssessHub</h1>
          <p className="text-gray-600">{t("resetPassword")}</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Sign In / Sign Up Toggle */}
          <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
            <button
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-gray-600 hover:text-gray-900"
              onClick={() => navigate("/")}
            >
              {t("login")}
            </button>
            {/* <button
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-gray-600 hover:text-gray-900"
              onClick={() => navigate("/signup")}
            >
              {t("signup")}
            </button> */}
          </div>

          {/* Reset Password Form */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Email Field */}
            {!showOtpField && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("email")} *
                  </label>
                  <div className="relative">
                    <LuMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? t("sendingOTP") : t("sendOTP")}
                </button>
              </div>
            )}

            {/* OTP Verification */}
            {showOtpField && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("enterOTP")}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder={t("enterOTP")}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingOtp ? t("verifyingOTP") : t("verifyOTP")}
                </button>
              </div>
            )}

            {/* Success / Error Messages */}
            {(isError || isSuccess) && (
              <p
                className={`text-center text-sm font-medium ${
                  isError ? "text-red-600" : "text-green-600"
                }`}
              >
                {isError ? errorMessage : successMessage}
              </p>
            )}

            {/* Back to Sign In */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <button
                  type="button"
                  className="text-green-600 hover:text-green-700 font-medium"
                  onClick={() => navigate("/")}
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 AssessHub. All rights reserved.</p>
          <div className="flex items-center justify-center space-x-4 mt-2">
            <a href="#" className="hover:text-gray-700">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700">
              Terms of Service
            </a>
            <span>•</span>
            <a href="#" className="hover:text-gray-700">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

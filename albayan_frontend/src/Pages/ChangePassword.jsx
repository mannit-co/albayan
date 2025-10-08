import React, { useState, useEffect } from "react";
import { userInfo, uid, BaseUrl } from "../Api/Api";
import { toast } from "react-hot-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { FiEye, FiEyeOff } from "react-icons/fi"; // 👀 eye icons

const ChangePassword = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // ✅ Track OTP sent
  const [loadingChange, setLoadingChange] = useState(false);

  // toggle states for eye icons
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto set username
  useEffect(() => {
    if (userInfo?.username) {
      setFormData((prev) => ({ ...prev, username: userInfo.username }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Send OTP
  const handleSendOtp = async () => {
    try {
      setLoadingOtp(true);

      const payload = { email: formData.username };

      // Grab token from session storage
      const storedData = sessionStorage.getItem("loginResponse");
      let token = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
      }
      if (!token) throw new Error("Authorization token not found");

      const response = await fetch(`${BaseUrl}/forgot-password-auth`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          xxxid: uid,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP");

      toast.success(t("otpSentSuccess"));
      setOtpSent(true); // ✅ disable button after OTP sent
    } catch (error) {
      console.error(error);
      toast.error(error.message || t("somethingWentWrong"));
    } finally {
      setLoadingOtp(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    try {
      setLoadingChange(true);

      const payload = {
        email: formData.username,
        new_password: formData.newPassword,
        otp: formData.otp,
      };

      const response = await fetch(`${BaseUrl}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          xxxid: uid,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to reset password");

      toast.success(t("passwordUpdatedSuccess"));
      setFormData((prev) => ({
        ...prev,
        otp: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setOtpSent(false); // reset OTP state after success
    } catch (error) {
      console.error(error);
      toast.error(error.message || t("somethingWentWrong"));
    } finally {
      setLoadingChange(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {t("changePassword")}
      </h2>

      {/* Username */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("username")}
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          disabled
          className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* OTP input with Send OTP */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("enterOTP")}
        </label>
        <div className="relative">
          <input
            type="text"
            name="otp"
            value={formData.otp}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-28"
            placeholder={t("enterOTP")}
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loadingOtp || otpSent} // ✅ disable after OTP sent
            className={`absolute right-1 top-1 bottom-1 px-3 rounded-lg text-sm font-medium text-white ${
              otpSent
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loadingOtp ? t("sendingOTP") : otpSent ? t("otpSent") : t("sendOTP")}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("newPassword")}
        </label>
        <input
          type={showNewPassword ? "text" : "password"}
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          required
        />
        <button
          type="button"
          onClick={() => setShowNewPassword((prev) => !prev)}
          className="absolute right-3 top-9 text-gray-600"
        >
          {showNewPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      {/* Confirm Password */}
      <div className="mb-6 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("confirmNewPassword")}
        </label>
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="absolute right-3 top-9 text-gray-600"
        >
          {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>

      {/* Change Password Button */}
      <button
        onClick={handleResetPassword}
        disabled={loadingChange}
        className={`w-full font-medium py-2 rounded-lg transition ${
          loadingChange
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-blue-600 text-white hover:bg-purple-700"
        }`}
      >
        {loadingChange ? t("updating") : t("updatePassword")}
      </button>
    </div>
  );
};

export default ChangePassword;

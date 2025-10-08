import React, { useState, useEffect } from "react";
import { uid, BaseUrl , SuperAdminID  } from "../../Api/Api";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  LuUser,
  LuBuilding,
  LuPhone,
  LuMail,
  LuLock,
  LuEye,
  LuEyeOff,
  LuArrowRight,
} from "react-icons/lu";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    mobileno: 0,
    role: "", //  Add this
    email: "",
    password: "",
    confirmPassword: "",
    domain: "ALBAYANHUB",
    subdomain: "albayanhub",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);

  const [formErrors, setFormErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleChange = (field, value) => {
    setSignupData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${BaseUrl}/redcombo?collname=ROLES`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            xxxid: uid,
          },
        });

        const data = await response.json();
        console.log("API Response:", data);

        if (data?.source?.ROLES) {
          // Convert roles object to array like [{name: "SuperAdmin", value: "1"}, ...]
          const rolesArray = Object.keys(data.source.ROLES).map((key) => ({
            name: key,
            value: data.source.ROLES[key],
          }));

          // Sort by value (so "1" -> SuperAdmin, then Admin, HR)
          rolesArray.sort((a, b) => parseInt(a.value) - parseInt(b.value));

          setRoles(rolesArray);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const validateForm = () => {
    let valid = true;
    let errors = { password: "", confirmPassword: "" };

    if (signupData.password.length < 8) {
      errors.password = t("passwordRequirements");
      valid = false;
    }

    if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = t("passwordsDoNotMatch");
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const signupPayload = { ...signupData, username: signupData.email , sa: SuperAdminID };

      const signupResponse = await fetch(`${BaseUrl}/jsignup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", xxxid: uid },
        body: JSON.stringify(signupPayload),
      });

      const signupResult = await signupResponse.json();

      // Handle API-specific error codes
      if (signupResult.errorCode) {
        let message = signupResult.errorMsg; // default from API

        // Map specific API error codes to custom messages
        if (signupResult.errorCode === "104") {
          message = t("emailAlreadyExists");
        } else if (signupResult.errorCode === "105") {
          // Already handled below
          setFormErrors((prev) => ({
            ...prev,
            password: signupResult.errorMsg,
          }));
          return;
        }

        toast.error(message);
        return; // stop further execution
      }

      if (!signupResponse.ok) throw new Error("Signup API failed");

      const sourceObj = signupResult.source
        ? JSON.parse(signupResult.source)
        : null;
      const userId = sourceObj?._id?.$oid;

      if (!userId) throw new Error("User ID not found in signup response");

      const eCreatePayload = { ...signupPayload, userId };
      const createResponse = await fetch(
        `${BaseUrl}/eCreate?userId=${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", xxxid: uid },
          body: JSON.stringify(eCreatePayload),
        }
      );

      if (!createResponse.ok) throw new Error("eCreate API failed");

      toast.success(t("registeredSuccessfully"));
      setTimeout(() => navigate("/", { replace: true }), 1000);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img
              src={logo}
              alt="AssessHub Logo"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AssessHub</h1>
          <p className="text-gray-600">{t("createAccount")}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Toggle Buttons */}
          <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-gray-600 hover:text-gray-900"
              onClick={() => navigate("/")}
            >
              {t("login")}
            </button>
            <button
              type="button"
              className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all bg-white text-green-600 shadow-sm"
              onClick={() => navigate("/signup")}
            >
              {t("signup")}
            </button>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSignup}>
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("firstName")} *
                </label>
                <div className="relative">
                  <LuUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg "
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("lastName")} *
                </label>
                <div className="relative">
                  <LuUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg "
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("company")}
              </label>
              <div className="relative">
                <LuBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={signupData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg "
                  placeholder="Your Company"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("phoneNumber")}
              </label>
              <div className="relative">
                <LuPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={signupData.mobileno}
                  required
                  onChange={(e) =>
                    handleChange(
                      "mobileno",
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg "
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Role Dropdown */}
            {/* Role Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("role")} *
              </label>
              <div className="relative">
                <select
                  value={signupData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg bg-white"
                  required
                >
                  <option value="" disabled>{t("SelectRole")}</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.name}
                    </option>
                  ))}
                </select>

              </div>
            </div>



            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("email")} *
              </label>
              <div className="relative">
                <LuMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={signupData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg "
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("password")} *
              </label>
              <div className="relative">
                <LuLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={signupData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border  rounded-lg `}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("passwordRequirements")}
              </p>
              {formErrors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("confirmPassword")} *
              </label>
              <div className="relative">
                <LuLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg `}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700  font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <span>{loading ? t("signingUp") : t("createAccountButton")}</span>
              <LuArrowRight />
            </button>

            {/* Sign In Link */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {t("alreadyHaveAccount")}{" "}
                <button
                  type="button"
                  className="text-green-600 hover:text-green-700 font-medium"
                  onClick={() => navigate("/")}
                >
                  {t("login")}
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

export default Signup;

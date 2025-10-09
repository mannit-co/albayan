import React, { useState } from "react";
import { LuMail, LuLock, LuEye, LuArrowRight, LuEyeOff } from "react-icons/lu";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";
import { BaseUrl, uid } from "../../Api/Api";
import { useUser } from "../../contexts/UserContext";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";

const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "", general: "" });
    const { t } = useLanguage();
    const { updateUserInfo } = useUser();

    const navigate = useNavigate();

    //  Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    //  Password validation function
    const validatePassword = (password) => {
        return password.length >= 6; // Change rule if needed
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({ email: "", password: "", general: "" });

        let valid = true;
        let newErrors = { email: "", password: "", general: "" };

        //  Email check
        
        if (!validateEmail(email)) {
            newErrors.email = "Invalid email address";
            valid = false;
        }

        //  Password check
        if (!validatePassword(password)) {
            newErrors.password = "Password must be at least 6 characters";
            valid = false;
        }

        setErrors(newErrors);
        if (!valid) return;

        setLoading(true);
        try {
            const requestBody = { username: email, password };
            const response = await fetch(`${BaseUrl}/signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xxxid": uid
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();
if (!response.ok) {
    const apiMsg = result.errorMsg || t("loginfailed") || "Login failed";

    // Map API error to user-friendly messages
    let friendlyMsg = apiMsg;
    if (apiMsg.toLowerCase().includes("username") || apiMsg.toLowerCase().includes("bad credentials") || apiMsg.toLowerCase().includes("password")) {
        friendlyMsg = t("invalidUsernameOrPassword") || "Invalid Username or Password";
    }

    setErrors({ email: "", password: "", general: friendlyMsg });
    return;
}

            //  Store login response
            sessionStorage.setItem("loginResponse", JSON.stringify(result));

            // Update user info in context
            updateUserInfo();

            toast.success(t("loggedInSuccessfully") || "Logged in successfully!");
            setTimeout(() => navigate("/dashboard"), 1000);

        } catch (err) {
            setErrors((prev) => ({ ...prev, general: err.message }));
        }


        finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
            <Toaster position="top-right" reverseOrder={false} />
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 mt-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                        <img src={logo} alt="AssessHub Logo" className="w-16 h-16 rounded-xl object-cover" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AssessHub</h1>
                    <p className="text-gray-600">{t("welcomeBack") || "Welcome back! Please sign in to your account."}</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    {/* Tabs */}
                    <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
                        <button className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all bg-white text-green-600 shadow-sm cursor-default" onClick={() => navigate("/")}>
                            {t("login")}
                        </button>
                        {/* <button className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all text-gray-600 hover:text-gray-900" onClick={() => navigate("/signup")}>
                            {t("signup")}
                        </button> */}
                    </div>

                    {/* General Error */}
                    {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">{t("email")} *</label>
                            <div className="relative">
                                <LuMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-10 pr-4 py-3 border "border-gray-200"  rounded-lg `}
                                    placeholder={t("examplecom")}
                                    required
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">{t("password")} *</label>
                            <div className="relative">
                                <LuLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-10 pr-12 py-3 border border-gray-200  rounded-lg `}
                                    placeholder={t("enteryourpassword")}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <LuEye className="text-xl" /> : <LuEyeOff className="text-xl" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        {/* Remember Me & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2">
                                {/* <input type="checkbox" name="rememberMe" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" /> */}
                                <span className="text-sm text-gray-600"></span>
                            </label>
                            <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium" onClick={() => navigate('/forgotpassword')}>
                                {t("forgotPassword","Forgot password?")}
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50  "
                        >
                            {loading ? <span>{t("siningin","Signing in...")}</span> : (<><span>{t("login")}</span><LuArrowRight className="text-xl" /></>)}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;


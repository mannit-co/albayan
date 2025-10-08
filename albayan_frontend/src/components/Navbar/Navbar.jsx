import React, { useMemo, useState } from "react";
import {
  FiMenu,
  FiGlobe,
  FiChevronDown,
  FiBell,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { FaExclamationTriangle } from "react-icons/fa"; // <-- Correct package


const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLang, languages, selectLanguage, t } = useLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // ✅ New state


  const toggleLanguageMenu = () => setLanguageOpen(!languageOpen);
  const handleSelectLanguage = (lang) => {
    selectLanguage(lang);
    setLanguageOpen(false);
  };
  const storedData = sessionStorage.getItem("loginResponse");
  const parsedData = storedData ? JSON.parse(storedData) : null;
  const userInfo = parsedData?.source ? JSON.parse(parsedData.source) : null;
  const title = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith("/test-library")) return t("testLibrary");
    if (path.startsWith("/candidates")) return t("candidates");
    if (path.startsWith("/reports")) return t("reports");
    if (path.startsWith("/settings")) return t("settings");
    if (path.startsWith("/profile")) return t("Profile");
    if (path.startsWith("/changepassword")) return t("ChangePassword");
    if (path.startsWith("/assessment-library")) return t("assessmentLibrary");
    if (path.startsWith("/question-bank")) return t("questionbank");
    return t("dashboard");
  }, [location.pathname, t]);
  const initials = userInfo
    ? `${userInfo.firstName?.charAt(0) || ""}${userInfo.lastName?.charAt(0) || ""}`.toUpperCase()
    : "AU"; // fallback to "U" if no name

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const currentDate = useMemo(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);


  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 ">
      {/* Main Row */}
      <div className="flex items-center justify-between relative">
        {/* Left: Menu Icon */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <FiMenu size={20} />
        </button>

        {/* Center: Title (absolute on mobile, normal on desktop) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center lg:static lg:transform-none lg:text-left">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            {t("lastUpdated")}: {currentDate}
          </p>

        </div>

        {/* Right: Profile Section */}
        <div className="flex items-center space-x-4">
          {/* Desktop Items */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={toggleLanguageMenu}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiGlobe size={16} />
                <span className="text-sm font-medium">{selectedLang.flag}</span>
                <span className="text-sm">{selectedLang.name}</span>
                <FiChevronDown
                  size={14}
                  className={`transition-transform ${languageOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {languageOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                  {languages.map((lang, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLanguage(lang)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${selectedLang.name === lang.name
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                        }`}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            {/* <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button> */}

            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">{userInfo.firstName}</div>
                <div className="text-xs text-gray-500">{t("administrator")}</div>
              </div>
              <div className="flex items-center space-x-2">
                {/* <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{initials}</span>
                </div> */}

                <div className="relative">
                  <div
                    className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={() => setProfileOpen(!profileOpen)}
                  >
                    <span className="text-white text-sm font-medium">{initials}</span>
                  </div>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile"); //  Navigate to Profile Page
                        }}
                      >
                        Profile
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/ChangePassword"); //  Navigate to Change Password Page
                        }}
                      >
                        Change Password
                      </button>
                    </div>
                  )}
                </div>


                {/* <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                  onClick={() => navigate("/")}
                >
                  <FiLogOut size={16} />
                </button> */}
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                  onClick={() => setShowLogoutConfirm(true)} // ✅ Show confirmation
                >
                  <FiLogOut size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Profile Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <FiUser size={20} />
          </button>
        </div>
      </div>


      {/* ✅ Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-orange-100">
                <FaExclamationTriangle className="text-orange-600 text-2xl" />

              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-2">
              {t("ConfirmLogout")}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {t("Areyousure")}
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="px-5 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
                onClick={handleLogout}
              >
                {t("Logout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 bg-white shadow-md border border-gray-200 rounded-lg p-4 space-y-4 absolute right-0 w-64 z-50">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={toggleLanguageMenu}
              className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full"
            >
              <div className="flex items-center space-x-2">
                <FiGlobe size={16} />
                <span className="text-sm font-medium">{selectedLang.flag}</span>
                <span className="text-sm">{selectedLang.name}</span>
              </div>
              <FiChevronDown
                size={14}
                className={`transition-transform ${languageOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {languageOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-full">
                {languages.map((lang, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLanguage(lang)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${selectedLang.name === lang.name
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700"
                      }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          {/* <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors w-full text-left">
            <FiBell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="ml-8 text-sm">{t("notifications")}</span>
          </button> */}

          {/* User Info */}
          <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
            <div className="flex items-center space-x-2">
              {/* <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{initials}</span>
              </div> */}

              <div className="relative">
                <div
                  className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <span className="text-white text-sm font-medium">{initials}</span>
                </div>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profile"); //  Navigate to Profile Page
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 text-sm"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/change-password"); //  Navigate to Change Password Page
                      }}
                    >
                      Change Password
                    </button>
                  </div>
                )}
              </div>

              <button
                className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
                onClick={() => navigate("/")}
              >
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

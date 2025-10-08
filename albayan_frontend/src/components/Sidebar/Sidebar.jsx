import React, { useState } from "react";
import {
  FaChartBar,
  FaBookOpen,
  FaUsers,
  FaRegFileAlt,
  FaCog,
  FaBars,
  FaTimes,
  FaClipboardList,
  FaQuestionCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import logo from "../../images/logo.png";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { selectedLang, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  //  Get role from session
  const storedData = sessionStorage.getItem("loginResponse");
  const parsedData = storedData ? JSON.parse(storedData) : null;
  const userInfo = parsedData?.source ? JSON.parse(parsedData.source) : null;
  const role = userInfo?.role || "3"; // default = 3

  //  Define menu items
  const menuItems = [
    { name: t("dashboard"), icon: <FaChartBar size={20} />, path: "/dashboard" },
    { name: t("candidates"), icon: <FaUsers size={20} />, path: "/candidates" },
    // 🚫 Hide Test Library if role === "3"
    ...(role !== "3"
      ? [{ name: t("questionbank"), icon: <FaQuestionCircle size={20} />, path: "/question-bank" },
      { name: t("testLibrary"), icon: <FaBookOpen size={20} />, path: "/test-library" },
        // ✅ Added here

      ]
      : []),

    { name: t("assessmentLibrary"), icon: <FaClipboardList size={20} />, path: "/assessment-library" },
    { name: t("reports"), icon: <FaRegFileAlt size={20} />, path: "/reports" },
    // 🚫 Hide Settings if role === "3"
    ...(role !== "3"
      ? [{ name: t("settings"), icon: <FaCog size={20} />, path: "/settings" }]
      : []),
  ];


  return (
    <>
      {/* ===== Desktop Sidebar ===== */}
      <div
        className={`hidden md:flex bg-white shadow-lg ${selectedLang.dir === "rtl" ? "border-l right-0" : "border-r left-0"
          } border-gray-200 h-screen flex-col fixed top-0 transition-all duration-300 w-20 ${isOpen ? "md:w-64" : "md:w-20"
          }`}
      >
        {/* Header */}
        <div className="flex p-4 border-b border-gray-200 items-center justify-between">
          {isOpen && (
            <div
              className={`flex items-center ${selectedLang.dir === "rtl" ? "space-x-reverse space-x-3" : "space-x-3"
                }`}
            >
              <img src={logo} alt="AssessHub Logo" className="w-10 h-10 rounded-lg object-cover" />
              <div className={`${selectedLang.dir === "rtl" ? "text-right" : "text-left"}`}>
                <h2 className="font-bold text-gray-900">AssessHub</h2>
                <p className="text-xs text-gray-500">v2.1.0</p>
              </div>
            </div>
          )}
          <button
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span
              className={`inline-block transform transition-transform duration-300 ${(isOpen && selectedLang.dir === "ltr") ? "rotate-0" :
                (!isOpen && selectedLang.dir === "ltr") ? "rotate-180" :
                  (isOpen && selectedLang.dir === "rtl") ? "rotate-180" :
                    "-rotate-0"
                }`}
            >
              ◀
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={index}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 justify-center
                      ${isOpen ? "md:justify-start md:space-x-3" : "md:justify-center"}
                      ${isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    {item.icon}
                    <span
                      className={`font-medium ${selectedLang.dir === "rtl" ? "text-right" : "text-left"
                        } ${isOpen ? "hidden md:inline" : "hidden"}`}
                    >
                      {item.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <button
        className={`md:hidden fixed top-4 ${selectedLang.dir === "rtl" ? "right-4" : "left-4"
          } z-50 p-2 rounded-lg bg-white shadow-lg`}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* ===== Mobile Sidebar Drawer ===== */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileOpen(false)} // close on backdrop click
        >
          <div
            className={`absolute top-0 ${selectedLang.dir === "rtl" ? "right-0" : "left-0"
              } w-64 h-full bg-white shadow-lg p-4`}
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Header */}
            <div className="flex items-center mb-6">
              <img src={logo} alt="AssessHub Logo" className="w-8 h-8" />
            </div>

            {/* Navigation */}
            <nav>
              <ul className="space-y-2">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${selectedLang.dir === "rtl"
                        ? "justify-end space-x-reverse space-x-3"
                        : "space-x-3"
                        }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;


import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Navbar from "../Navbar/Navbar";
import { useLanguage } from "../../contexts/LanguageContext";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { selectedLang } = useLanguage();

  return (
    <div
      className={`h-screen ${
        selectedLang.dir === "rtl" ? "flex-row-reverse" : ""
      }`}
    >
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content wrapper */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300
        ${
          selectedLang.dir === "rtl"
            ? `mr-0 md:mr-20 ${sidebarOpen ? "md:mr-64" : "md:mr-20"}`
            : `ml-0 md:ml-20 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`
        }`}
      >
        {/* Navbar */}
        <Navbar />

        {/* Main content area */}
        <div className="flex flex-col min-h-screen">
          <div className="flex flex-1">
            <main className="p-2 sm:p-6 bg-gray-50 flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;


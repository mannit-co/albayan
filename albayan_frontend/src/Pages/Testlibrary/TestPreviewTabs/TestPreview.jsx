import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUsers,
  FiClock,
  FiBookOpen,
  FiEye,
  FiSettings,
} from "react-icons/fi";
import { useLanguage } from "../../../contexts/LanguageContext";
import TestPreviewOverview from "./TestPreviewOverview";
import TestPreviewSettings from "./TestPreviewSettings";
import TestPreviewQuestionsTab from "./TestPreviewQuestionsTab";

const TestPreview = ({ test, onBack }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  if (!test) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>{t("noTestDataAvailable")}</p>
        <button
          onClick={onBack}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  // Handle stringified API response
  let parsedTest = test;
  if (typeof test === "string") {
    try {
      parsedTest = JSON.parse(test);
    } catch (e) {
      console.error("Failed to parse test JSON:", e);
      parsedTest = {};
    }
  }

  const questionsArray = Array.isArray(parsedTest.qs) ? parsedTest.qs : [];
  const duration = parsedTest.dur || 0;
  const creator = parsedTest.creator || "Unknown";
  const title = parsedTest.title || "";
  const description = parsedTest.desc || "";
  const settings = {
    pass: parsedTest.pass ?? 0,
    attempts: parsedTest.attempts ?? 1,
    plag: parsedTest.plag ?? false,
    shuffle: parsedTest.shuffle ?? false,
    showRes: parsedTest.showRes ?? false,
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 mb-4">{description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FiUsers />
              <span>{t("creator")}: {creator}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiClock />
              <span>{duration} {t("minutes")}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiBookOpen />
              <span>{questionsArray.length} {t("questions")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex flex-wrap gap-4 md:gap-8">
          {[
            { key: "overview", label: t("overview"), icon: <FiEye /> },
            { key: "questions", label: t("questions"), icon: <FiBookOpen /> },
            { key: "settings", label: t("settings"), icon: <FiSettings /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Render Tabs */}
      {activeTab === "overview" && <TestPreviewOverview test={parsedTest} />}
      {activeTab === "questions" && (
        <TestPreviewQuestionsTab questions={questionsArray} />
      )}
      {activeTab === "settings" && <TestPreviewSettings settings={settings} />}
    </div>
  );
};

export default TestPreview;

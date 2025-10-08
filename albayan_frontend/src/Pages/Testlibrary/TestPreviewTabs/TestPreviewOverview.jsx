import React from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

/* ===================== TEST PREVIEW OVERVIEW ===================== */
const TestPreviewOverview = ({ test }) => {
  const { t } = useLanguage();
  if (!test) return null;

  // If test is a string (from API), parse it
  let parsedTest = test;
  if (typeof test === "string") {
    try {
      parsedTest = JSON.parse(test);
    } catch (e) {
      console.error("Failed to parse test JSON:", e);
      parsedTest = {};
    }
  }

  // Map raw fields to UI-friendly fields
  const questionsArray = Array.isArray(parsedTest.qs) ? parsedTest.qs : [];
  const tagsArray = Array.isArray(parsedTest.tags) ? parsedTest.tags : [];
  const instructions = parsedTest.instr || t("noInstructions", "No instructions provided.");
  const duration = parsedTest.dur || 0;
  const attempts = parsedTest.attempts || 1;
  const showResults = parsedTest.showRes ?? false;
  const category = parsedTest.cat || "—";
  const difficulty = parsedTest.diff || "—";
  const skill = parsedTest.skill || "—";
  const status = parsedTest.status || "—";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Section: Instructions + Stats */}
      <div className="md:col-span-2 space-y-6">
        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("instructions")}</h3>
          <p className="text-gray-600">{instructions}</p>
        </div>

        {/* Test Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("testStatistics")}</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{questionsArray.length}</div>
              <div className="text-sm text-gray-600">{t("questions")}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{duration}</div>
              <div className="text-sm text-gray-600">{t("minutes")}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{attempts}</div>
              <div className="text-sm text-gray-600">{t("attempts")}</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{showResults ? t("yes") : t("no")}</div>
              <div className="text-sm text-gray-600">{t("showResults")}</div>
            </div>
          </div>
        </div>

        {/* Optional: Preview first 3 questions */}
        {/* {questionsArray.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Questions</h3>
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              {questionsArray.slice(0, 3).map((q) => (
                <li key={q.id || q.q}>{q.q || "Untitled Question"}</li>
              ))}
              {questionsArray.length > 3 && <li>...and {questionsArray.length - 3} more</li>}
            </ul>
          </div>
        )} */}
      </div>

      {/* Right Section: Test Details + Tags */}
      <div className="space-y-6 w-full md:w-80">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t("testDetails")}</h3>
          <div className="space-y-3 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-gray-600">{t("category")}:</span>
              <span className="font-medium">{category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("difficulty")}:</span>
              <span className="font-medium">{difficulty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("skillSubject")}:</span>
              <span className="font-medium">{skill}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("status")}:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  status === "Active"
                    ? "bg-green-100 text-green-800"
                    : status === "Archived"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {tagsArray.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t("tags")}</h3>
            <div className="flex flex-wrap gap-2">
              {tagsArray.map((tag, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPreviewOverview;

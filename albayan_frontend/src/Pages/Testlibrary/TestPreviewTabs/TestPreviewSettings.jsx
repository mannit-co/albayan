import React from "react";
import { FiShuffle, FiEye, FiFileText } from "react-icons/fi";
import { useLanguage } from "../../../contexts/LanguageContext";

const TestPreviewSettings = ({ settings = {} }) => {
  const { t } = useLanguage();
  // Map backend values into frontend defaults
  const passingScore = settings.pass ?? 0;         // backend: pass
  const maxAttempts = settings.attempts ?? 1;      // backend: attempts
  const randomizeQuestions = settings.shuffle ?? false; // backend: shuffle
  const showResults = settings.showRes ?? false;   // backend: showRes
  const plagiarismCheck = settings.plag ?? false;  // backend: plag

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t("testConfiguration")}
        </h3>

        <div className="space-y-6">
          {/* Passing Score & Max Attempts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("passingScore")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  value={passingScore}
                  readOnly
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("maxAttempts")}
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="10"
                value={maxAttempts}
                readOnly
              />
            </div>
          </div>

          {/* Boolean Toggles */}
          <div className="space-y-4">
            {/* Plagiarism Detection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-4">
              <div className="flex items-start space-x-3">
                <FiFileText className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{t("plagiarismDetection")}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("plagiarismDetectionHelp")}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={plagiarismCheck}
                readOnly
              />
            </div>

            {/* Randomize Questions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-4">
              <div className="flex items-start space-x-3">
                <FiShuffle className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{t("randomizeQuestions")}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("randomizeQuestionsHelp")}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={randomizeQuestions}
                readOnly
              />
            </div>

            {/* Show Results */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg gap-4">
              <div className="flex items-start space-x-3">
                <FiEye className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{t("showResults")}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("showResultsHelp")}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={showResults}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPreviewSettings;

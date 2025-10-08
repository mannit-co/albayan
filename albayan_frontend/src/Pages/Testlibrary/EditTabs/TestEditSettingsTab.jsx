import React from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

const TestEditSettingsTab = ({ settings, setSettings }) => {
  const { t } = useLanguage();
  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t("testConfiguration","Test Configuration")}
        </h3>

        <div className="space-y-6">
          {/* Passing Score & Max Attempts */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("passingScore","Passing Score")} (%) <span className="text-red-500 text-base font-bold">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
                value={settings.passingScore === null ? "" : settings.passingScore}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                      passingScore: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("maxAttempts","Max Attempts ")} <span className="text-red-500 text-base font-bold">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="10"
                value={settings.maxAttempts === null ? "" : settings.maxAttempts}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxAttempts: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("status","Status")}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.status || ""} //  empty string if not loaded
              onChange={(e) =>
                setSettings({ ...settings, status: e.target.value })
              }
            >
              <option value="" disabled>{t("select")}</option>
              <option value={t("Draft")}>{t("draft")}</option>
              <option value={t("Active")}>{t("active")}</option>
              <option value={t("Archived")}>{t("archived")}</option>
            </select>
          </div>

          {/* Plagiarism Detection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("plagiarismDetection","Plagiarism Detection")}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("enablePlagiarismDetection","Enable automatic plagiarism detection for this test")}
                </p>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={settings.plagiarismDetection}
                onChange={() =>
                  setSettings({
                    ...settings,
                    plagiarismDetection: !settings.plagiarismDetection,
                  })
                }
              />
            </div>
          </div>

          {/* Randomize & Show Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("randomizeQuestions","Randomize Questions")}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("randomizeQuestionsDescription","Randomize question order for each attempt")}
                </p>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={settings.randomizeQuestions}
                onChange={() =>
                  setSettings({
                    ...settings,
                    randomizeQuestions: !settings.randomizeQuestions,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{t("showResults","Show Results")}</h4>
                <p className="text-sm text-gray-600">
                  {t("showResultsDescription","Show results immediately after completion")}
                </p>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={settings.showResults}
                onChange={() =>
                  setSettings({
                    ...settings,
                    showResults: !settings.showResults,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEditSettingsTab;

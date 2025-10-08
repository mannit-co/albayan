import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";

const CandidatesViewModal = ({ candidate, onClose }) => {
  const { t } = useLanguage();
  if (!candidate) return null; // If no candidate selected, don't render

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {t("candidatedetails")}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
            {t("personalinfo")}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">{t("name")}:</span>
                <span className="ml-2 font-medium">{candidate.name}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t("Email")}:</span>
                <span className="ml-2 font-medium">{candidate.email}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t("phone")}:</span>
                <span className="ml-2 font-medium"> {candidate.phone || candidate.personalInformation?.phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t("registrationdate")}:</span>
                <span className="ml-2 font-medium">{candidate.lastActivity}</span>
              </div>
            </div>
          </div>

          {/* Test History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">{t("testhistory")}</h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <div className="font-medium text-sm">Content Writing</div>
                  <div className="text-xs text-gray-500">2024-01-10</div>
                </div>
                <div className="font-bold text-sm text-blue-600">85%</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <div className="font-medium text-sm">Campaign Management</div>
                  <div className="text-xs text-gray-500">2024-01-08</div>
                </div>
                <div className="font-bold text-sm text-green-600">92%</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <div className="font-medium text-sm">Customer Engagement</div>
                  <div className="text-xs text-gray-500">2024-01-05</div>
                </div>
                <div className="font-bold text-sm text-yellow-600">78%</div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {t("performancesummary")}
            </h4>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{t("overallscore")}</div>
                <div className="text-2xl font-bold text-blue-600">
                  {candidate.averageScore}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: candidate.averageScore }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {candidate.testsCompleted}
                  </div>
                  <div className="text-gray-600">{t("testsattempted")}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {candidate.testsCompleted}
                  </div>
                  <div className="text-gray-600">{t("testspassed")}</div>
                </div>
                <div className="text-center col-span-2">
                  <div className="font-semibold text-gray-900">45 {t("min")}</div>
                  <div className="text-gray-600">{t("averagetimespent")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-900 mb-3">{t("quickactions")}</h4>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span>{t("sendmsg")}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <span>{t("schduleinterview")}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <span>{t("assignnewtest")}</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <span>{t("downloadfullreport")}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidatesViewModal;

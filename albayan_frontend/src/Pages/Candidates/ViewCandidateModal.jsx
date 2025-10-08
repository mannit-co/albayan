
import { FiX, FiUpload, FiFileText } from "react-icons/fi";
import { FaExclamationTriangle } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { useState, useEffect } from "react";
import { uid, BaseUrl } from "../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
//  View Candidate Modal
export const ViewCandidateModal = ({ show, onClose, candidate }) => {
  const { t } = useLanguage();
  if (!show || !candidate) return null;
  // console.log('view candidate', candidate)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("candidateDetails")}</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 flex-1">
          {/* Candidate Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">{candidate.initials}</span>
              </div> */}
              <div className="text-center sm:text-left">
                <h4 className="text-lg font-bold text-blue-900">{candidate.name}</h4>
                <p className="text-blue-700">{candidate.role}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${candidate.statusColor}`}>
                  {candidate.status}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-4">
            <h5 className="text-md font-semibold text-gray-900 mb-3">{t("contactInformation")}</h5>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("email")}</label>
                <p className="text-gray-900 text-sm">{candidate.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("phone")}</label>
                <p className="text-gray-900 text-sm">{candidate.phone}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("preferredLanguage")}</label>
                <p className="text-gray-900 text-sm">{candidate.preferredLanguage || t("notSpecified")}</p>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-4">
            <h5 className="text-md font-semibold text-gray-900 mb-3">{t("skills")}</h5>
            <div className="flex flex-wrap gap-1">
              {candidate.skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Test Progress */}
          {/* <div className="mb-4">
            <h5 className="text-md font-semibold text-gray-900 mb-3">Test Progress</h5>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-900">{candidate.completed}</p>
                <p className="text-gray-600 text-xs">Completed</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-900">{candidate.assigned}</p>
                <p className="text-gray-600 text-xs">Assigned</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-lg font-bold text-gray-900">{candidate.score}</p>
                <p className="text-gray-600 text-xs">Avg Score</p>
              </div>
            </div>
          </div> */}
          {/* Test Progress: Only show if assigned > 0 */}
          {candidate.assigned > 0 && (
            <div className="mb-4">
              <h5 className="text-md font-semibold text-gray-900 mb-3">{t("testProgress")}</h5>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-900">{candidate.completed}</p>
                  <p className="text-gray-600 text-xs">{t("completed")}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-900">{candidate.assigned}</p>
                  <p className="text-gray-600 text-xs">{t("assigned")}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-900">{candidate.score}</p>
                  <p className="text-gray-600 text-xs">{t("avgScore")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <p className="text-gray-500 text-xs">
            {t("addedOn")} {candidate.date}
          </p>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            onClick={onClose}
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};


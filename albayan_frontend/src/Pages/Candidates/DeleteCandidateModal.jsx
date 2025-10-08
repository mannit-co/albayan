
import { FiX, FiUpload, FiFileText } from "react-icons/fi";
import { FaExclamationTriangle } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { useState, useEffect } from "react";
import { uid, BaseUrl } from "../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
export const DeleteCandidateModal = ({ show, onClose, onDelete, candidateName  }) => {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!show) return null;

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await onDelete(); //  Call parent delete function
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header with icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <FaExclamationTriangle size={20} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{t("deleteCandidate")}</h3>
        </div>

       {/* Message */}
        <p className="text-gray-600 mb-6">
          {t("deleteCandidateConfirmation")}{" "}
          <span className="font-semibold text-gray-900">
            {candidateName || t("thisCandidate")}
          </span>
          ? {t("actionCannotBeUndone")}
        </p>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={onClose}
            disabled={isDeleting}
          >
            {t("cancel")}
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              isDeleting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

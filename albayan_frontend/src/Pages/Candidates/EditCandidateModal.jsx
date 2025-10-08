import { FiX, FiUpload, FiFileText } from "react-icons/fi";
import { FaExclamationTriangle } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { useState, useEffect } from "react";
import { uid, BaseUrl } from "../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; // default styling
import { useLanguage } from "../../contexts/LanguageContext";

export const EditCandidateModal = ({ show, onClose, candidate, handleUpdateCandidate }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(candidate || {});

  useEffect(() => {
    setFormData(candidate || {});
  }, [candidate]);

  if (!show || !candidate) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const updatedData = {
      ...formData,
      skills: Array.isArray(formData.skills)
        ? formData.skills
        : formData.skills
          ? formData.skills.split(",").map(s => s.trim())
          : []
    };


    const success = await handleUpdateCandidate(updatedData);
    if (success) {
      toast.success(t("candidateUpdatedSuccessfully"));
      onClose();
    } else {
      toast.error(t("failedToUpdateCandidate"));
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-4">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-lg font-semibold text-gray-900">{t("editCandidate", "Edit Candidate")}</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">{t("name")} *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")} *</label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("phone")}
            </label>
            <PhoneInput
              country={formData.countryCode?.replace("+", "").toLowerCase() || "in"} // default to India or use saved country
              value={formData.phone || ""}
              onChange={(phone, countryData) => {
                setFormData(prev => ({
                  ...prev,
                  phone: phone,
                  countryCode: `+${countryData.dialCode}`,
                  country: countryData.name,
                }));
              }}
              inputClass="!w-full !pl-14 !pr-3 !py-2 !border !border-gray-200 !rounded-lg focus:!ring-2 focus:!ring-blue-500 focus:!border-transparent"
              buttonClass="!border-gray-200 !bg-white"
              dropdownClass="!bg-white"
              enableSearch={true}
              countryCodeEditable={false}
            />
          </div>


          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("role")}</label>
            <input
              type="text"
              name="role"
              value={formData.role || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Skills */}
          {/* Skills */}
          <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">{t("skills")}</label>
            <input
              type="text"
              name="skills"
              value={formData.skills || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
              placeholder="JavaScript, React, Node.js"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>


          {/*  Status Dropdown */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status || "Registered"}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Registered">Registered</option>
              <option value="Assigned">Assigned</option>
              <option value="Invited">Invited</option>
              <option value="Failed">Failed</option>
              <option value="Plagiarism">Plagiarism</option>
            </select>
          </div> */}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={handleSave}
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

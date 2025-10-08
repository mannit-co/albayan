import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useLanguage } from "../../../contexts/LanguageContext";

const BasicInfoTab = ({ basicInfo, handleBasicInfoChange }) => {
  const { t } = useLanguage();
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim() !== "") {
      const updatedTags = [...(basicInfo.tags || []), tagInput.trim()];
      handleBasicInfoChange("tags", updatedTags);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = (basicInfo.tags || []).filter(
      (tag) => tag !== tagToRemove
    );
    handleBasicInfoChange("tags", updatedTags);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
       {t("basicInformation","Basic Information")}
      </h3>
      <div className="space-y-6">
        {/* Title + Skill */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("testTitle","Test Title")}
              <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder={t("enterTestTitle", "Enter Test Title")}
              value={basicInfo.title}
              required
              onChange={(e) => handleBasicInfoChange("title", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("skillSubject","Skill/Subject")}
              <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("skillSubjectPlaceholder", "e.g.,javascript programming")}
              value={basicInfo.skill}
              required
              onChange={(e) => handleBasicInfoChange("skill", e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("description","Description")}
          </label>
          <textarea
            rows="3"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t("describeTest")}
            value={basicInfo.description}
            onChange={(e) =>
              handleBasicInfoChange("description", e.target.value)
            }
          ></textarea>
        </div>

        {/* Duration + Category */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("durationMinutes","Duration (minutes) ")}
            </label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={basicInfo.duration ?? ""}
              onChange={(e) =>
                handleBasicInfoChange(
                  "duration",
                  e.target.value === "" ? "" : e.target.value // keep as string
                )
              }
            />
          </div>

          {/* LANGUAGE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("language", "Language")} <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={basicInfo.language}
              required
              onChange={(e) =>
                handleBasicInfoChange("language", e.target.value)
              }
            >
            <option value="" disabled>{t("select")}</option>
              <option value="English">{t("english", "English")}</option>
              <option value="Arabic">{t("arabic", "Arabic")}</option>
              <option value="French">{t("french","French")}</option>
              <option value="Spanish">{t("spanish","Spanish")}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             {t("difficulty","Difficulty")} <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={basicInfo.difficulty}
              required
              onChange={(e) =>
                handleBasicInfoChange("difficulty", e.target.value)
              }
            >
               <option value="" disabled>{t("select")}</option>
                <option value="Easy">{t("easy")}</option>
                <option value="Medium">{t("medium")}</option>
                <option value="Hard">{t("hard")}</option>
            </select>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("category", "Category")} <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={basicInfo.category}
              required
              onChange={(e) =>
                handleBasicInfoChange("category", e.target.value)
              }
            >
               <option value="" disabled>{t("select")}</option>
                <option value="Technical">{t("technical")}</option>
                <option value="Behavioral">{t("behavioral")}</option>
                <option value="Cognitive">{t("cognitive")}</option>
                <option value="Other">{t("other")}</option>
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("instructions","Instructions")}
          </label>
          <textarea
            rows="4"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("provideInstructions", "Provide instructions to the test takers...")}
            value={basicInfo.instructions}
            onChange={(e) =>
              handleBasicInfoChange("instructions", e.target.value)
            }
          ></textarea>
        </div>

        {/* 🔥 Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("tags","Tags")}
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {(basicInfo.tags || []).map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             placeholder={t("addTagPlaceholder" , "Add Tag...")}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaPlus className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;

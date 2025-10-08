import React, { useState, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import { useLanguage } from "../../../contexts/LanguageContext";

const TestEditBasicTab = ({ testData, setTestData }) => {
  const { t } = useLanguage();
  const tagInputRef = useRef(null); // ref to access input for button click

  // Function to add tag
  const addTag = () => {
    const input = tagInputRef.current;
    if (input && input.value.trim()) {
      setTestData({
        ...testData,
        tags: [...testData.tags, `#${input.value.trim()}`],
      });
      input.value = "";
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t("basicInformation","Basic Information")}
        </h3>

        <div className="space-y-6">
          {/* Title + Skill */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("testTitle","Test Title")} <span className="text-red-500 text-base font-bold">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("enterTestTitle", "Enter Test Title")}
                value={testData.title}
                required
                onChange={(e) =>
                  setTestData({ ...testData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("skillSubject","Skill/Subject")} <span className="text-red-500 text-base font-bold">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("skillSubjectPlaceholder", "e.g.,javascript programming")}
                value={testData.skill}
                onChange={(e) =>
                  setTestData({ ...testData, skill: e.target.value })
                }
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
              placeholder={t("describeTest","Describe what is this test evalutes...")}
              value={testData.description}
              onChange={(e) =>
                setTestData({ ...testData, description: e.target.value })
              }
            ></textarea>
          </div>

          {/* Duration, Difficulty, Category */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("durationMinutes","Duration (minutes) ")}
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={testData.duration  ?? ""}
                onChange={(e) =>
                  setTestData({
                    ...testData,
                     duration: e.target.value === "" ? "" : e.target.value, // keep as string
                  })
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
              value={testData.language}
              // onChange={(e) =>
              //   handleBasicInfoChange("language", e.target.value)
              // }
              onChange={(e) =>
                setTestData({ ...testData, language: e.target.value })
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
                value={testData.difficulty}
                onChange={(e) =>
                  setTestData({ ...testData, difficulty: e.target.value })
                }
              >
                <option value="" disabled>{t("select")}</option>
                <option value="Easy">{t("easy")}</option>
                <option value="Medium">{t("medium")}</option>
                <option value="Hard">{t("hard")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("category", "Category")} <span className="text-red-500 text-base font-bold">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={testData.category}
                onChange={(e) =>
                  setTestData({ ...testData, category: e.target.value })
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
              value={testData.instructions}
              onChange={(e) =>
                setTestData({ ...testData, instructions: e.target.value })
              }
            ></textarea>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("tags","Tags")}
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {testData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{tag}</span>
                  <button
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      const newTags = [...testData.tags];
                      newTags.splice(index, 1);
                      setTestData({ ...testData, tags: newTags });
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                ref={tagInputRef}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("addTagPlaceholder" , "Add Tag...")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title={t("addTag")}
              >
                <FaPlus className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestEditBasicTab;

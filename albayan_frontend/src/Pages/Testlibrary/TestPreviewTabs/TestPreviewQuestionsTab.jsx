

import React, { useState } from "react";
import { FiBookOpen } from "react-icons/fi";
import { useLanguage } from "../../../contexts/LanguageContext";

const TestPreviewQuestionsTab = ({ questions = [] }) => {
  const { t } = useLanguage();
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);

  // Parse stringified questions if necessary
  let parsedQuestions = questions;
  if (typeof questions === "string") {
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (e) {
      console.error("Failed to parse questions:", e);
      parsedQuestions = [];
    }
  }



  // Map API fields to UI-friendly fields
  const mappedQuestions = parsedQuestions.map((q) => {
    let options = [];

    // Handle different data structures for options
    if (Array.isArray(q.options)) {
      // For questions with options array (imported questions)
      options = q.options;
    } else if (Array.isArray(q.opts)) {
      // For legacy format
      options = q.opts;
    } else if (q.opts && typeof q.opts === "object") {
      // For DISC questions with opts object structure
      options = Object.values(q.opts).map(opt => {
        if (typeof opt === "object" && opt.text) {
          return opt.text;
        }
        return opt;
      });
    }

    // Determine question text - handle both q.text and q.q formats
    const questionText = q.text || q.q || "";

    return {
      id: q.id,
      title: questionText,
      text: questionText,
      type: q.type || "N/A",
      score: q.score ?? 0,
      options,
      answer: q.ans || q.answer || "",
      image: q.image || null, // Add image field
      imageName: q.imageName || null, // Add image name field
    };
  });

  const selectedQuestion =
    selectedQuestionIndex !== null
      ? mappedQuestions[selectedQuestionIndex]
      : null;

  // Helper to normalize option display
  const renderOptionLabel = (opt) => {
    if (typeof opt === "string") return opt;
    if (opt?.text) {
      if (typeof opt.text === "string") return opt.text;
      if (typeof opt.text === "object" && opt.text.text) return opt.text.text;
    }
    return JSON.stringify(opt); // fallback for debugging
  };
  // put this above return (inside component)
  const colorMap = {
    0: "bg-red-100 text-red-800",
    1: "bg-yellow-100 text-yellow-800",
    2: "bg-green-100 text-green-800",
    3: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px] md:h-[700px]">
      {/* Left: Questions List */}
      <div className="space-y-4 overflow-y-auto pr-2">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
          {t("questions")} ({mappedQuestions.length})
        </h3>

        {mappedQuestions.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <FiBookOpen className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm mb-2">{t("noQuestionsAvailable")}</p>
          </div>
        )}

        {mappedQuestions.map((q, idx) => (
          <div
            key={q.id || idx}
            onClick={() => setSelectedQuestionIndex(idx)}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md border-gray-200 hover:border-gray-300 ${selectedQuestionIndex === idx ? "border-blue-500 shadow-md" : ""
              }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {t("question")} {idx + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {q.type}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      {q.score} {t("score")}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{q.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Question Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-y-auto relative">
        {/* DISC Legend in top-right */}
        {selectedQuestion?.type?.toLowerCase() === "disc" && (
          <div className="flex space-x-2 float-end">
            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
              D
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              I
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              S
            </span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              C
            </span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("questionPreview", "Question Preview")}
        </h3>

        {selectedQuestion ? (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {selectedQuestion.title ||
                `${t("question")} ${selectedQuestionIndex + 1}`}
            </h4>

            {/* Display question text */}
            {/* {selectedQuestion.text && (
              <p className="text-gray-600 mb-3">{selectedQuestion.text}</p>
            )} */}

            {/* Display image if question type is Image */}
            {(selectedQuestion.type === "Image" || selectedQuestion.type?.toLowerCase() === "image") && selectedQuestion.image && (
              <div className="mb-4">
                <img
                  src={selectedQuestion.image}
                  alt="Question image"
                  className="max-w-full max-h-64 object-contain border rounded shadow-sm"
                />
              </div>
            )}

            {selectedQuestion.options?.length > 0 && (
              <div className="flex flex-wrap gap-2">

                {selectedQuestion.options.map((opt, i) => {
                  const label = renderOptionLabel(opt);
                  const answerValue = Array.isArray(selectedQuestion.answer)
                    ? selectedQuestion.answer.map(String) // normalize array of answers
                    : String(selectedQuestion.answer || ""); // fallback to empty string

                  const isAnswer =
                    answerValue === label ||
                    answerValue === String(opt) ||
                    answerValue
                      .split(",")
                      .map((a) => a.trim())
                      .includes(label);

                  // 🎨 apply DISC colors if type is DISC, else normal answer highlight
                  const baseColor =
                    selectedQuestion.type?.toLowerCase() === "disc"
                      ? colorMap[i] || "bg-gray-100 text-gray-700"
                      : isAnswer
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700";

                  return (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-sm ${baseColor}`}
                    >
                      {label}
                    </span>
                  );
                })}

              </div>
            )}

            {selectedQuestion.answer && !selectedQuestion.options?.length && (
              <p className="mt-2 text-sm text-gray-700">
                {t("answer")}: {selectedQuestion.answer}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500">
            <FiBookOpen className="w-12 h-12 text-gray-300 mb-3" />
            <p>{t("selectQuestionToPreview")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPreviewQuestionsTab;

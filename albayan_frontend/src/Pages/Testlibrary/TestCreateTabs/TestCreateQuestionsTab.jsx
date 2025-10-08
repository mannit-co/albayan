import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  FaUpload,
  FaPlus,
  FaCog,
  FaBookOpen,
  FaTrash,
  FaDownload,
} from "react-icons/fa";
import { uid, BaseUrl } from "../../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../../contexts/LanguageContext";

import AIQuestionGenerator from "../AIQuestionGenerator"; //  extracted AI part

const TestCreateQuestionsTab = ({
  questions,
  setQuestions,
  editorMode,
  setEditorMode,
  setShowImportModal,
  handleAddQuestion,
  handleDeleteQuestion,
  isEditingQuestion,
  currentQuestion,
  handleQuestionChange,
  handleOptionChange,
  handleCancelQuestion,
  handleSaveQuestion,
  selectedContentType,
  setSelectedContentType,
  selectedQuestions: parentSelectedQuestions,
  setSelectedQuestions: setParentSelectedQuestions,
}) => {
  const { t, currentLanguage } = useLanguage();
  // ===== State for Question Types =====
  const [questionTypes, setQuestionTypes] = useState([]);
  const [deleteModalData, setDeleteModalData] = useState(null); // { id, text }
  
  // ===== State for Question Selection =====
  const selectedQuestions = parentSelectedQuestions || [];
  const setSelectedQuestions = setParentSelectedQuestions || (() => {});
  const selectAllRef = useRef(null);

  // ===== Selection Logic =====
  const isAllSelected = useMemo(() => {
    return questions.length > 0 && selectedQuestions.length === questions.length;
  }, [selectedQuestions.length, questions.length]);

  const isIndeterminate = useMemo(() => {
    return selectedQuestions.length > 0 && selectedQuestions.length < questions.length;
  }, [selectedQuestions.length, questions.length]);

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all
      setSelectedQuestions([]);
    } else {
      // Select all questions
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  // Remove leading prefixes like "Ques :", "Question:", etc., and trim spaces
  const sanitizeQuestionText = (text) => {
    const s = String(text || "");
    // Remove leading quotes, whitespace, and any of: Ques, Question, q uestion, etc., with optional punctuation
    return s
      .replace(/^\s*["']?\s*(?:q\s*)?(?:uestion|question|ques(?:tion)?)\s*[.:;\-]*\s*/i, "")
      .trim();
  };

  const handleSelectQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const isQuestionSelected = (questionId) => {
    return selectedQuestions.includes(questionId);
  };

  // Update select all checkbox indeterminate state
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const hasFetched = useRef(false);

  const mapCategoryToType = (category_type) => {
    // Normalize to string for robust comparison
    const s = String(category_type ?? '').trim().toLowerCase();
    // Numeric codes (number or numeric string)
    // 1/2/3 are MCQ difficulty levels -> all should be SingleSelect
    if (s === '1' || s === '2' || s === '3') return 'SingleSelect';
    if (s === '4') return 'True/False';
    if (s === '5') return 'Descriptive';
    if (s === '6') return 'Fillup';
    if (s === '10') return 'Crossword';
    if (s === '11') return 'Match';
    // Textual categories from API
    if (s.includes('true') || s.includes('false')) return 'True/False';
    if (s.includes('yes') || s.includes('no')) return 'Yes/No';
    if (s.includes('single')) return 'SingleSelect';
    if (s.includes('multi')) return 'MultipleSelect';
    if (s.includes('fill')) return 'Fillup';
    if (s.includes('essay')) return 'Essay';
    if (s.includes('code')) return 'Coding';
    if (s.includes('disc')) return 'Disc';
    // Fallback
    return 'MultipleSelect';
  };

  const handleAIQuestions = (aiResponse) => {
    if (!aiResponse || aiResponse.length === 0) {
      toast.error("❌ No AI questions generated.");
      return;
    }

    const mapped = aiResponse.map((q, idx) => {
      console.log("qqqq", q);
      const options = Array.isArray(q.options) ? q.options : [];
      // Detect correct option index via * marker
      const correctOptionIndex = options.findIndex((opt) => typeof opt === 'string' && opt.includes("*"));
      // Clean options of * marker
      const cleanedOptions = options.map((opt) => (typeof opt === 'string' ? opt.replace("*", "").trim() : String(opt)));

      // Initial type from API category
      let type = mapCategoryToType(q.category_type);

      // Heuristics: if exactly 2 boolean-like options, force True/False or Yes/No
      const norm = (s) => String(s || '').trim().toLowerCase();
      if (cleanedOptions.length === 2) {
        const a = norm(cleanedOptions[0]);
        const b = norm(cleanedOptions[1]);
        const boolSet = new Set([a, b]);
        const isTF = boolSet.has('true') && boolSet.has('false');
        const isYN = boolSet.has('yes') && boolSet.has('no');
        if (isTF) type = 'True/False';
        else if (isYN) type = 'Yes/No';
      }

      // If not TF/YN and API did not specify multi, default to SingleSelect when only one correct is found
      if (type === 'MultipleSelect' || type === 'Multiple Select') {
        // leave as multiple if not a single-correct scenario
        const singleCorrect = correctOptionIndex >= 0;
        if (singleCorrect) {
          type = 'SingleSelect';
        }
      }

      return {
        id: questions.length + idx + 1,
        type,
        text: sanitizeQuestionText(Array.isArray(q.question) ? q.question[0] : q.question || ""),
        options: cleanedOptions,
        correctOption: correctOptionIndex,
        answer: cleanedOptions[correctOptionIndex] || "",
        score: 1,
        level: "",
        difficulty: "Medium",
        timeLimit: null,
      };
    });

    setQuestions((prev) => [...prev, ...mapped]);
    toast.success(`${t("imported")} ${mapped.length} ${t("questionsImportedSuccessfully","Questions Imported Successfully")}`);
  };

  // ===== Fetch Question Types from API =====
  const fetchQuestionTypes = async () => {
    try {
      const response = await fetch(`${BaseUrl}/redcombo?collname=QUESTYPE`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          xxxid: uid,
        },
      });

      const data = await response.json();
      console.log("QuestionType API Response:", data);

      if (data?.source?.QUESTYPE) {
        const typesArray = Object.entries(data.source.QUESTYPE).map(
          ([label, value]) => ({
            label,
            value,
          })
        );
        setQuestionTypes(typesArray);
      }
    } catch (error) {
      console.error("Error fetching question types:", error);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchQuestionTypes();
      hasFetched.current = true;
    }
  }, []);

  
  // ✅ Mandatory fields check
  const isSaveDisabled =
    !currentQuestion.type || currentQuestion.type.trim() === "" || 
    !currentQuestion.text || currentQuestion.text.trim() === "" ||
    (currentQuestion.type === "Image" && !currentQuestion.image); // Require image for Image type

  return (
    <div className="space-y-4">
      <Toaster position="top-right" reverseOrder={false} />

      {/* ===== Header Row (full width) ===== */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("questions")} ({questions.length})
        </h3>

        <div className="flex items-center space-x-2">
          {/* Download Sample Excel - Dynamic based on language */}
          <a
            href={currentLanguage === 'ar' ? "/arabic-sample.xlsx" : "/sample-questions.xlsx"}
            download
            className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            <FaDownload size={12} />
            <span>{t("sampleExcel")}</span>
          </a>

          {/* Download DISC Sample Excel - Dynamic based on language */}
          <a
            href={currentLanguage === 'ar' ? "/arabic-disc.xlsx" : "/sample-disc-questions.xlsx"}
            download
            className="flex items-center space-x-1 bg-purple-600 text-white px-2 py-1 text-sm rounded-md hover:bg-purple-700 transition-colors"
          >
            <FaDownload size={12} />
            <span>{t("discExcel")}</span>
          </a>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1 bg-red-400 text-white px-2 py-1 text-sm rounded-md hover:bg-red-500 transition-colors"
          >
            <FaUpload size={12} />
            <span>{t("import")}</span>
          </button>

          <button
            onClick={() => {
              setEditorMode("edit");
              handleAddQuestion();
            }}
            className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaPlus size={12} />
            <span>{t("add")}</span>
          </button>

          {/* AI Questions */}
          <button
            onClick={() => setEditorMode("ai")}
            className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            <FaCog size={12} />
            <span>{t("ai")}</span>
          </button>
        </div>
      </div>

      {/* ===== Two Panels Side by Side ===== */}
      <div className="flex gap-6 items-start">
        {/* ===== Left: Questions List (SCROLLABLE) ===== */}
        <div className="w-1/2 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Questions Header with Select All */}
          {questions.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="flex items-center space-x-2">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  title={isAllSelected ? "Unselect all questions" : "Select all questions"}
                />
                <label className="text-sm font-medium text-gray-700 cursor-pointer" onClick={handleSelectAll}>
                  {t("selectAll", "Select All")}
                </label>
              </div>
              <span className="text-xs text-gray-500">
                {selectedQuestions.length > 0 && (
                  <span className="text-blue-600 font-medium">
                    {selectedQuestions.length} {t("selected", "selected")} / 
                  </span>
                )}
                {questions.length} {t("questions", "questions")}
              </span>
            </div>
          )}
          {/* Empty State */}
          {questions.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <FaBookOpen className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm mb-2">{t("noQuestionsYet","No Questions Yet")}</p>
              <button
                onClick={handleAddQuestion}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t("addFirstQuestion","Add Your First Question")}
              </button>
            </div>
          )}

          {/* Question Cards */}
          {questions.length > 0 &&
            questions.map((q, index) => (
              <div
                key={q.id}
                className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                  isQuestionSelected(q.id)
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 cursor-pointer"
                      checked={isQuestionSelected(q.id)}
                      onChange={() => handleSelectQuestion(q.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {t("question","Question")} {index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {q.type}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          {q.score} {t("score","Score")}
                        </span>
                      </div>
                    </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {q.text}
                      </p>
                    </div>
                  </div>
                  <button
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    onClick={() => handleDeleteQuestion(q.id)}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* ===== Right: Editor / AI ===== */}
        <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {editorMode === "edit" && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("questions","Questions")} {t("edit","Edit")}
              </h3>
              {isEditingQuestion ? (
                <div className="space-y-4">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("questionType","Question Type")} {" "}
                      <span className="text-red-500 text-base font-bold">
                        *
                      </span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={currentQuestion.type || ""}
                      onChange={(e) =>
                        handleQuestionChange("type", e.target.value)
                      }
                    >
                      <option value="" >
                        {t("selectAType","Select a Type")}
                      </option>
                      {questionTypes.map((qt, idx) => (
                        <option key={idx} value={qt.value}>
                          {qt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("question","Question")}
                      <span className="text-red-500 text-base font-bold">
                        *
                      </span>
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t("enterQuestionText","Enter question text...")}
                      value={currentQuestion.text}
                      onChange={(e) =>
                        handleQuestionChange("text", e.target.value)
                      }
                    ></textarea>
                  </div>

                  {/* Image Upload - Only show for Image question type */}
                  {currentQuestion.type === "Image" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Image
                        <span className="text-red-500 text-base font-bold">
                          *
                        </span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Convert image to base64 binary data
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64String = event.target.result;
                              handleQuestionChange("image", base64String);
                              handleQuestionChange("imageName", file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {currentQuestion.image && (
                        <div className="mt-2">
                          <p className="text-sm text-green-700 font-medium mb-2">
                            Selected: {currentQuestion.imageName || "Image uploaded"}
                          </p>
                          <img 
                            src={currentQuestion.image} 
                            alt="Question preview" 
                            className="max-w-xs max-h-32 object-contain border rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Options for Image question type */}
                  {currentQuestion.type === "Image" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("answerOptions", "Answer Options")}
                      </label>

                      {currentQuestion.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          {/* Radio button for selecting single answer */}
                          <input
                            type="radio"
                            name="imageAnswer"
                            checked={currentQuestion.correctOption === idx}
                            onChange={() => {
                              handleQuestionChange("correctOption", idx);
                              // Update answer with Option format
                              handleQuestionChange(
                                "answer",
                                `Option ${idx + 1}`
                              );
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />

                          {/* Option text input */}
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`${t("option", "Option")} ${idx + 1}`}
                            value={opt || ""}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                          />
                        </div>
                      ))}

                      {/* Show Selected Answer */}
                      {currentQuestion.answer && (
                        <p className="mt-2 text-sm text-green-700 font-medium">
                          {t("selectedAnswer")}: {currentQuestion.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Options for Fill up question type */}
                  {(currentQuestion.type === "Fill up" || currentQuestion.type === "Fillup" || currentQuestion.type === "fill up") && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("answerOptions", "Answer Options")}
                      </label>

                      {currentQuestion.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          {/* Radio button for selecting single answer */}
                          <input
                            type="radio"
                            name="fillupAnswer"
                            checked={currentQuestion.correctOption === idx}
                            onChange={() => {
                              handleQuestionChange("correctOption", idx);
                              // Update answer with Option format
                              handleQuestionChange(
                                "answer",
                                `Option ${idx + 1}`
                              );
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />

                          {/* Option text input */}
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`${t("option", "Option")} ${idx + 1}`}
                            value={opt || ""}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                          />
                        </div>
                      ))}

                      {/* Show Selected Answer */}
                      {currentQuestion.answer && (
                        <p className="mt-2 text-sm text-green-700 font-medium">
                          {t("selectedAnswer")}: {currentQuestion.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Single Select Options */}
                  {currentQuestion.type === "SingleSelect" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("answerOptions", "Answer Options")}
                      </label>

                      {currentQuestion.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          {/* Radio button for selecting single answer */}
                          <input
                            type="radio"
                            name="singleSelectAnswer"
                            checked={currentQuestion.correctOption === idx}
                            onChange={() => {
                              handleQuestionChange("correctOption", idx);
                              // Update answer with Option format
                              handleQuestionChange(
                                "answer",
                                `Option ${idx + 1}`
                              );
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />

                          {/* Option text input */}
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`${t("option", "Option")} ${idx + 1}`}
                            value={opt || ""}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                          />
                        </div>
                      ))}

                      {/* Show Selected Answer */}
                      {currentQuestion.answer && (
                        <p className="mt-2 text-sm text-green-700 font-medium">
                          {t("selectedAnswer")}: {currentQuestion.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Multiple Select Options */}
                  {currentQuestion.type === "MultipleSelect" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("answerOptions", "Answer Options")}
                      </label>

                      {currentQuestion.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          {/* ✅ Checkbox for selecting multiple answers */}
                          <input
                            type="checkbox"
                            checked={currentQuestion.correctOptions.includes(
                              idx
                            )}
                            onChange={(e) => {
                              let updated = [...currentQuestion.correctOptions];
                              if (e.target.checked) {
                                updated.push(idx);
                              } else {
                                updated = updated.filter((i) => i !== idx);
                              }
                              handleQuestionChange("correctOptions", updated);
                              // ✅ Update answer with Option format (e.g. "Option 1,Option 2")
                              const selectedOptions = updated
                                .map((i) => `Option ${i + 1}`)
                                .join(",");
                              handleQuestionChange("answer", selectedOptions);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />

                          {/* Option text input */}
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`${t("option", "Option")} ${idx + 1}`}
                            value={opt || ""}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                          />
                        </div>
                      ))}

                      {/* ✅ Show Selected Answer(s) instead of dropdown */}
                      {currentQuestion.answer && (
                        <p className="mt-2 text-sm text-green-700 font-medium">
                          {t("selectedAnswers", "Selected Answer(s)")}: {currentQuestion.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {currentQuestion.type === "Disc" && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("answerOptions", "Answer Options")}
                      </label>

                      {[0, 1, 2, 3].map((index) => {
                        const firstTraits = [
                          "Dominance",
                          "Influence",
                          "Steadiness",
                          "Conscientiousness",
                        ];

                        const secondDropdownOptions = {
                          Dominance: [
                            "Assertiveness",
                            "Decisiveness",
                            "Control",
                            "Patience",
                          ],
                          Influence: [
                            "Optimism",
                            "Sociability",
                            "Persuasiveness",
                          ],
                          Steadiness: ["Supportiveness", "Patience"],
                          Conscientiousness: [
                            "Accuracy",
                            "Compliance",
                            "Analytical",
                          ],
                        };

                        const colorMap = {
                          Dominance: "bg-red-100",
                          Influence: "bg-yellow-100",
                          Steadiness: "bg-green-100",
                          Conscientiousness: "bg-blue-100",
                        };

                        const selectedFirst = firstTraits[index];
                        const secondOptions =
                          secondDropdownOptions[selectedFirst] || [];

                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50"
                          >
                            {/* Option Content */}
                            <div className="flex-1 space-y-2">
                              {/* Option text input */}
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={`${t("option", "Option")} ${index + 1}`}
                                value={currentQuestion.options[index] || ""}
                                onChange={(e) =>
                                  handleOptionChange(index, e.target.value)
                                }
                              />

                              {/* Fixed label + second dropdown */}
                              <div className="flex gap-2 items-center">
                                <span
                                  className={`w-28 text-xs px-2 py-1 border border-gray-300 rounded-md text-center font-medium ${colorMap[selectedFirst]}`}
                                >
                                  {selectedFirst}
                                </span>

                                <select
                                  className={`w-28 text-xs px-1 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-300 focus:border-transparent ${colorMap[selectedFirst]}`}
                                  value={
                                    currentQuestion[`dropdown2_${index}`] || ""
                                  }
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      `dropdown2_${index}`,
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="" disabled>
                                    {t("select")}
                                  </option>
                                  {secondOptions.map((opt, i) => (
                                    <option key={i} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay / Coding Grading Notes */}
                  {(currentQuestion.type === "Essay" ||
                    currentQuestion.type === "Coding") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("gradingNotes", "Grading Notes")} ({t("optional", "optional")})
                      </label>
                      <textarea
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t("addGradingNotes", "Add notes for manual grading...")}
                        value={currentQuestion.answer}
                        onChange={(e) =>
                          handleQuestionChange("answer", e.target.value)
                        }
                      ></textarea>
                    </div>
                  )}

                  {/* True/False & Yes/No */}
                  {(currentQuestion.type === "True/False" ||
                    currentQuestion.type === "Yes/No") && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("correctAnswer", "Correct Answer")}
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="booleanAnswer"
                            checked={
                              currentQuestion.answer === "True" ||
                              currentQuestion.answer === "Yes"
                            }
                            onChange={() =>
                              handleQuestionChange(
                                "answer",
                                currentQuestion.type === "Yes/No"
                                  ? "Yes"
                                  : "True"
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span>
                            {currentQuestion.type === "Yes/No" ? "Yes" : "True"}
                          </span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="booleanAnswer"
                            checked={
                              currentQuestion.answer === "False" ||
                              currentQuestion.answer === "No"
                            }
                            onChange={() =>
                              handleQuestionChange(
                                "answer",
                                currentQuestion.type === "Yes/No"
                                  ? "No"
                                  : "False"
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span>
                            {currentQuestion.type === "Yes/No" ? "No" : "False"}
                          </span>
                        </label>
                      </div>

                      {/*  Show selected answer */}
                      {currentQuestion.answer && (
                        <p className="mt-2 text-sm text-green-700 font-medium">
                          {t("selectedAnswer")}: {currentQuestion.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 🔥 Difficulty Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("difficulty")}
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={currentQuestion.level || ""}
                      onChange={(e) =>
                        handleQuestionChange("level", e.target.value)
                      }
                    >
                      <option value="">{t("difficulty")}</option>
                      <option value="Easy">{t("easy")}</option>
                      <option value="Medium">{t("medium")}</option>
                      <option value="Hard">{t("hard")}</option>
                    </select>
                  </div>

                  {/* Score & Time Limit */}
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("score")}
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentQuestion.score}
                        onChange={(e) =>
                          handleQuestionChange(
                            "score",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("timeLimitSeconds","Time Limit (seconds)")}
                      </label>
                      <input
                        type="number"
                        min="10"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={currentQuestion.timeLimit || ""}
                        onChange={(e) =>
                          handleQuestionChange(
                            "timeLimit",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      onClick={handleCancelQuestion}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={handleSaveQuestion}
                      disabled={isSaveDisabled}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isSaveDisabled
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {t("save")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <FaCog className="w-12 h-12 mb-3 text-gray-300" />
                  <p>{t("selectQuestionToEditOrAdd")}</p>
                </div>
              )}
            </>
          )}

          {editorMode === "ai" && (
            <AIQuestionGenerator
              setEditorMode={setEditorMode}
              selectedContentType={selectedContentType}
              setSelectedContentType={setSelectedContentType}
              onQuestionsGenerated={handleAIQuestions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCreateQuestionsTab;

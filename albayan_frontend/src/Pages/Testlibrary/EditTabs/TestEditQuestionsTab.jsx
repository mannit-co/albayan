import React, { useEffect, useState, useRef } from "react";
import {
  FaUpload,
  FaPlus,
  FaCog,
  FaBookOpen,
  FaTrash,
  FaDownload,
} from "react-icons/fa";
import { uid, BaseUrl } from "../../../Api/Api";
import AIQuestionGenerator from "../AIQuestionGenerator";
import TestQuestionsImportModal from "../../../components/TestQuestionsImportModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLanguage } from "../../../contexts/LanguageContext";

const TestEditQuestionsTab = ({
  questions: parentQuestions,
  isEditingQuestion,
  setQuestions,
  currentQuestion,
  setShowImportModal,
  handleAddQuestion,
  handleQuestionChange,
  handleOptionChange,
  handleCancelQuestion,
  handleSaveQuestion,
  resourceId,
  refreshTests,
  isQuestionBank = false,
  saveTick = 0,
}) => {
  const { t, currentLanguage } = useLanguage();
  const [skillInput, setSkillInput] = useState("");
  const [editorMode, setEditorMode] = useState("edit");
  const [selectedContentType, setSelectedContentType] = useState(null);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [deleteModalData, setDeleteModalData] = useState(null);
  const [showImportModalLocal, setShowImportModalLocal] = useState(false);
  const hasFetched = useRef(false);

  const questions = parentQuestions;

  useEffect(() => {
    if (resourceId) sessionStorage.setItem("editingResourceId", resourceId);
  }, [resourceId]);

  // ===== Fetch Question Types =====
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
      if (data?.source?.QUESTYPE) {
        const typesArray = Object.entries(data.source.QUESTYPE).map(
          ([label, value]) => ({ label, value })
        );
        setQuestionTypes(typesArray);
      }
    } catch (error) {
      console.error("Error fetching question types:", error);
    }
  };

  // Sanitize question text: remove leading labels like "Ques :" / "Question:" / "Q:" and trim
  const sanitizeQuestionText = (text) => {
    const s = String(text || "");
    // Remove leading quotes, whitespace, and any of: Ques, Question, q uestion, etc., with optional punctuation
    return s
      .replace(/^\s*["']?\s*(?:q\s*)?(?:uestion|question|ques(?:tion)?)\s*[.:;\-]*\s*/i, "")
      .trim();
  };

  useEffect(() => {
    if (!hasFetched.current) {
      fetchQuestionTypes();
      hasFetched.current = true;
    }
  }, []);


  // ✅ Mandatory fields check
  const skillsArray = Array.isArray(currentQuestion?.skills) ? currentQuestion.skills : [];
  const isSkillMissing = isQuestionBank && skillsArray.length === 0;
  const nonEmptyOptions = (currentQuestion?.options || []).filter((o) => (o || "").trim() !== "");
  const needsOptions = currentQuestion?.type === "MultipleSelect" || currentQuestion?.type === "SingleSelect";
  const hasAnswers = currentQuestion?.type === "MultipleSelect"
    ? (currentQuestion?.answer || "").trim() !== ""
    : currentQuestion?.type === "SingleSelect"
      ? Number.isInteger(currentQuestion?.correctOption)
      : true;
  const optionsValid = needsOptions ? (nonEmptyOptions.length >= 2 && hasAnswers) : true;

  const isSaveDisabled = !currentQuestion ||
    !currentQuestion.type ||
    !currentQuestion.text ||
    currentQuestion.type.trim() === "" ||
    currentQuestion.text.trim() === "" ||
    (currentQuestion.type === "Image" && !currentQuestion.image) ||
    isSkillMissing ||
    !optionsValid; // In Question Bank, skill + options/answers validation

  // Finalize requires at least one item already in the left list
  const canFinalize = Array.isArray(questions) && questions.length > 0;

  // ===== Map Backend category_type to UI type =====
  const mapCategoryToType = (categoryType) => {
    const s = String(categoryType ?? '').trim().toLowerCase();
    // Numeric codes (string or number)
    if (s === '1' || s === '2' || s === '3') return 'SingleSelect'; // MCQ difficulty
    if (s === '4') return 'True/False';
    if (s === '5') return 'Descriptive';
    if (s === '6') return 'Fillup';
    if (s === '10') return 'Crossword';
    if (s === '11') return 'Match';
    // Textual
    if (s.includes('true') || s.includes('false')) return 'True/False';
    if (s.includes('yes') || s.includes('no')) return 'Yes/No';
    if (s.includes('single')) return 'SingleSelect';
    if (s.includes('multi')) return 'MultipleSelect';
    if (s.includes('fill')) return 'Fillup';
    if (s.includes('essay')) return 'Essay';
    if (s.includes('code')) return 'Coding';
    if (s.includes('disc')) return 'Disc';
    return 'MultipleSelect';
  };

  // ===== Handle Delete =====
  const handleDeleteQuestionAPI = async (questionId) => {
    try {
      const filtered = questions.filter((q) => q.id !== questionId);

      const formattedQs = filtered.map((q, index) => ({
        id: `Q${String(index + 1).padStart(2, "0")}`,
        q: q.text,
        type: q.type,
        score: q.score ?? 1,
        level: q.level ?? "",
        time: q.timeLimit ?? null,
        // Include image data for Image question type
        image: q.image || null,
        imageName: q.imageName || null,
        ans:
          (q.type === "MultipleSelect" || q.type === "SingleSelect")
            ? q.answer || ""
            : q.answer || "",
        opts:
          (q.type === "MultipleSelect" || q.type === "SingleSelect")
            ? (q.options || []).reduce((acc, opt, idx) => {
              acc[`Option${idx + 1}`] = opt;
              return acc;
            }, {})
            : q.opts ?? {}, //  fallback to old opts
        notes:
          q.notes ||
          (q.type === "Essay" || q.type === "Coding" ? q.answer : ""),
        selAns: q.selectedAnswer || q.selAns || "",
      }));

      const storedData = sessionStorage.getItem("loginResponse");
      let token = null,
        userId = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
        userId = sourceObj._id?.$oid || sourceObj._id;
      }

      const resourceIdToUse = sessionStorage.getItem("editingResourceId");

      const payload = {
        qs: formattedQs,
        userId: { $oid: userId },
      };

      const response = await fetch(
        `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_TestLibrary&resourceId=${resourceIdToUse}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Failed to delete question");
      }

      setQuestions(filtered);
      toast.success(t("Questiondeletedsuccessfully"));
      setDeleteModalData(null);
      if (refreshTests) refreshTests();
    } catch (err) {
      toast.error(err.message || "Failed to delete question");
    }
  };

  // Clear local list after successful parent save
  useEffect(() => {
    if (typeof saveTick === 'number' && saveTick > 0) {
      setQuestions([]);
    }
  }, [saveTick]);
  // Directly delete question from the list without calling the API
  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id)); // Removes the question from the list
    // toast.success(t("Questiondeletedsuccessfully")); // Optionally show success toast
  };


  // ===== Save Handlers =====
  const handleSaveWrapper = (finalize = false) => {
    // Build the list to send to parent. When creating (finalize=false) while editing,
    // ensure currentQuestion is inserted/updated in the left list before saving.
    let listToSend = questions;
    if (!finalize && isEditingQuestion && currentQuestion) {
      const idx = listToSend.findIndex((q) => q.id === currentQuestion.id);
      if (idx >= 0) {
        listToSend = [
          ...listToSend.slice(0, idx),
          currentQuestion,
          ...listToSend.slice(idx + 1),
        ];
      } else {

        listToSend = [...listToSend, currentQuestion];
      }
    }

    handleSaveQuestion(listToSend, { finalize });
  };

  // ===== Handle Import Questions =====
  const handleImportQuestions = (importedQuestions) => {
    if (!importedQuestions || importedQuestions.length === 0) {
      toast.error("❌ No questions to import.");
      return;
    }

    setQuestions((prev) => [...prev, ...importedQuestions]);
    toast.success(
  `${t("successfullyimported")} ${importedQuestions.length} ${t("questions")}!`
);

    setShowImportModalLocal(false);
  };

  // ===== Normalize AI Response =====
  const handleAIQuestions = (aiResponse) => {
    if (!aiResponse || aiResponse.length === 0) {
      toast.error("❌ No AI questions generated.");
      return;
    }

    const mapped = aiResponse.map((q, idx) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const correctOptionIndex = options.findIndex((opt) => typeof opt === 'string' && opt.includes("*"));
      const cleanedOptions = options.map((opt) => (typeof opt === 'string' ? opt.replace("*", "").trim() : String(opt)));
      const paddedOptions = [...cleanedOptions];
      while (paddedOptions.length < 4) paddedOptions.push("");

      // Determine type
      let type = mapCategoryToType(q.category_type);
      const norm = (s) => String(s || '').trim().toLowerCase();
      if (cleanedOptions.length === 2) {
        const a = norm(cleanedOptions[0]);
        const b = norm(cleanedOptions[1]);
        const set = new Set([a, b]);
        const isTF = set.has('true') && set.has('false');
        const isYN = set.has('yes') && set.has('no');
        if (isTF) type = 'True/False';
        else if (isYN) type = 'Yes/No';
      }
      if (type === 'MultipleSelect' || type === 'Multiple Select') {
        const singleCorrect = correctOptionIndex >= 0;
        if (singleCorrect) type = 'SingleSelect';
      }

      return {
        id: `AI-${q.question_id || Date.now()}-${idx}`,
        type,
        text: sanitizeQuestionText(Array.isArray(q.question) ? q.question[0] : q.question || ""),
        options: paddedOptions,
        correctOption: correctOptionIndex === -1 ? 0 : correctOptionIndex,
        answer: paddedOptions[correctOptionIndex === -1 ? 0 : correctOptionIndex],
        score: 1,
        level: "",
        timeLimit: null,
        skills: Array.isArray(q.skills) ? q.skills : [],
      };
    });

    setQuestions((prev) => [...prev, ...mapped]);
    toast.success(` Added ${mapped.length} AI-generated questions!`);
  };

  return (
    <div className="space-y-4">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("questions", "Questions")} ({questions.length})
        </h3>

        <div className="flex items-center space-x-2">
          <a
            href={currentLanguage === 'ar' ? "/arabic-sample.xlsx" : "/sample-questions.xlsx"}
            download
            className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 text-sm rounded-md hover:bg-green-700"
          >
            <FaDownload size={12} />
            <span>{t("sampleExcel", "Sample Excel")}</span>
          </a>

          {/* Download DISC Sample Excel */}
          <a
            href={currentLanguage === 'ar' ? "/arabic-disc.xlsx" : "/sample-disc-questions.xlsx"}
            download
            className="flex items-center space-x-1 bg-purple-600 text-white px-2 py-1 text-sm rounded-md hover:bg-purple-700 transition-colors"
          >
            <FaDownload size={12} />
            <span>{t("discExcel", "DISC Excel")}</span>
          </a>

          <button
            onClick={() => setShowImportModalLocal(true)}
            className="flex items-center space-x-1 bg-red-400 text-white px-2 py-1 text-sm rounded-md hover:bg-red-500"
          >
            <FaUpload size={12} />
            <span>{t("import", "Import")} </span>
          </button>

          <button
            onClick={() => {
              setEditorMode("edit");
              handleAddQuestion();
            }}
            className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 text-sm rounded-md hover:bg-blue-700"
          >
            <FaPlus size={12} />
            <span>{t("add", "Add")} </span>
          </button>

          <button
            onClick={() => setEditorMode("ai")}
            className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 text-sm rounded-md hover:bg-green-700"
          >
            <FaCog size={12} />
            <span>{t("ai", "AI")}</span>
          </button>

          {/* Save button removed from editor for Question Bank; Save is handled by parent header */}
        </div>
      </div>

      {/* ===== Two Panels ===== */}
      <div className="flex gap-6 items-start">
        {/* Left list */}
        <div className="w-1/2 max-h-[500px] overflow-y-auto space-y-4">
          {questions.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <FaBookOpen className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm mb-2">{t("noQuestionsYet")}</p>
              <button
                onClick={handleAddQuestion}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t("addFirstQuestion")}
              </button>
            </div>
          )}

          {questions.map((q, index) => (
            <div
              key={q.id}
              className="p-4 border rounded-lg cursor-pointer hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      {t("question")}  {index + 1}
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
                <button
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                  onClick={() => handleDeleteQuestion(q.id)} // Directly call handleDeleteQuestion
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="w-1/2 bg-white rounded-xl shadow-sm border p-6">
          {editorMode === "ai" ? (
            <AIQuestionGenerator
              setEditorMode={setEditorMode}
              selectedContentType={selectedContentType}
              setSelectedContentType={setSelectedContentType}
              onQuestionsGenerated={handleAIQuestions}
            />
          ) : (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t("questionEditor")}
              </h3>
              {isEditingQuestion ? (
                <div className="space-y-4">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("questionType")} <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={currentQuestion.type || ""}
                      onChange={(e) =>
                        handleQuestionChange("type", e.target.value)
                      }
                    >
                      <option value="" disabled selected>
                        {t("selectType", )}
                      </option>
                      {questionTypes.map((qt, idx) => (
                        <option key={idx} value={qt.value}>
                          {qt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Skills (Question Bank only) */}
                  {isQuestionBank && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("skills", )} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., Java"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (skillInput || "").trim();
                              if (!val) return;
                              const set = new Set((currentQuestion.skills || []).map(s => s.toLowerCase()));
                              if (!set.has(val.toLowerCase())) {
                                handleQuestionChange("skills", [...(currentQuestion.skills || []), val]);
                              }
                              setSkillInput("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = (skillInput || "").trim();
                            if (!val) return;
                            const set = new Set((currentQuestion.skills || []).map(s => s.toLowerCase()));
                            if (!set.has(val.toLowerCase())) {
                              handleQuestionChange("skills", [...(currentQuestion.skills || []), val]);
                            }
                            setSkillInput("");
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          +
                        </button>
                      </div>
                      {isSkillMissing && (
                        <p className="mt-1 text-xs text-red-600">{t("skillRequired", "Skill is required.")}</p>
                      )}
                      {(currentQuestion.skills || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(currentQuestion.skills || []).map((s, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200">
                              {s}
                              <button
                                type="button"
                                onClick={() => {
                                  const next = (currentQuestion.skills || []).filter((x, i) => i !== idx);
                                  handleQuestionChange("skills", next);
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("question")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t("enterQuestionText")}
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
                        {t("questionimage")}
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
                            {t("selected")}: {currentQuestion.imageName || "Image uploaded"}
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
                        {t("answerOptions")}
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
                              handleQuestionChange("answer", `Option ${idx + 1}`);
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
                          {t("selectedAnswer", "Selected Answer")}: {currentQuestion.answer}
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
                              handleQuestionChange("answer", `Option ${idx + 1}`);
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
                          {t("selectedAnswer", "Selected Answer")}: {currentQuestion.answer}
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
                              handleQuestionChange("answer", `Option ${idx + 1}`);
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
                          {t("selectedAnswer", "Selected Answer")}: {currentQuestion.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {currentQuestion.type === "MultipleSelect" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("answerOptions", "Answer Options")}
                      </label>
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={
                              currentQuestion.answer
                                ? currentQuestion.answer
                                  .split(",")
                                  .includes(`Option ${index + 1}`)
                                : false
                            }
                            onChange={(e) => {
                              let selectedAnswers = currentQuestion.answer
                                ? currentQuestion.answer.split(",")
                                : [];

                              const optionValue = `Option ${index + 1}`;
                              if (e.target.checked) {
                                if (!selectedAnswers.includes(optionValue)) {
                                  selectedAnswers.push(optionValue);
                                }
                              } else {
                                selectedAnswers = selectedAnswers.filter(
                                  (a) => a !== optionValue
                                );
                              }

                              handleQuestionChange(
                                "answer",
                                selectedAnswers.join(",")
                              );
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`${t("option", "Option")} ${index + 1}`}
                            value={currentQuestion.options[index] || ""}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                          />
                        </div>
                      ))}
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

                  {/* Essay / Coding */}
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
                  {/* True/False & Yes/No */}
                  {(currentQuestion.type === "True/False" ||
                    currentQuestion.type === "Yes/No") && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t("correctAnswer",)}
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
                                  currentQuestion.type === "Yes/No" ? "Yes" : "True"
                                )
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span>{currentQuestion.type === "Yes/No" ? "Yes" : "True"}</span>
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
                                  currentQuestion.type === "Yes/No" ? "No" : "False"
                                )
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span>{currentQuestion.type === "Yes/No" ? "No" : "False"}</span>
                          </label>
                        </div>
                      </div>
                    )}


                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("difficulty", "Difficulty")}
                    </label>

                    <select
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={currentQuestion.level || ""}
                      onChange={(e) =>
                        handleQuestionChange("level", e.target.value)
                      }
                    >
                      <option value="" disabled selected>{t("selectDifficulty", "Difficulty")}</option>
                      <option value="Easy">{t("easy")}</option>
                      <option value="Medium">{t("medium")}</option>
                      <option value="Hard">{t("hard")}</option>
                    </select>
                  </div>

                  {/* Score & Time */}
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
                        {t("timeLimitSeconds")}
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
                      onClick={() => handleSaveWrapper(false)}
                      disabled={isSaveDisabled}
                      className={`px-4 py-2 rounded-lg transition-colors ${isSaveDisabled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      {t("createQuestion")}
                    </button>
                    {/* Save button is removed for Question Bank; handled by parent header */}
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <FaCog className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="mb-2">{t("noQuestionsYet", "No questions yet")}</p>
                  <button
                    onClick={handleAddQuestion}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {t("addFirstQuestion", "Add your first question")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* ===== Delete Modal ===== */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("confirmDelete", "Confirm Delete")}
            </h3>
            <p className="text-sm text-gray-700">
              {t("deleteConfirmationQuestion", "Are you sure you want to delete this question:")}
            </p>
            <p className="text-sm text-gray-800 font-medium border p-2 rounded bg-gray-50">
              "{deleteModalData.text}"
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setDeleteModalData(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleDeleteQuestionAPI(deleteModalData.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Import Modal ===== */}
      {showImportModalLocal && (
        <TestQuestionsImportModal
          isOpen={showImportModalLocal}
          onClose={() => setShowImportModalLocal(false)}
          onImport={handleImportQuestions}
        />
      )}
    </div>
  );
};

export default TestEditQuestionsTab;

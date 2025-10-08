import React, { useState } from "react";
import { FaArrowLeft, FaSave, FaBookOpen, FaCog } from "react-icons/fa";
import { BaseUrl, uid, SuperAdminID } from "../../../Api/Api";
import { ToastContainer, toast } from "react-toastify";
import * as XLSX from "xlsx"; //  Excel parser
import "react-toastify/dist/ReactToastify.css";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "../../../contexts/LanguageContext";

// Import the tab components
import BasicInfoTab from "./TestCreateBasicInfoTab";
import QuestionsTab from "./TestCreateQuestionsTab";
import TestSettings from "./TestCreateSettingsTab";
import TestQuestionsModal from "../TestQuestionsModal";

const TestCreate = ({ onBack, onTestCreated }) => {
  const { t, currentLanguage } = useLanguage();
  // 🔥 State
  const [editorMode, setEditorMode] = useState("edit");
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedContentType, setSelectedContentType] = useState("Text");

  // Basic information state
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    skill: "",
    description: "",
    language: "",
    duration: 60,
    difficulty: "",
    category: "",
    instructions: "",
    tags: [],
  });

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState({
    id: null,
    title: "",
    type: "Multiple Select",
    level: "",
    score: 1,
    text: "",
    options: ["", "", "", ""],
    correctOptions: [], 
    answer: "",
    image: null,
    imageName: null,
  });

  // Settings state
  const [settings, setSettings] = useState({
    passingScore: "",
    maxAttempts: "",
    status: "",
    plagiarismDetection: false,
    randomizeQuestions: false,
    showResults: false,
  });

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Selected questions state
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Helper function to convert English values to selected language
  const getLocalizedValue = (englishValue, type) => {
    if (currentLanguage === 'en') return englishValue; // Keep English if English is selected
    
    switch (type) {
      case 'difficulty':
        if (englishValue === 'Easy') return t('easy');
        if (englishValue === 'Medium') return t('medium');
        if (englishValue === 'Hard') return t('hard');
        return englishValue;
      case 'category':
        if (englishValue === 'Technical') return t('technical');
        if (englishValue === 'Behavioral') return t('behavioral');
        if (englishValue === 'Cognitive') return t('cognitive');
        if (englishValue === 'Other') return t('other');
        return englishValue;
      case 'language':
        if (englishValue === 'English') return t('english');
        if (englishValue === 'Arabic') return t('arabic');
        if (englishValue === 'French') return t('french');
        if (englishValue === 'Spanish') return t('spanish');
        return englishValue;
      case 'status':
        if (englishValue === 'Active') return t('active');
        if (englishValue === 'Draft') return t('draft');
        if (englishValue === 'Archived') return t('archived');
        return englishValue;
      default:
        return englishValue;
    }
  };

  // ================= VALIDATION ==================
  const validateBasicInfo = () => {
    return basicInfo.title.trim() !== "" && basicInfo.skill.trim() !== "" && basicInfo.language.trim() !== "" && basicInfo.difficulty.trim() !== "" && basicInfo.category.trim() !== "";
  };

  // const validateQuestions = () => {
  //   if (questions.length === 0) return false;
  //   return questions.every((q) => q.type?.trim() && q.text?.trim());
  // };

  const validateQuestions = () => {
    if (questions.length === 0) return false;
    return questions.every(
      (q) =>
        String(q.type || "").trim() !== "" &&
        String(q.text || "").trim() !== ""
    );
  };
  

  const validateSettings = () => {
    return (
      settings.passingScore >= 0 &&
      settings.passingScore <= 100 &&
      settings.maxAttempts > 0
    );
  };

  const isCurrentTabValid = () => {
    if (activeTab === "basic") return validateBasicInfo();
    if (activeTab === "questions") return validateQuestions();
    if (activeTab === "settings") return validateSettings();
    return false;
  };

  // ================= HANDLERS ==================
  const handleBasicInfoChange = (field, value) => {
    setBasicInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    handleQuestionChange("options", newOptions);
  };

  const handleAddQuestion = () => {
    setIsEditingQuestion(true);
    setCurrentQuestion({
      id: null,
      title: "",
      type: "Multiple Select",
      level: "",
      score: 1,
      text: "",
      options: ["", "", "", ""],
      correctOptions: [],
      answer: "",
      image: null,
      imageName: null,
    });
  };

  const normalizeQuestion = (q) => {
    let formatted = { ...q };

    // Handle image data for Image question type
    if (q.type === "Image" && q.image) {
      formatted.image = q.image; // Store base64 image data
      formatted.imageName = q.imageName; // Store image name
    }

    if (q.type === "Multiple Select") {
      formatted.opts = (q.options || []).reduce((acc, opt, idx) => {
        if (opt && String(opt).trim() !== "") {
          acc[`Option${idx + 1}`] = String(opt).trim();
        }
        return acc;
      }, {});

      // ✅ Support multiple correct answers
      if (Array.isArray(q.correctOptions) && q.correctOptions.length > 0) {
        formatted.ans = q.correctOptions.map((i) => i + 1).join(","); // e.g. "1,2"
      } else {
        formatted.ans = "";
      }
    } else if (q.type === "Disc") {
      const traits = [
        "Dominance",
        "Influence",
        "Steadiness",
        "Conscientiousness",
      ];

      formatted.opts = q.options.reduce((acc, opt, idx) => {
        if (opt && String(opt).trim() !== "") {
          acc[`Option${idx + 1}`] = {
            text: String(opt).trim(),
            trait: traits[idx] || "",
            subtrait: q[`dropdown2_${idx}`] || "",
          };
        }

        return acc;
      }, {});

      // ✅ Store *all* options (not just selected)
      formatted.ans = formatted.opts;
    } else {
      formatted.opts = {};
      formatted.ans = q.answer || "";
    }

    return formatted;
  };

  const handleSaveQuestion = () => {
    if (currentQuestion.id) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === currentQuestion.id ? normalizeQuestion(currentQuestion) : q
        )
      );
    } else {
      const newQuestion = normalizeQuestion({
        ...currentQuestion,
        id: questions.length + 1,
      });
      setQuestions((prev) => [...prev, newQuestion]);
    }

    // reset form
    setIsEditingQuestion(false);
    setCurrentQuestion({
      id: null,
      title: "",
      type: "Multiple Select",
      level: "",
      score: 1,
      text: "",
      options: ["", "", "", ""],
      correctOptions: [],
      answer: "",
      image: null,
      imageName: null,
    });
  };

  const handleCancelQuestion = () => {
    setIsEditingQuestion(false);
    setCurrentQuestion({
      id: null,
      title: "",
      type: "Multiple Select",
      level: "",
      score: 1,
      text: "",
      options: ["", "", "", ""],
      correctOptions: [],
      answer: "",
      image: null,
      imageName: null,
    });
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    // Remove deleted question from selected questions
    setSelectedQuestions((prev) => prev.filter((qId) => qId !== id));
  };

  // ================= API CALL ==================
  const handleSaveTest = async () => {
    if (isSaving) return; // 🚨 prevent double-click
    setIsSaving(true);

    try {
      // 🚨 Final validation before save
      if (!validateBasicInfo()) {
        toast.error(t("pleaseFillRequiredBasicInfo","Please fill Required Basic Info"));
        setActiveTab("basic");
        setIsSaving(false);
        return;
      }
      if (!validateQuestions()) {
        toast.error(t("pleaseAddValidQuestion","Please add valid question"));
        setActiveTab("questions");
        setIsSaving(false);
        return;
      }
      if (!validateSettings()) {
        toast.error(t("pleaseFixSettings","Please fix settings"));
        setActiveTab("settings");
        setIsSaving(false);
        return;
      }

      // Format all questions together (including DISC)
      const formattedQuestions = questions.map((q, index) => ({
        id: `Q${String(index + 1).padStart(2, "0")}`,
        q: q.text,
        type: q.type,
        level: q.level,
        score: q.score,
        time:
          q.time ||
          q.timeLimit ||
          Math.floor(Math.random() * (120 - 30 + 1)) + 30,
        // Include image data for Image question type
        image: q.image || null,
        imageName: q.imageName || null,

        //  Use normalized ans/opts if present, otherwise fallback
        ans:
          q.ans !== undefined
            ? q.ans
            : q.type === "Multiple Select"
            ? `Option ${q.correctOption + 1}`
            : q.type === "Disc"
            ? q.opts || {}
            : q.answer || "",

        opts:
          q.opts && Object.keys(q.opts).length > 0
            ? q.opts
            : q.type === "Disc"
            ? q.options.reduce((acc, opt, idx) => {
                if (opt && String(opt).trim() !== "") {
                  const traits = ["Dominance", "Influence", "Steadiness", "Conscientiousness"];
                  acc[`Option${idx + 1}`] = {
                    text: String(opt).trim(),
                    trait: traits[idx] || "",
                    subtrait: q[`dropdown2_${idx}`] || "",
                  };
                }
                return acc;
              }, {})
            : q.options
            ? q.options.reduce((acc, opt, idx) => {
                acc[`Option${idx + 1}`] = opt;
                return acc;
              }, {})
            : {},

        notes: q.type === "Essay" || q.type === "Coding" ? q.answer : "",
        selAns: q.selectedAnswer || "",
      }));

      console.log("Formatted Questions:", formattedQuestions);

      //  Extract token + userId first
      const storedData = sessionStorage.getItem("loginResponse");
      let token = null;
      let userId = null;
      let creator = null;

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.source) {
          const sourceObj = JSON.parse(parsedData.source);
          token = sourceObj.token;
          userId = sourceObj._id?.$oid || sourceObj._id || null;
          creator = sourceObj.firstName || "Unknown";
        }
      }

      if (!token || !userId) throw new Error("Token or UserId not found");
      const tid = uuidv4();

      // Save all questions (including DISC) to TestLibrary
      const payload = {
        tid, //  store test ID
        title: basicInfo.title,
        skill: basicInfo.skill,
        desc: basicInfo.description,
        dur: basicInfo.duration,
        lan: getLocalizedValue(basicInfo.language, 'language'),
        diff: getLocalizedValue(basicInfo.difficulty, 'difficulty'),
        cat: getLocalizedValue(basicInfo.category, 'category'),
        instr: basicInfo.instructions,
        tags: basicInfo.tags || [],
        qs: formattedQuestions,
        pass: settings.passingScore,
        attempts: settings.maxAttempts,
        status: getLocalizedValue(settings.status, 'status'),
        plag: settings.plagiarismDetection,
        shuffle: settings.randomizeQuestions,
        showRes: settings.showResults,
        created: new Date().toISOString(),
        userId: { $oid: userId },
        creator,
        sa: SuperAdminID,
      };

      const response = await fetch(
        `${BaseUrl}/auth/eCreateCol?colname=${uid}_TestLibrary`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to save test");

      // Show success message
      const totalQuestions = questions.length;
      const successMessage = `${t("testCreatedSuccessfully","Test Created Successfully")} ${totalQuestions} ${t("questions","Questions")} ${t("savedToTestLibrary","Saved to Test Library")}.`;
      
      toast.success(successMessage);

      if (onTestCreated) onTestCreated({ success: true, message: successMessage });
      if (onBack) onBack();
    } catch (err) {
      console.error("Error saving test:", err);
      toast.error(t("failedToCreateTest","Failed to create test"));
    } finally {
      setIsSaving(false); //  re-enable button after request completes
    }
  };

  const handleNextTab = () => {
    if (activeTab === "basic") setActiveTab("questions");
    else if (activeTab === "questions") setActiveTab("settings");
    else if (activeTab === "settings") handleSaveTest();
  };

  const handleImportQuestions = (parsedQuestions) => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      toast.error(t("noValidQuestions","No valid questions"));
      return;
    }

    const mapped = parsedQuestions.map((q, idx) =>
      normalizeQuestion({
        id: questions.length + idx + 1,
        ...q,
      })
    );

    setQuestions((prev) => [...prev, ...mapped]);
    toast.success(`${t("imported","Imported")} ${mapped.length} ${t("questionsImportedSuccessfully","Questions Imported Successfully")}`);
    setShowImportModal(false);
  };

  //  Handle AI-generated questions

  // ================== RENDER ==================
  return (
    <main className="flex-1 overflow-auto">
      <ToastContainer position="top-right" autoClose={3000} />

      <div>
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft />
            <span>{t("backToTestLibrary","Back To TestLibrary")}</span>
          </button>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("createNewTest")}
              </h1>
              <p className="text-gray-600">{t("createNewAssessmentTest","Create a new assessment test ")}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "basic"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("basic")}
            >
              <FaBookOpen />
              <span>{t("basicInformation")}</span>
            </button>
            <button
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "questions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("questions")}
            >
              <FaCog />
              <span>{t("questions")}</span>
            </button>
            <button
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <FaCog />
              <span>{t("settings")}</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-w-8xl">
          {activeTab === "basic" && (
            <BasicInfoTab
              basicInfo={basicInfo}
              handleBasicInfoChange={handleBasicInfoChange}
            />
          )}

          {activeTab === "questions" && (
            <QuestionsTab
              questions={questions}
              setQuestions={setQuestions}
              editorMode={editorMode}
              setEditorMode={setEditorMode}
              setShowImportModal={setShowImportModal}
              handleAddQuestion={handleAddQuestion}
              handleDeleteQuestion={handleDeleteQuestion}
              isEditingQuestion={isEditingQuestion}
              currentQuestion={currentQuestion}
              handleQuestionChange={handleQuestionChange}
              handleOptionChange={handleOptionChange}
              handleCancelQuestion={handleCancelQuestion}
              handleSaveQuestion={handleSaveQuestion}
              selectedContentType={selectedContentType}
              setSelectedContentType={setSelectedContentType}
              selectedQuestions={selectedQuestions}
              setSelectedQuestions={setSelectedQuestions}
            />
          )}

          {activeTab === "settings" && (
            <TestSettings settings={settings} setSettings={setSettings} />
          )}
        </div>

        {/* Save & Next / Finish & Save Button */}
        <div className="flex justify-end mt-8">
          <button
            type="submit"
            onClick={handleNextTab}
            disabled={isSaving || !isCurrentTabValid()} // 🚨 disable when saving
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              isSaving || !isCurrentTabValid()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <FaSave className={isSaving ? "animate-spin" : ""} />{" "}
            {/* 🔥 optional spinner */}
            <span>
              {isSaving
                ? t("processing") // 🚨 feedback to user
                : activeTab === "settings"
                ? t("save")
                : `${t("save")} & ${t("next")}` }
            </span>
          </button>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <TestQuestionsModal
            onClose={() => setShowImportModal(false)}
            onImport={handleImportQuestions}
          />
        )}
      </div>
    </main>
  );
};

export default TestCreate;

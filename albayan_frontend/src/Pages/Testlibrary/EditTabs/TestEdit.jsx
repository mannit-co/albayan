import React, { useState, useEffect } from "react";
import { FaPlus, FaEye, FaSave, FaBookOpen, FaCog } from "react-icons/fa";
import TestQuestionsModal from "../TestQuestionsModal";
import TestEditBasicTab from "./TestEditBasicTab";
import TestEditQuestionsTab from "./TestEditQuestionsTab";
import TestEditSettingsTab from "./TestEditSettingsTab";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../../contexts/LanguageContext";

import { BaseUrl, uid } from "../../../Api/Api";

const TestEdit = ({ test, onBack }) => {
  const { t, currentLanguage } = useLanguage();
  // inside TestEdit

  const [testData, setTestData] = useState({
    title: "",
    skill: "",
    language: "",
    description: "",
    duration: 0,
    difficulty: "",
    category: "",
    instructions: "",
    tags: [],
  });

  const [questions, setQuestions] = useState([]);
  const [settings, setSettings] = useState({
    passingScore: 0,
    maxAttempts: 0,
    status: "",
    plagiarismDetection: false,
    randomizeQuestions: false,
    showResults: false,
  });

  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    id: null,
    title: "",
    type: "Multiple Select",
    score: 1,
    level: "",
    text: "",
    options: ["", "", "", ""],
    correctOption: null,
    answer: "",
    image: null,
    imageName: null,
  });

  const [showImportModal, setShowImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [resourceId, setResourceId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ========= Parse incoming test ==========
  useEffect(() => {
    if (test) {
      let parsed = test;
      if (typeof test === "string") {
        try {
          parsed = JSON.parse(test);
        } catch (err) {
          console.error("❌ Error parsing test:", err);
        }
      }

      if (parsed) {
        const resId = parsed._id?.$oid || null;
        setResourceId(resId);

        const mappedQs = (parsed.qs || []).map((q, idx) => ({
          id: `Q_${Date.now()}_${Math.random()}_${idx}`,
          title: q.q ? q.q.slice(0, 40) : `Untitled Question ${idx + 1}`,
          type: q.type || "Multiple Select",
          score: q.score || 1,
          level: q.level || "",
          text: q.q || "",
          options: q.opts ? Object.values(q.opts) : ["", "", "", ""],
          correctOption:
            typeof q.ans === "string" && q.ans.startsWith("Option")
              ? parseInt(q.ans.split(" ")[1], 10) - 1
              : null,
          answer: q.ans || "",
          timeLimit: q.time || null,
          image: q.image || null,
          imageName: q.imageName || null,
        }));

        setTestData({
          title: parsed.title || "",
          skill: parsed.skill || "",
          language: getEnglishValue(parsed.lan || parsed.language || "", 'language'),
          description: parsed.desc || "",
          duration: parsed.dur || 60,
          difficulty: getEnglishValue(parsed.diff || "", 'difficulty'),
          category: getEnglishValue(parsed.cat || "", 'category'),
          instructions: parsed.instr || "",
          tags: parsed.tags || [],
        });

        setQuestions(mappedQs);

        setSettings({
          passingScore: parsed.pass ?? 0,
          maxAttempts: parsed.attempts ?? 0,
          status: getEnglishValue(parsed.status || "", 'status'),
          plagiarismDetection: parsed.plag ?? false,
          randomizeQuestions: parsed.shuffle ?? false,
          showResults: parsed.showRes ?? false,
        });
      }
    }
  }, [test]);

  // ========= Handlers ==========
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
      score: 1,
      level: "",
      text: "",
      options: ["", "", "", ""],
      correctOption: null,
      answer: "",
      image: null,
      imageName: null,
    });
  };

  const handleSaveQuestion = () => {
    // Build the final question with ans + opts
    const q = {
      ...currentQuestion,
      ans:
        currentQuestion.type === "Multiple Select" || currentQuestion.type === "SingleSelect" || currentQuestion.type === "Image" || currentQuestion.type === "Fill up" || currentQuestion.type === "Fillup"
          ? currentQuestion.answer || ""
          : currentQuestion.type === "Disc"
          ? currentQuestion.options.reduce((acc, opt, idx) => {
              acc[`Option${idx + 1}`] = {
                text: opt,
                trait: currentQuestion[`dropdown1_${idx}`] || "",
                subtrait: currentQuestion[`dropdown2_${idx}`] || "",
              };
              return acc;
            }, {})
          : currentQuestion.answer || "",

      opts:
        currentQuestion.type === "Multiple Select" ||
        currentQuestion.type === "MultipleSelect" ||
        currentQuestion.type === "SingleSelect" ||
        currentQuestion.type === "Image" ||
        currentQuestion.type === "Fill up" ||
        currentQuestion.type === "Fillup" ||
        currentQuestion.type === "Disc"
          ? currentQuestion.options.reduce((acc, opt, idx) => {
              if (currentQuestion.type === "Disc") {
                acc[`Option${idx + 1}`] = {
                  text: opt,
                  trait: currentQuestion[`dropdown1_${idx}`] || "",
                  subtrait: currentQuestion[`dropdown2_${idx}`] || "",
                };
              } else {
                acc[`Option${idx + 1}`] = opt;
              }
              return acc;
            }, {})
          : currentQuestion.opts || {},
    };
    if (currentQuestion.id) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === currentQuestion.id ? { ...currentQuestion } : q
        )
      );
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          ...currentQuestion,
          id: `Q_${Date.now()}_${Math.random()}`, //  runtime unique
        },
      ]);
    }
    setIsEditingQuestion(false);
    setCurrentQuestion({
      id: null,
      title: "",
      type: "Multiple Select",
      score: 1,
      level: "",
      text: "",
      options: ["", "", "", ""],
      correctOption: null,
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
      score: 1,
      level: "",
      text: "",
      options: ["", "", "", ""],
      correctOption: null,
      answer: "",
      image: null,
      imageName: null,
    });
  };

  const handleDeleteQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // ========= Save ==========
  // Helper function to convert stored localized values back to English for form dropdowns
  const getEnglishValue = (localizedValue, type) => {
    if (!localizedValue) return localizedValue;
    
    switch (type) {
      case 'difficulty':
        // Check against all possible translations
        if (localizedValue === t('easy') || localizedValue === 'Easy') return 'Easy';
        if (localizedValue === t('medium') || localizedValue === 'Medium') return 'Medium';
        if (localizedValue === t('hard') || localizedValue === 'Hard') return 'Hard';
        return localizedValue;
      case 'category':
        if (localizedValue === t('technical') || localizedValue === 'Technical') return 'Technical';
        if (localizedValue === t('behavioral') || localizedValue === 'Behavioral') return 'Behavioral';
        if (localizedValue === t('cognitive') || localizedValue === 'Cognitive') return 'Cognitive';
        if (localizedValue === t('other') || localizedValue === 'Other') return 'Other';
        return localizedValue;
      case 'language':
        if (localizedValue === t('english') || localizedValue === 'English') return 'English';
        if (localizedValue === t('arabic') || localizedValue === 'Arabic') return 'Arabic';
        if (localizedValue === t('french') || localizedValue === 'French') return 'French';
        if (localizedValue === t('spanish') || localizedValue === 'Spanish') return 'Spanish';
        return localizedValue;
      case 'status':
        if (localizedValue === t('active') || localizedValue === 'Active') return 'Active';
        if (localizedValue === t('draft') || localizedValue === 'Draft') return 'Draft';
        if (localizedValue === t('archived') || localizedValue === 'Archived') return 'Archived';
        return localizedValue;
      default:
        return localizedValue;
    }
  };

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

  const handleSave = async () => {

  

    if (!resourceId) {
      toast.error("❌ Resource ID missing. Cannot save test.");
      return;
    }


        // ✅ Validation
  if (!testData.title?.trim()) {
    toast.error(t("testTitleRequired" , "Test title is required"));
    setActiveTab("basic"); // jump user back to Basic Info tab
    return;
  }
  if (!testData.skill?.trim()) {
    toast.error(t("skillRequired" , "Skill/Subject is required"));
    setActiveTab("basic");
    return;
  }

  if (!testData.language?.trim()) {
    toast.error(t("languageRequired" , "Language is required"));
    setActiveTab("basic");
    return;
  }
  

  if(!testData.difficulty?.trim()) {
    toast.error(t("difficultyRequired" , "Difficulty is required"));
    setActiveTab("basic");
    return;
  }

  if(!testData.category?.trim()) {
    toast.error(t("categoryRequired","Category is required"));
    setActiveTab("basic");
    return;
  }
   
// ✅ Check settings instead of testData
if (!settings.passingScore || settings.passingScore <= 0) {
  toast.error(t("passingScoreRequired","Passing Score is required"));
  setActiveTab("settings");
  return;
}

if (!settings.maxAttempts || settings.maxAttempts <= 0) {
  toast.error(t("maxAttemptsRequired","Max Attempts is required"));
  setActiveTab("settings");
  return;
}


    //  assign sequential IDs only when saving
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
      // random between 30 and 120 seconds
      // Include image data for Image question type
      image: q.image || null,
      imageName: q.imageName || null,

      ans:
        q.type === "Multiple Select" || q.type === "MultipleSelect" || q.type === "SingleSelect" || q.type === "Image" || q.type === "Fill up" || q.type === "Fillup"
          ? q.answer || ""
          : q.type === "Disc"
          ? q.options.reduce((acc, opt, idx) => {
              acc[`Option${idx + 1}`] = {
                text: opt,
                trait: q[`dropdown1_${idx}`] || "",
                subtrait: q[`dropdown2_${idx}`] || "",
              };
              return acc;
            }, {})
          : q.answer || "",

      opts:
        q.type === "Multiple Select" || q.type === "MultipleSelect" || q.type === "SingleSelect" || q.type === "Image" || q.type === "Fill up" || q.type === "Fillup"
          ? q.options.reduce((acc, opt, idx) => {
              acc[`Option${idx + 1}`] = opt;
              return acc;
            }, {})
          : q.type === "Disc"
          ? q.options.reduce((acc, opt, idx) => {
              acc[`Option${idx + 1}`] = {
                text: opt,
                trait: q[`dropdown1_${idx}`] || "",
                subtrait: q[`dropdown2_${idx}`] || "",
              };
              return acc;
            }, {})
          : q.opts || {},

      notes: q.type === "Essay" || q.type === "Coding" ? q.answer : "",
      selAns: q.selectedAnswer || "",
    }));

    const payload = {
      title: testData.title,
      skill: testData.skill,
      desc: testData.description,
      dur: testData.duration,
      lan: getLocalizedValue(testData.language, 'language'),
      diff: getLocalizedValue(testData.difficulty, 'difficulty'),
      cat: getLocalizedValue(testData.category, 'category'),
      instr: testData.instructions,
      tags: testData.tags || [],
      qs: formattedQuestions,
      pass: settings.passingScore ?? 0,
      attempts: settings.maxAttempts ?? 0,
      status: getLocalizedValue(settings.status, 'status') || "",
      plag: settings.plagiarismDetection ?? false,
      shuffle: settings.randomizeQuestions ?? false,
      showRes: settings.showResults ?? false,
      updated: new Date().toISOString(),
    };
    setIsSaving(true);
    try {
      const storedData = sessionStorage.getItem("loginResponse");
      let token = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.source) {
          const sourceObj = JSON.parse(parsedData.source);
          token = sourceObj.token;
        }
      }

      if (!token) throw new Error("Token not found");

      const response = await fetch(
        `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_TestLibrary&resourceId=${resourceId}`,
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
        throw new Error(errText || "Failed to update test");
      }

      await response.json();
      toast.success(t("testUpdatedSuccessfully","Test updated successfully"));
      // ⏳ Delay navigation slightly so toast is visible
      setTimeout(() => {
        if (onBack) onBack();
      }, 1000);
    } catch (err) {
      console.error("❌ Error saving test:", err);
      toast.error(t("failedToUpdateTest","Failed to update test"));
    } finally {
      setIsSaving(false); // ⏹ stop loading
    }
  };

  const handleImportQuestions = (parsedQuestions) => {
    if (!parsedQuestions || parsedQuestions.length === 0) {
      toast.error(t("noValidQuestions","No valid questions"));
      return;
    }

    const mapped = parsedQuestions.map((q, idx) => {
      const base = { id: `Q_${Date.now()}_${Math.random()}_${idx}`, ...q };

      // Normalize MultipleSelect (force type to match manual)
      if (q.type === "Multiple Select") {
        const optsArray = q.options || [];
        const opts = {};
        optsArray.forEach((opt, i) => {
          opts[`Option${i + 1}`] = opt ?? "";
        });

        // Convert answer(s) to string (e.g., ["tgv","try"] => "tgv,try")
        let ans = q.ans || q.answer || "";
        if (Array.isArray(ans)) ans = ans.join(",");
        // If ans is "Option 1", replace it with actual value from opts
        if (typeof ans === "string" && ans.startsWith("Option")) {
          const optKey = ans.trim();
          ans = opts[optKey] ?? "";
        }

        return {
          ...base,
          type: "MultipleSelect", // force to manual type
          ans,
          opts,
        };
      }

      return base; // other types untouched
    });

    setQuestions((prev) => [...prev, ...mapped]);
    toast.success(`${t("imported")} ${mapped.length} ${t("questionsImportedSuccessfully","Questions Imported Successfully")}`);
    setShowImportModal(false);
  };

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("EditTest" , "Edit Test")}</h1>
          <p className="text-gray-600">{t("ModifyTestQuestionsSettings")}</p>
        </div>

        <div className="flex space-x-2">
          {/* <button className="flex items-center space-x-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <FaEye className="w-4 h-4" />
            <span>{t("preview")}</span>
          </button> */}

          <button
            onClick={handleSave}
            disabled={isSaving} // 🚨 disable during save
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isSaving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <FaSave className={isSaving ? "animate-spin" : ""} />
            <span>{isSaving ? t("saving") : t("save")}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "basic"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaBookOpen className="text-gray-700" size={16} />
            <span>{t("basicInformation")}</span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "questions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaCog className="w-4 h-4" />
            <span>{t("questions")}</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaCog className="w-4 h-4" />
            <span>{t("settings")}</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "basic" && (
        <TestEditBasicTab testData={testData} setTestData={setTestData} />
      )}

      {activeTab === "questions" && (
        <TestEditQuestionsTab
          questions={questions}
          setQuestions={setQuestions}
          isEditingQuestion={isEditingQuestion}
          currentQuestion={currentQuestion}
          resourceId={resourceId}
          setShowImportModal={setShowImportModal}
          handleAddQuestion={handleAddQuestion}
          handleDeleteQuestion={handleDeleteQuestion}
          handleQuestionChange={handleQuestionChange}
          handleOptionChange={handleOptionChange}
          handleCancelQuestion={handleCancelQuestion}
          handleSaveQuestion={handleSaveQuestion}
        />
      )}

      {activeTab === "settings" && (
        <TestEditSettingsTab settings={settings} setSettings={setSettings} />
      )}

      {/* Import Questions Modal */}
      {showImportModal && (
        <TestQuestionsModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportQuestions}
        />
      )}
    </div>
  );
};

export default TestEdit;

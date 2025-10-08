import { useState } from "react";
import { FaUpload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useLanguage } from "../contexts/LanguageContext";

const TestQuestionsImportModal = ({ isOpen, onClose, onImport }) => {
  const { t, currentLanguage } = useLanguage();

  const [file, setFile] = useState(null);

  // Define required headers for regular questions (English)
  const REQUIRED_HEADERS = [
    "S.No",
    "Question Type",
    "Question",       // moved before Skill
    "Skill",
    "Question Image",
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Answer",
    "Difficulty",
    "Score",
    "Duration",
    "Weightage (%)",
  ];


  // Define required headers for regular questions (Arabic)
  const REQUIRED_HEADERS_AR = [
    "الرقم التسلسلي",
    "نوع السؤال",
    "السؤال",
    "المهارة", 
    "صورة السؤال",
    "الخيار 1",
    "الخيار 2",
    "الخيار 3",
    "الخيار 4",
    "الإجابة",
    "الصعوبة",
    "الدرجة",
    "المدة",
    "النسبة المئوية للوزن",
  ];


  //  Define required headers for DISC questions (English)
  const DISC_HEADERS = [
    "S.No",
    "Question Type",
    "Question",   // moved before Skill
    "Skill",
    "Option 1",
    "D",
    "Option 2",
    "I",
    "Option 3",
    "S",
    "Option 4",
    "C",
    "Difficulty",
    "Score",
    "Duration",
    "Weightage (%)",
  ];

  //  Define required headers for DISC questions (Arabic)
  const DISC_HEADERS_AR = [
    "الرقم التسلسلي",
    "نوع السؤال",
    "السؤال",
     "المهارة",
    "الخيار 1",
    "D",
    "الخيار 2",
    "I",
    "الخيار 3",
    "S",
    "الخيار 4",
    "C",
    "الصعوبة",
    "الدرجة",
    "المدة",
    "النسبة المئوية للوزن",
  ];

  const validateHeaders = (headers) => {
    const expectedHeaders = getCurrentHeaders();

    // Check if it's regular format for current language only
    if (headers.length === expectedHeaders.regular.length) {
      return expectedHeaders.regular.every(
        (header, idx) => headers[idx]?.trim() === header
      );
    }

    // Check if it's DISC format for current language only
    if (headers.length === expectedHeaders.disc.length) {
      return expectedHeaders.disc.every(
        (header, idx) => headers[idx]?.trim() === header
      );
    }

    return false;
  };

  const isDiscFormat = (headers) => {
    const expectedHeaders = getCurrentHeaders();
    if (headers.length !== expectedHeaders.disc.length) return false;

    return expectedHeaders.disc.every(
      (header, idx) => headers[idx]?.trim() === header
    );
  };

  // Check if file language matches selected language
  const isCorrectLanguage = (headers) => {
    if (currentLanguage === 'ar') {
      // When Arabic is selected, check if headers are Arabic
      const isArabicRegular = headers.length === REQUIRED_HEADERS_AR.length &&
        REQUIRED_HEADERS_AR.every((header, idx) => headers[idx]?.trim() === header);
      const isArabicDisc = headers.length === DISC_HEADERS_AR.length &&
        DISC_HEADERS_AR.every((header, idx) => headers[idx]?.trim() === header);
      return isArabicRegular || isArabicDisc;
    } else {
      // When English is selected, check if headers are English
      const isEnglishRegular = headers.length === REQUIRED_HEADERS.length &&
        REQUIRED_HEADERS.every((header, idx) => headers[idx]?.trim() === header);
      const isEnglishDisc = headers.length === DISC_HEADERS.length &&
        DISC_HEADERS.every((header, idx) => headers[idx]?.trim() === header);
      return isEnglishRegular || isEnglishDisc;
    }
  };

  // Helper function to get current headers based on language
  const getCurrentHeaders = () => {
    if (currentLanguage === 'ar') {
      return {
        regular: REQUIRED_HEADERS_AR,
        disc: DISC_HEADERS_AR
      };
    }
    return {
      regular: REQUIRED_HEADERS,
      disc: DISC_HEADERS
    };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (
      !selectedFile.name.endsWith(".xlsx") &&
      !selectedFile.name.endsWith(".xls")
    ) {
      toast.error("❌ Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          toast.error("❌ Excel file is empty!");
          setFile(null);
          return;
        }

        const headers = jsonData[0] || [];

        // First check if file format is valid for current language
        if (!validateHeaders(headers)) {
          toast.error(t("invalidExcelFormat", "Invalid Excel format! Please use the correct template for the selected language."));
          setFile(null);
          return;
        }

        // Then check if file language matches selected language
        if (!isCorrectLanguage(headers)) {
          toast.error(t("invalidExcelLanguage", "Excel file language doesn't match the selected application language. Please use the appropriate template."));
          setFile(null);
          return;
        }

        const rows = jsonData.slice(1).filter((row) => row.length > 0);
        let parsedQuestions = [];

        // Helpers
        const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";
        const parseSkills = (val) => {
          if (isEmpty(val)) return [];
          // Split on comma/semicolon
          const parts = String(val).split(/[,;]+/).map(s => s.trim()).filter(Boolean);
          return parts.length > 0 ? parts : [];
        };

        const mapQuestionType = (type) => {
          if (!type) return "MultipleSelect";
          const typeStr = String(type).toLowerCase();
          if (typeStr.includes("single")) return "SingleSelect";
          if (typeStr.includes("multiple")) return "MultipleSelect";
          if (typeStr.includes("true") || typeStr.includes("false"))
            return "True/False";
          if (typeStr.includes("yes") || typeStr.includes("no"))
            return "Yes/No";
          if (typeStr.includes("essay")) return "Essay";
          if (typeStr.includes("coding")) return "Coding";
          if (typeStr.includes("disc")) return "Disc";
          return type;
        };

        // Helper: parse duration to number if possible (handles '5', '5 min')
        const parseDuration = (val) => {
          if (val === undefined || val === null) return null;
          // If already a finite number, return it
          if (typeof val === 'number' && Number.isFinite(val)) return val;
          const cleaned = String(val).match(/\d+(?:\.\d+)?/);
          if (!cleaned) return null;
          const num = Number(cleaned[0]);
          return Number.isFinite(num) ? num : null;
        };

        if (isDiscFormat(headers)) {
          // Handle DISC format with new simplified structure
          // Validate mandatory columns: Question Type, Skill, Question
          const missing = [];
          parsedQuestions = rows.map((row, idx) => {

            const [
              sno,
              questionType,
              question,
              skill,
              option1,
              dTrait,
              option2,
              iTrait,
              option3,
              sTrait,
              option4,
              cTrait,
              difficulty,
              score,
              duration,
              weightage,
            ] = row;

            // Map traits to full names
            const traits = ["Dominance", "Influence", "Steadiness", "Conscientiousness"];
            const subtraits = {
              D: "Assertiveness",
              I: "Optimism",
              S: "Supportiveness",
              C: "Accuracy",
            };

            // Create opts and ans objects in the exact format as manual entry
            const opts = {};
            const ans = {};
            const options = [option1, option2, option3, option4];
            const traitMap = [dTrait, iTrait, sTrait, cTrait];

            options.forEach((opt, optIdx) => {
              if (!opt) return; // Skip empty options
              const optionKey = `Option${optIdx + 1}`;
              const optionData = {
                text: String(opt).trim(),
                trait: traits[optIdx],
                subtrait: subtraits[traitMap[optIdx]] || String(traitMap[optIdx] || ""),
              };
              opts[optionKey] = optionData;
              ans[optionKey] = optionData;
            });

            // Create dropdown values for UI
            const dropdownValues = {};
            traits.forEach((trait, i) => {
              dropdownValues[`dropdown2_${i}`] = trait;
            });

            if (isEmpty(questionType) || isEmpty(question) || isEmpty(skill)) {
              missing.push(idx + 2); // +2 for 1-based indexing including header row
            }

            return {
              id: `Q${String(idx + 1).padStart(2, "0")}`,
              text: question || "",
              type: "Disc",
              score: Number(score) || 1,
              timeLimit: parseDuration(duration),
              correctOption: null, // DISC uses traits; no numeric correct option
              answer: "",
              options,
              opts,
              ans,
              ...dropdownValues,
              difficulty: difficulty || "",
              weightage: weightage || "",
              skills: parseSkills(skill),
            };
          });

          if (missing.length > 0) {
            toast.error(`❌ Missing mandatory fields (Skill, Question Type, or Question) on rows: ${missing.join(', ')}`);
            setFile(null);
            return;
          }
        } else {
          // Handle Regular questions
          const missing = [];
          parsedQuestions = rows.map((row, idx) => {
            const [
              sno,
              questionType,
              question,
              skill,
              questionImage,
              option1,
              option2,
              option3,
              option4,
              answer,
              difficulty,
              score,
              duration,
              weightage,
            ] = row;

            if (!questionType || !question) {
              missing.push(idx + 2); // Excel row number
              return null;
            }

            return {
              id: `Q${String(idx + 1).padStart(2, "0")}`,
              text: question || "",
              type: mapQuestionType(questionType),
              score: Number(score) || 1,
              timeLimit: parseDuration(duration),
              correctOption: answer || "",
              answer: answer || "",
              options: [option1, option2, option3, option4].filter(Boolean),
              difficulty: difficulty || "",
              weightage: weightage || "",
              skills: parseSkills(skill),
              image: questionImage || "",
            };
          }).filter(Boolean);

          if (missing.length > 0) {
            toast.error(`❌ Missing mandatory fields (Question Type or Question) on rows: ${missing.join(", ")}`);
            setFile(null);
            return;
          }
        }

        if (parsedQuestions.length === 0) {
          toast.error("❌ No valid questions found in the file.");
          setFile(null);

        }

        // 🔑 Pass parsed questions back up
        if (onImport) onImport(parsedQuestions);
      } catch (err) {
        console.error("❌ Error parsing Excel:", err);
        toast.error("❌ Failed to parse Excel file. Please check the format.");
        setFile(null);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t("importQuestionsFromExcel", "Import Questions from Excel")}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Excel Instructions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <h4 className="font-medium text-blue-900 mb-2">
              {t("supportedExcelFormats", "Supported Excel Formats:")}
            </h4>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-blue-800 mb-1">
                  {t("regularQuestions", "Regular Questions:")}
                </p>
                <div className="font-mono bg-blue-100 p-2 rounded text-xs text-blue-800 whitespace-pre-wrap">
                  {getCurrentHeaders().regular.join(" | ")}
                </div>
              </div>
              <div>
                <p className="font-medium text-blue-800 mb-1">
                  {t("discQuestions", "DISC Questions:")}
                </p>
                <div className="font-mono bg-blue-100 p-2 rounded text-xs text-blue-800 whitespace-pre-wrap">
                  {getCurrentHeaders().disc.join(" | ")}
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-gray-300 hover:border-gray-400 cursor-pointer">
            <FaUpload className="mx-auto mb-2 text-gray-400 w-10 h-10" />
            <p className="text-md font-medium text-gray-900 mb-1">
              {t("dropYourExcelFileHereOrClickToSelect", "Drop your Excel file here or click to select")}
            </p>
            <p className="text-xs text-gray-600 mb-3">
              {t("onlyXlsxFilesAllowed", "Only .xlsx files allowed")}
            </p>
            <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm">
              <FaUpload className="w-4 h-4" />
              <span>{t("selectExcelFile", "Select Excel File")}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected File Display */}
          {file && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-medium">Selected file:</span> {file.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestQuestionsImportModal;

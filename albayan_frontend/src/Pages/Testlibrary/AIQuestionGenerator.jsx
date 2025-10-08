import React, { useState } from "react";
import {
  clientId,
  clientSecret,
  text,
  doc,
  video,
  topic,
  url,
} from "../../Api/Api";
import Select, { components } from "react-select";
import { Toaster, toast } from "react-hot-toast";
//  Custom Option with Checkbox for Question Types
const Option = (props) => {
  return (
    <components.Option {...props}>
      <input
        type="checkbox"
        checked={props.isSelected}
        onChange={() => null}
        className="mr-2"
      />
      <label>{props.label}</label>
    </components.Option>
  );
};

const AIQuestionGenerator = ({
  setEditorMode,
  selectedContentType,
  setSelectedContentType,
  onQuestionsGenerated,
}) => {
  const [content, setContent] = useState("");
  const [quizName, setQuizName] = useState("");
  const [questionCount, setQuestionCount] = useState("All Possible");
  const [visualOutput, setVisualOutput] = useState("All possibles");
  const [loading, setLoading] = useState(false);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState([]);
  const [file, setFile] = useState(null);
  const [pageCounts, setPageCounts] = useState("");
  const [topicName, setTopicName] = useState(""); //  For Topic API
  const [searchType, setSearchType] = useState("0"); //  Default AI Generated
  const [skillInput, setSkillInput] = useState(""); // Mandatory skill(s)

  //  Question type dropdown options
  const questionTypeOptions = [
    { value: "all", label: "All Possible" },
    { value: "easy", label: "Easy MCQ" },
    { value: "medium", label: "Medium MCQ" },
    { value: "hard", label: "Hard MCQ" },
    { value: "truefalse", label: "True/False" },
 
    { value: "fillup", label: "Fill up" },

    
  ];

  const questionCountMap = {
    "All Possible": "",
    "Upto 10": "10",
    "Upto 25": "25",
    "Upto 50": "50",
  };

  const visualOutputMap = {
    "All possibles": "4",
  };

  const resetForm = () => {
    setQuizName("");
    setContent("");
    setFile(null);
    setTopicName("");
    setPageCounts("");
    setSelectedQuestionTypes([]);
    setQuestionCount("All Possible");
    setVisualOutput("All possibles");
    setSelectedContentType(""); // If you want to deselect content type after success
    setSkillInput("");
  };
  const handleContentTypeChange = (type) => {
    setSelectedContentType(type);

    //  Reset fields when switching content type
    setContent("");
    setFile(null);
    setTopicName("");
    setPageCounts("");
  };

  const handleGenerateQuestions = async () => {
    if (!quizName) {
      alert("Please enter a Question.");
      return;
    }
    // Validate skill input (mandatory). Supports comma/semicolon separated list
    const parsedSkills = (skillInput || "")
      .split(/[;,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parsedSkills.length === 0) {
      toast.error("Skill is required. Add at least one skill.");
      return;
    }
    if (selectedContentType === "Text" && !content) {
      alert("Please paste your content.");
      return;
    }
    if (
      (selectedContentType === "Document" || selectedContentType === "Video") &&
      !file
    ) {
      alert(`Please upload a ${selectedContentType.toLowerCase()} file.`);
      return;
    }
    if (selectedContentType === "URL" && !content) {
      alert("Please enter a valid URL.");
      return;
    }
    if (selectedContentType === "Topic" && !topicName) {
      alert("Please enter a topic name.");
      return;
    }

    setLoading(true);

    try {
      const myHeaders = new Headers();
      myHeaders.append("clientId", clientId);
      myHeaders.append("clientSecret", clientSecret);

      const formdata = new FormData();
      formdata.append("quizName", quizName);

      //  Map Question Types to API codes
      let quesTypeCodes = selectedQuestionTypes
        .map((item) => {
          switch (item.value) {
            case "easy":
              return "1";
            case "medium":
              return "2";
            case "hard":
              return "3";
            case "truefalse":
              return "4";
            case "descriptive":
              return "5";
            case "fillup":
              return "6";
            case "crossword":
              return "10";
            case "match":
              return "11";
            default:
              return "";
          }
        })
        .filter((code) => code !== "")
        .join(",");

      formdata.append("quesType", quesTypeCodes || "1"); // Default MCQ
      formdata.append("quesCount", questionCountMap[questionCount] || "20"); // Default 20
      let visualValue = visualOutputMap[visualOutput] || "0";

      if (["Text", "Topic", "URL"].includes(selectedContentType)) {
        visualValue = "0"; // No visuals for these types
      }
      formdata.append("visualOutput", visualValue);

      let apiUrl = "";

      //  For Text Content
      if (selectedContentType === "Text") {
        formdata.append("content", content);
        formdata.append("returnCode", "INS01x05");
        apiUrl = text;
      }

      //  For Document (Fixed according to doc)
      if (selectedContentType === "Document" && file) {
        formdata.append("file", file);
        if (pageCounts) {
          formdata.append("pageCounts", pageCounts); // Example: "1,2,5-7"
        }
        formdata.append("returnCode", "INS01x05");
        apiUrl = doc;
      }

      //  For Video (Fixed according to doc)
      if (selectedContentType === "Video" && file) {
        formdata.append("file", file);
        formdata.append("type", "video");
        formdata.append("quesCount", questionCountMap[questionCount] || "20");
        formdata.append("quesType", quesTypeCodes || "1");

        //  Add missing required fields from doc
        formdata.append("startPoint", "0"); // Default: 0 (start of video)
        formdata.append("endPoint", "10"); // Default: 0 (till end of video)
        formdata.append(
          "visualOutput",
          visualOutput && visualOutputMap[visualOutput] !== undefined
            ? visualOutputMap[visualOutput]
            : "0" // Default no visuals
        );

        formdata.append("returnCode", "INS01x05");
        apiUrl = video;
      }

      //  For Topic
      if (selectedContentType === "Topic") {
        let topicQuesType = selectedQuestionTypes
          .map((item) => {
            if (["easy", "medium", "hard"].includes(item.value)) {
              switch (item.value) {
                case "easy":
                  return "1";
                case "medium":
                  return "2";
                case "hard":
                  return "3";
              }
            }
            return "";
          })
          .filter((code) => code !== "")
          .join(",");

        if (!topicQuesType) topicQuesType = "1";

        formdata.append("searchType", "0");
        formdata.append("topicName", topicName);
        formdata.append("quesCount", questionCountMap[questionCount] || "20");
        formdata.append("quesType", topicQuesType);
        formdata.append("visualOutput", "0");
        formdata.append("returnCode", "INS01x05");
        apiUrl = topic;
      }

      //  For URL
      if (selectedContentType === "URL") {
        formdata.append("url", content);
        formdata.append("quesType", quesTypeCodes || "1");
        formdata.append("quesCount", questionCountMap[questionCount] || "20");
        formdata.append("visualOutput", visualValue);
        formdata.append("returnCode", "INS01x05");
        apiUrl = url;
      }

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata,
        redirect: "follow",
      };

      const response = await fetch(apiUrl, requestOptions);

      const result = await response.json();
      console.log(`${selectedContentType} API Response:`, result);

      if (result.success && result.response) {
        if (Array.isArray(result.response) && result.response.length > 0) {
          //  Add generatedByAI flag here
          const questionsWithAIFlag = result.response.map((q) => ({
            ...q,
            generatedByAI: true, // 🔥 mark as AI-generated
            skills: parsedSkills, // attach skills to each generated question
          }));
          onQuestionsGenerated(questionsWithAIFlag);
        } else {
          toast.error(
            "No questions generated. Please check your input and try again."
          );
        }
      } else {
        toast.error(result.message || "Unable to process the provided input. Please try again with different content.");
      }
    } catch (error) {
      toast.error(
        "Something went wrong while analyzing your input. Try again later."
      );
      // alert("Failed to generate questions. Please try again.");
    } finally {
      resetForm();
      setLoading(false);
    }
  };
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        AI Question Generator
      </h2>

      {/* Content Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Type{" "}
          <span className="text-red-500 text-base font-bold">*</span>
        </label>
        <div className="flex gap-3 flex-wrap">
          {["Text", "URL", "Topic", "Document", "Video"].map((t) => (
            <button
              key={t}
              onClick={() => handleContentTypeChange(t)}
              disabled={loading} //  Disable when loading
              className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                selectedContentType === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-blue-50 text-gray-700"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`} //  Show disabled style
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter Question Title"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          disabled={loading} //  Disable during loading
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {/* Skill(s) - mandatory */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g., Leadership, Communication"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          disabled={loading}
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">Separate multiple skills with comma or semicolon. These skills will be applied to all generated questions.</p>
      </div>

      {/* Dynamic Content Input */}
      {selectedContentType === "Text" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type/Paste Your Content
          </label>
          <textarea
            rows="6"
            placeholder="Paste content (minimum 50 words)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading} //  Disable during loading
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          ></textarea>
        </div>
      )}

      {selectedContentType === "Document" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={loading} //  Disable during loading
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: <strong>.pdf, .doc, .docx, .ppt, .pptx</strong>
          </p>
        </div>
      )}

      {selectedContentType === "Video" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Video <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".mp4,.mov,.avi,.wmv"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={loading} //  Disable during loading
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: <strong>.mp4, .mov, .avi, .wmv</strong>
          </p>
        </div>
      )}

      {selectedContentType === "Topic" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Topic Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter topic (e.g., Mahatma Gandhi)"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            disabled={loading} //  Correct for input
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
      {selectedContentType === "URL" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Webpage URL <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="https://example.com/article"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading} //  Correct for input
            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Types
          </label>
          <Select
            options={questionTypeOptions}
            isMulti
            closeMenuOnSelect={false}
            hideSelectedOptions={false}
            components={{ Option }}
            onChange={setSelectedQuestionTypes}
            value={selectedQuestionTypes}
            isDisabled={loading} //  React-select prop for disabling
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Count
          </label>
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            disabled={loading} //  Disable during loading
            className="w-full border px-3 py-2 rounded-lg disabled:opacity-50"
          >
            {Object.keys(questionCountMap).map((count) => (
              <option key={count}>{count}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Include Visuals
          </label>
          <select
            value={visualOutput}
            onChange={(e) => setVisualOutput(e.target.value)}
            disabled={loading} //  Disable during loading
            className="w-full border px-3 py-2 rounded-lg"
          >
            {Object.keys(visualOutputMap).map((visual) => (
              <option key={visual}>{visual}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setEditorMode("edit")}
          className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleGenerateQuestions}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Question"}
        </button>
      </div>
    </>
  );
};

export default AIQuestionGenerator;

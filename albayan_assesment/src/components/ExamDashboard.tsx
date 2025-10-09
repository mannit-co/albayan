import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { QuestionPanel } from './QuestionPanel';
import { QuestionPalette } from './QuestionPalette';
import { CameraPreview } from './CameraPreview';
import { ExamTimer } from './ExamTimer';
import { SecurityMonitor } from './SecurityMonitor';
import { useExamSecurity } from '@/hooks/useExamSecurity';
import { useExamState } from '@/hooks/useExamState';
import { Question } from '@/types/exam';
import { ExamSummary } from './ExamSummary';
import { User, AlertTriangle, Monitor, Camera } from 'lucide-react';

interface ExamDashboardProps {
  examTitle: string;
  duration: number; // in minutes
  questions: Question[];
  onExit?: () => void;
  isLastTest?: boolean;
  onTestComplete?: (testResponses: any) => void;
  isFirstTest?: boolean; // Add prop to identify first test
  currentTest?: any; // Add current test data including minQuestions
}

export const ExamDashboard: React.FC<ExamDashboardProps> = ({
  examTitle,
  duration,
  questions,
  onExit,
  isLastTest = false,
  onTestComplete,
  isFirstTest = false,
  currentTest
}) => {
  const [examStarted, setExamStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showMinQuestionsPopup, setShowMinQuestionsPopup] = useState(false);

  const candidateInfo = JSON.parse(sessionStorage.getItem("candidateInfo") || "{}");
  const candidateName = candidateInfo?.name || "Candidate";

  const {
    currentQuestionIndex,
    responses,
    questionStatus,
    markForReview,
    saveResponse,
    clearResponse,
    goToQuestion,
    getStatusCounts
  } = useExamState(questions);

  const {
    isFullscreen,
    violations,
    requestFullscreen,
    exitFullscreen,
    clearViolations
  } = useExamSecurity();

  // Track per-question time
  const timeSpentRef = useRef<number[]>(Array(questions.length).fill(0));
  const currentQuestionStartTime = useRef<number>(0);
  const lastIndexRef = useRef<number>(0);

  // Check if minimum questions requirement is met
  const isMinimumQuestionsMet = () => {
    const minRequired = currentTest?.minQuestions || 0;
    if (minRequired === 0) return true; // No minimum requirement

    // Count answered questions
    let answeredCount = 0;
    for (let i = 0; i < questions.length; i++) {
      const response = responses[i];
      if (isResponseAnswered(response, questions[i])) {
        answeredCount++;
      }
    }

    return answeredCount >= minRequired;
  };

  // Helper function to check if a response is answered
  const isResponseAnswered = (response: any, question: any): boolean => {
    if (!response) return false;

    // Handle different question types
    switch (question.type) {
      case 'True/False':
      case 'Yes/No':
      case 'SingleSelect':
      case 'MultipleSelect':
      case 'Image':
        return response !== null && response !== undefined && response !== '';

      case 'Essay':
      case 'Coding':
      case 'Fillup':
        return response && response.toString().trim().length > 0;

      case 'Disc':
        return response !== null && response !== undefined && response !== '';

      default:
        return response !== null && response !== undefined && response !== '';
    }
  };

  // Get answered questions count for display
  const getAnsweredCount = () => {
    let count = 0;
    for (let i = 0; i < questions.length; i++) {
      if (isResponseAnswered(responses[i], questions[i])) {
        count++;
      }
    }
    return count;
  };

  const startExam = async () => {
    try {
      // Try to get camera access, but don’t block if denied
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraPermission(true);
      } catch {
        setCameraPermission(false);
        console.warn('Camera permission denied — continuing without camera.');
      }

      // // Continue exam even if camera not granted
      await requestFullscreen();
      setExamStarted(true);

      timeSpentRef.current = Array(questions.length).fill(0);
      currentQuestionStartTime.current = Date.now();
      lastIndexRef.current = 0;
    } catch (error) {
      alert('An error occurred while starting the exam. Please try again.');
    }
  };

  // Auto-start exam for non-first tests (skip start screen)
  useEffect(() => {
    if (!isFirstTest && !examStarted) {
      startExam();
    }
  }, [isFirstTest, examStarted]);

  // Track time on navigation
  useEffect(() => {
    if (!examStarted) return;

    const now = Date.now();
    const timeForPrevQuestion = Math.floor(
      (now - currentQuestionStartTime.current) / 1000
    );
    // Safe-increment: initialize slot if needed
    const li = lastIndexRef.current;
    if (!Number.isFinite(timeSpentRef.current[li])) {
      timeSpentRef.current[li] = 0;
    }
    timeSpentRef.current[li] += timeForPrevQuestion;

    currentQuestionStartTime.current = now;
    lastIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex, examStarted]);

  // Submit (pre-summary) - Modified to handle intermediate vs final tests with minimum questions validation
  const submitExam = () => {
    // Check minimum questions requirement
    if (!isMinimumQuestionsMet()) {
      setShowMinQuestionsPopup(true);
      return;
    }

    const now = Date.now();
    const timeForCurrent = Math.floor(
      (now - currentQuestionStartTime.current) / 1000
    );
    if (!Number.isFinite(timeSpentRef.current[currentQuestionIndex])) {
      timeSpentRef.current[currentQuestionIndex] = 0;
    }
    timeSpentRef.current[currentQuestionIndex] += timeForCurrent;

    currentQuestionStartTime.current = now;

    if (isLastTest) {
      // For the last test, show summary before final submission
      setShowSummary(true);
    } else {
      // For intermediate tests, collect responses and move to next test
      handleTestCompletion();
    }
  };

  // Handle completion of intermediate tests
  const handleTestCompletion = () => {
    // Format current test responses
    const candidateInfo = JSON.parse(sessionStorage.getItem("candidateInfo") || '{}');
    const currentTestResponses = questions.map((q, index) => {
      let answer = responses[index];

      if (!Array.isArray(answer)) {
        answer = answer !== null && answer !== undefined ? [answer] : [];
      }

      let selOpt: string;

      switch (q.type) {
        case "Coding":
        case "Essay":
          selOpt = answer.join(""); // actual text
          break;

        case "True/False":
        case "Yes/No":
          selOpt = answer.join(",");
          break;

        case "Fillup":
          selOpt = answer.join(","); // store actual written content
          break;

        case "Disc":
          // For DISC questions, handle option selection properly
          selOpt = answer
            .map((val) => {
              if (typeof val === 'string' && val.startsWith('Option')) {
                return val; // Already in correct format
              }
              const idx = q.options.indexOf(val);
              return idx >= 0 ? `Option ${idx + 1}` : "";
            })
            .filter(Boolean)
            .join(",");
          break;

        default: // MCQ
          selOpt = answer
            .map((val) => {
              const idx = q.options.indexOf(val);
              return idx >= 0 ? `Option ${idx + 1}` : "";
            })
            .filter(Boolean)
            .join(",");
      }

      const safeTime = Number.isFinite(timeSpentRef.current[index])
        ? timeSpentRef.current[index]
        : 0;

      // Include question status information for accurate summary counting
      const qStatus = questionStatus[index] || { visited: false, answered: false, markedForReview: false };

      return {
        Tid: q.tid,
        Ttit: q.title,
        type: q.type,
        QID: q.id.toString(),
        Selopt: selOpt,
        TimeTaken: safeTime,
        Skills: q.skills || [],
        // Add status information for summary counting
        questionStatus: {
          visited: qStatus.visited,
          answered: qStatus.answered,
          markedForReview: qStatus.markedForReview
        }
      };
    });

    // Call the test completion handler to accumulate responses
    if (onTestComplete) {
      onTestComplete(currentTestResponses);
    }

    // Exit to move to next test
    if (onExit) {
      onExit();
    }
  };

  // Final submit (with API call + restrictions cleanup) - Modified to include all test responses
  const finalSubmit = async () => {
    try {
      const now = Date.now();
      const timeForCurrent = Math.floor(
        (now - currentQuestionStartTime.current) / 1000
      );
      if (!Number.isFinite(timeSpentRef.current[currentQuestionIndex])) {
        timeSpentRef.current[currentQuestionIndex] = 0;
      }
      timeSpentRef.current[currentQuestionIndex] += timeForCurrent;
      currentQuestionStartTime.current = now;

      const candidateInfo = JSON.parse(sessionStorage.getItem("candidateInfo") || '{}');

      // Format current (final) test responses
      const currentTestResponses = questions.map((q, index) => {
        let answer = responses[index];

        if (!Array.isArray(answer)) {
          answer = answer !== null && answer !== undefined ? [answer] : [];
        }

        let selOpt: string;

        switch (q.type) {
          case "Coding":
          case "Essay":
            selOpt = answer.join(""); // actual text
            break;

          case "True/False":
          case "Yes/No":
            selOpt = answer.join(",");
            break;

          case "Fillup":
            selOpt = answer.join(","); // store actual written content
            break;

          case "Disc":
            // For DISC questions, handle option selection properly
            selOpt = answer
              .map((val) => {
                if (typeof val === 'string' && val.startsWith('Option')) {
                  return val; // Already in correct format
                }
                const idx = q.options.indexOf(val);
                return idx >= 0 ? `Option ${idx + 1}` : "";
              })
              .filter(Boolean)
              .join(",");
            break;

          default: // MCQ
            selOpt = answer
              .map((val) => {
                const idx = q.options.indexOf(val);
                return idx >= 0 ? `Option ${idx + 1}` : "";
              })
              .filter(Boolean)
              .join(",");
        }

        const safeTime = Number.isFinite(timeSpentRef.current[index])
          ? timeSpentRef.current[index]
          : 0;

        // Include question status information for accurate summary counting
        const qStatus = questionStatus[index] || { visited: false, answered: false, markedForReview: false };

        return {
          Tid: q.tid,
          Ttit: q.title,
          type: q.type,
          QID: q.id.toString(),
          Selopt: selOpt,
          TimeTaken: safeTime,
          Skills: q.skills || [],
          // Add status information for summary counting
          questionStatus: {
            visited: qStatus.visited,
            answered: qStatus.answered,
            markedForReview: qStatus.markedForReview
          }
        };
      });

      // Get accumulated responses from previous tests
      const accumulatedResponses = JSON.parse(sessionStorage.getItem('accumulatedTestResponses') || '[]');

      // Combine all responses (previous tests + current final test)
      const allFormattedResponses = [...accumulatedResponses, ...currentTestResponses];

      // ✅ Add submission timestamp in YYYY-MM-DD HH:mm:ss format
      const submissionDate = new Date();
      const year = submissionDate.getFullYear();
      const month = String(submissionDate.getMonth() + 1).padStart(2, "0");
      const day = String(submissionDate.getDate()).padStart(2, "0");
      const hours = String(submissionDate.getHours()).padStart(2, "0");
      const minutes = String(submissionDate.getMinutes()).padStart(2, "0");
      const seconds = String(submissionDate.getSeconds()).padStart(2, "0");
      const submissionDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // ✅ Store date as ISO string with timezone offset
      const dateISO = submissionDate.toISOString(); // Format: "2025-10-08T17:54:37.718Z"
      const dateWithTimezone = dateISO.replace('Z', '+00:00'); // Format: "2025-10-08T17:54:37.718+00:00"

      const payload = {
        ...candidateInfo,
        answers: allFormattedResponses, // Submit all accumulated responses
        submissionDateTime,
        assT: candidateInfo.assT || "Mixed", // Use assT from API or fallback to Mixed
        asId: candidateInfo.asId, // Include asId from API
        Completed: "completed", // ✅ Added completion status
      };
      const response = await fetch(
        `https://dev-commonmannit.mannit.co/mannit/eCreateCol?colname=QUXCQVLBTKHVQI1HBGJHEWFUAHV_Result`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            xxxid: "QUXCQVLBTKHVQI1HBGJHEWFUAHV",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to submit exam: ${errText}`);
      }

      const data = await response.json();
      console.log("✅ Submission success:", data);

      // Parse the 'source' to access _id
      const sourceData = JSON.parse(data.source); // Parse the 'source' string into an object
      const examId = sourceData?._id?.$oid; // Extract the _id from the parsed data
      if (examId) {
        console.log("Exam ID:", examId); // Log the ID to the console

        // Now make the second API call using the examId
        const scoreResponse = await fetch(
          `https://dev-commonmannit.mannit.co/mannit/score?id=${examId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              xxxid: "QUXCQVLBTKHVQI1HBGJHEWFUAHV",
            },
          }
        );

        if (!scoreResponse.ok) {
          const errText = await scoreResponse.text();
          console.log('errText', errText)
          throw new Error(`Failed to fetch score: ${errText}`);
        }

        const scoreData = await scoreResponse.json();
        console.log("Score Data:", scoreData); // Log the score data
      }


      sessionStorage.setItem('examCompleted', 'true');

      // // ✅ Exit fullscreen after submission
      exitFullscreen();

      // // Clear any pending violations before showing summary
      clearViolations();
      setShowSummary(true);
    } catch (error: any) {
      console.error("❌ Error submitting exam:", error);
      alert(`Submission failed: ${error.message}`);
    }
  };

  if (!examStarted) {
    return (
      <div className="exam-container min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-800">{examTitle}</h1>
            <p className="text-gray-500 mt-2">
              Duration: <span className="font-semibold">{duration} minutes</span>
            </p>
            <p className="text-gray-500">
              Total Questions: <span className="font-semibold">{questions.length}</span>
            </p>
          </div>

          {/* Security Warnings - Only show for first test */}
          {isFirstTest && (
            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Camera className="w-5 h-5 text-blue-600" />
                <span className="text-sm">
                  Camera monitoring <strong>(optional)</strong> will be enabled if allowed.
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Fullscreen mode will be activated</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm">Tab switching is not allowed</span>
              </div>
            </div>
          )}

          <Button
            onClick={startExam}
            className="w-full bg-blue-500 text-white py-4 text-sm"
          >
            Start Exam
          </Button>

          <p className="mt-4 text-sm text-gray-400">
            Make sure you are ready. Once started, the timer will begin.
          </p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    // Get accumulated responses to show total counts across all tests
    const accumulatedResponses = JSON.parse(sessionStorage.getItem('accumulatedTestResponses') || '[]');

    // Include current test responses for the summary count
    const currentTestFormatted = questions.map((q, index) => {
      let answer = responses[index];
      if (!Array.isArray(answer)) {
        answer = answer !== null && answer !== undefined ? [answer] : [];
      }
      let selOpt: string;
      switch (q.type) {
        case "Coding":
        case "Essay":
          selOpt = answer.join("");
          break;
        case "True/False":
        case "Yes/No":
          selOpt = answer.join(",");
          break;
        case "Fillup":
          selOpt = answer.join(",");
          break;
        case "Disc":
          // For DISC questions, handle option selection properly
          selOpt = answer
            .map((val) => {
              if (typeof val === 'string' && val.startsWith('Option')) {
                return val; // Already in correct format
              }
              const idx = q.options?.indexOf(val) || -1;
              return idx >= 0 ? `Option ${idx + 1}` : "";
            })
            .filter(Boolean)
            .join(",");
          break;
        default:
          selOpt = answer
            .map((val) => {
              const idx = q.options?.indexOf(val) || -1;
              return idx >= 0 ? `Option ${idx + 1}` : "";
            })
            .filter(Boolean)
            .join(",");
      }
      
      // Include question status information for accurate summary counting
      const qStatus = questionStatus[index] || { visited: false, answered: false, markedForReview: false };
      
      return {
        Tid: q.tid,
        Ttit: q.title,
        type: q.type,
        QID: q.id.toString(),
        Selopt: selOpt,
        TimeTaken: 0,
        Skills: q.skills || [],
        // Add status information for summary counting
        questionStatus: {
          visited: qStatus.visited,
          answered: qStatus.answered,
          markedForReview: qStatus.markedForReview
        }
      };
    });

    const allResponsesForSummary = [...accumulatedResponses, ...currentTestFormatted];

    return (
      <ExamSummary
        questions={questions}
        responses={responses}
        questionStatus={questionStatus}
        onBack={() => {
          // Clear any lingering alerts (e.g., previous refresh/shortcut warnings)
          clearViolations();
          setShowSummary(false);
        }}
        onSubmit={finalSubmit}
        onOk={onExit}
        allTestResponses={allResponsesForSummary}
      />
    );
  }

  return (
    <div className="exam-container">
      {/* ✅ Security Monitor (re-enter fullscreen on user action/auto-hide) */}
      <SecurityMonitor violations={violations} onRequestFullscreen={requestFullscreen} isFullscreen={isFullscreen} />

      {/* Exam Header */}
      <div className="exam-header">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{examTitle}</h1>
        </div>

        {candidateName && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
            <User className="w-4 h-4" />
            <span className="text-sm">
              Welcome, <span className="font-semibold">{candidateName}</span>
            </span>
          </div>
        )}

        <ExamTimer duration={duration} onTimeUp={submitExam} />
      </div>

      {/* ✅ Camera Preview */}
      {cameraPermission && <CameraPreview />}

      {/* Main Content */}
      <div className="exam-content flex flex-col lg:flex-row gap-4 p-4 overflow-y-auto">
        <div className="flex-1">
          <QuestionPanel
            question={questions[currentQuestionIndex]}
            response={responses[currentQuestionIndex]}
            onResponseChange={(response) =>
              saveResponse(currentQuestionIndex, response)
            }
            onNext={() =>
              goToQuestion(Math.min(currentQuestionIndex + 1, questions.length - 1))
            }
            onPrevious={() => goToQuestion(Math.max(currentQuestionIndex - 1, 0))}
            onClear={() => clearResponse(currentQuestionIndex)}
            onMarkReview={() => markForReview(currentQuestionIndex)}
            isMarkedForReview={
              questionStatus[currentQuestionIndex]?.markedForReview || false
            }
            canGoNext={currentQuestionIndex < questions.length - 1}
            canGoPrevious={currentQuestionIndex > 0}
            displayIndex={currentQuestionIndex}
            isLastQuestion={currentQuestionIndex === questions.length - 1}
            isLastTest={isLastTest}
            onSubmit={submitExam}
          />
        </div>

        <div className="w-full mt-4 lg:mt-0 lg:w-80 lg:h-[calc(100vh-120px)] lg:overflow-y-auto">
          <QuestionPalette
            questions={questions}
            currentQuestion={currentQuestionIndex}
            questionStatus={questionStatus}
            statusCounts={getStatusCounts()}
            onQuestionSelect={goToQuestion}
            onSubmit={submitExam}
            isLastTest={isLastTest}
            minQuestions={currentTest?.minQuestions || 0}
            answeredCount={getAnsweredCount()}
          />
        </div>
      </div>

      {/* Custom Popup for Minimum Questions Warning */}
      {showMinQuestionsPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center space-y-4 max-w-md w-full mx-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            {/* <h2 className="text-lg font-semibold text-gray-900">Incomplete Test</h2> */}
            <p className="text-gray-600">Please complete all unanswered questions</p>
            <Button
              onClick={() => setShowMinQuestionsPopup(false)}
              className="mt-4 px-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

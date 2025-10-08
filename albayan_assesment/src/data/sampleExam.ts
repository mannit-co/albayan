
import { Question } from '@/types/exam';
import { TestCollection } from '@/components/TestSelection';

export let sampleQuestions: Question[] = [];
export let examConfig = {
  title: "Assessment",
  duration: 60,
  totalQuestions: 0,
  totalMarks: 0
};

// New: Store multiple tests
export let testCollections: TestCollection[] = [];

// Candidate info object
export let candidateInfo = {
  name: "",
  email: "",
  phone: "",
  skills: [] as string[],
  assT: "", // Assessment type from API
  asId: null as string | null // Assessment ID from API
};

export const fetchSampleQuestions = async (uniqueTestId: string) => {
  try {
    const response = await fetch(
      `https://dev-commonmannit.mannit.co/mannit/fetchTest/${uniqueTestId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'ngrok-skip-browser-warning': 'true',
          xxxid: "QUXCQVLBTKHVQI1HBGJHEWFUAHV",
        },
      }
    );

    const data = await response.json();
    console.log("API Response:", data);

    // Check if test is already completed
    if (data.source === "Test is already completed") {
      console.log("Test already completed - setting up completed state");
      
      // Mark exam as completed
      sessionStorage.setItem('examCompleted', 'true');
      
      // Try to get the original test count from previous session or API
      // If not available, default to 3 tests as shown in the error
      const previousTestCount = 3; // This could be dynamic based on API or stored data
      
      // Create empty test collections but mark them as completed
      testCollections = [];
      sampleQuestions = [];
      examConfig = { 
        title: "Assessment Completed", 
        duration: 0, 
        totalQuestions: 0, 
        totalMarks: 0 
      };
      
      // Save completed state
      sessionStorage.setItem("examConfig", JSON.stringify(examConfig));
      sessionStorage.setItem("sampleQuestions", JSON.stringify(sampleQuestions));
      sessionStorage.setItem("testCollections", JSON.stringify(testCollections));
      
      return [];
    }

    // Check if test is expired
    if (data.source === "The Test Is Expired") {
      console.log("Test is expired - setting up expired state");
      
      // Mark exam as expired
      sessionStorage.setItem('examExpired', 'true');
      
      // Create empty test collections for expired state
      testCollections = [];
      sampleQuestions = [];
      examConfig = { 
        title: "Assessment Expired", 
        duration: 0, 
        totalQuestions: 0, 
        totalMarks: 0 
      };
      
      // Save expired state
      sessionStorage.setItem("examConfig", JSON.stringify(examConfig));
      sessionStorage.setItem("sampleQuestions", JSON.stringify(sampleQuestions));
      sessionStorage.setItem("testCollections", JSON.stringify(testCollections));
      
      return [];
    }

    // Parse source safely
    const collections = JSON.parse(data.source || "[]");

    // Extract candidate info if present
    const candidateData = collections.find((item: any) => item.name && item.email);
    if (candidateData) {
      candidateInfo = {
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        skills: candidateData.skills || [],
        assT: candidateData.assT || "Mixed", // Get assT from API
        asId: candidateData.asId || null // Get asId from API
      };
      sessionStorage.setItem("candidateInfo", JSON.stringify(candidateInfo));
    }

    // Filter collections that contain questions
    const questionCollections = collections.filter((col: any) => Array.isArray(col.qs));

    if (!questionCollections.length) {
      console.warn("No valid question collections found.");
      testCollections = [];
      sampleQuestions = [];
      examConfig = { ...examConfig, totalQuestions: 0, totalMarks: 0 };
      return [];
    }

    // ✅ NEW: Parse each test collection separately
    testCollections = questionCollections.map((col: any) => {
      const questions = col.qs.map((q: any) => {
        let options: string[] = [];

        if (q.opts) {
          if (q.type?.toLowerCase() === "disc") {
            options = Object.values(q.opts).map((opt: any) => opt.text || "");
          } else {
            options = Object.values(q.opts);
          }
        }

        return {
          id: q.id,
          tid: col.tid,
          title: col.title,
          type: q.type || "multiple-choice-single",
          question: q.q,
          skills: q.skills || [],
          image: q.image || q.img || undefined,
          options,
          correctAnswer: q.ans || "",
          marks: q.score || 1,
        };
      });

      const questionTypes = Array.from(new Set(questions.map((q: any) => q.type)));
      const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);

      // Get the duration for this test or default to 60
      const duration = col.dur || 60;

      return {
        tid: col.tid,
        title: col.title,
        questions,
        duration,
        totalMarks,
        questionTypes,
        minQuestions: col.minQuestions || 0, // Add minQuestions field
        completed: false
      };
    });

    // For backward compatibility, still set the flattened questions
    sampleQuestions = testCollections.flatMap(test => test.questions);

    examConfig = {
      title: "Multi-Test Assessment",
      duration: testCollections.reduce((sum, test) => sum + test.duration, 0),
      totalQuestions: sampleQuestions.length,
      totalMarks: sampleQuestions.reduce((sum, q) => sum + (q.marks || 0), 0),
    };

    // Save everything to sessionStorage
    sessionStorage.setItem("examConfig", JSON.stringify(examConfig));
    sessionStorage.setItem("sampleQuestions", JSON.stringify(sampleQuestions));
    sessionStorage.setItem("testCollections", JSON.stringify(testCollections));
    sessionStorage.setItem("candidateInfo", JSON.stringify(candidateInfo));

    console.log("Candidate Info:", candidateInfo);
    console.log("Test Collections:", testCollections);
    console.log("Exam Config:", examConfig);

    return sampleQuestions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};




import { Question } from '@/types/exam';

export let sampleQuestions: Question[] = [];
export let examConfig = {
  title: "Assessment",
  duration: 60,
  totalQuestions: 0,
  totalMarks: 0
};

// Candidate info object
export let candidateInfo = {
  name: "",
  email: "",
  phone: "",
  skills: [] as string[]
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

    // Parse source safely
    const collections = JSON.parse(data.source || "[]");

    // Extract candidate info if present
    const candidateData = collections.find((item: any) => item.name && item.email);
    if (candidateData) {
      candidateInfo = {
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        skills: candidateData.skills || []
      };
      sessionStorage.setItem("candidateInfo", JSON.stringify(candidateInfo));
    }

    // Filter collections that contain questions
    const questionCollections = collections.filter((col: any) => Array.isArray(col.qs));

    if (!questionCollections.length) {
      console.warn("No valid question collections found.");
      sampleQuestions = [];
      examConfig = { ...examConfig, totalQuestions: 0, totalMarks: 0 };
      return [];
    }

    // Flatten all questions and add tid/title
    sampleQuestions = questionCollections.flatMap((col: any) =>
      col.qs.map((q: any) => {
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
          // Map image if provided (can be data URL, base64, or binary handled by component)
          image: q.image || q.img || undefined,
          options,
          correctAnswer: q.ans || "",
          marks: q.score || 1,
        };
      })
    );

    // ✅ Use duration from collection (not stripped version)
    const durationSource = collections.find((col: any) => col.Tdur);
    const duration = durationSource?.Tdur ?? 60;

    console.log("duration from API:", duration);

    examConfig = {
      title: "Assessment",
      duration,
      totalQuestions: sampleQuestions.length,
      totalMarks: sampleQuestions.reduce((sum, q) => sum + (q.marks || 0), 0),
    };

    // Save everything to sessionStorage
    sessionStorage.setItem("examConfig", JSON.stringify(examConfig));
    sessionStorage.setItem("sampleQuestions", JSON.stringify(sampleQuestions));
    sessionStorage.setItem("candidateInfo", JSON.stringify(candidateInfo));

    console.log("Candidate Info:", candidateInfo);
    console.log("Mapped Sample Questions:", sampleQuestions);
    console.log("Exam Config:", examConfig);

    return sampleQuestions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};



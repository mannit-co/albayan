import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { FiEye, FiClock, FiBookOpen } from "react-icons/fi";
import { FaPlus, FaChevronUp, FaChevronDown } from "react-icons/fa";
import TestListTable from "./TestPreviewTabs/TestListTable";
import { uid, BaseUrl, SuperAdminID } from "../../Api/Api";
import { toast, Toaster } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { v4 as uuidv4 } from "uuid";


// Tag Component
const Tag = ({ text, color }) => {
  const bgColorClass =
    color === "blue"
      ? "bg-blue-100"
      : color === "green"
        ? "bg-green-100"
        : color === "yellow"
          ? "bg-yellow-100"
          : color === "red"
            ? "bg-red-100"
            : "bg-gray-100";
  const textColorClass =
    color === "blue"
      ? "text-blue-800"
      : color === "green"
        ? "text-green-800"
        : color === "yellow"
          ? "text-yellow-800"
          : color === "red"
            ? "text-red-800"
            : "text-gray-800";

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bgColorClass} ${textColorClass}`}
    >
      {text}
    </span>
  );
};

// Normalize test data
const normalizeTest = (raw) => {
  let obj = raw;

  try {
    if (typeof obj === "string") obj = JSON.parse(obj);
    if (obj?.source && typeof obj.source === "string") {
      obj = JSON.parse(obj.source);
    }
  } catch (e) {
    console.warn("Failed to parse raw test:", e, raw);
  }

  const id =
    obj?._id?.$oid ||
    obj?._id ||
    obj?.id ||
    `${obj?.title || "test"}-${Math.random().toString(36).slice(2)}`;

  const qCount = Array.isArray(obj?.qs) ? obj.qs.length : 0;

  return {
    id,
    title: obj?.title || "Untitled Test",
    description: obj?.desc || obj?.description || "—",
    type: obj?.type || "—",
    category: obj?.cat || obj?.category || "—",
    creator: obj?.creator || "—",
    duration: Number(obj?.dur) || Number(obj?.duration) || 0,
    questions: qCount,
    score: obj?.score || 0,
    difficulty: obj?.diff || obj?.difficulty || "—",
    status: obj?.status || "—",
    __raw: raw,
  };



};

// Normalize response to tests
const normalizeResponseToTests = (data) => {
  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data?.source) {
    if (Array.isArray(data.source)) items = data.source;
    else if (typeof data.source === "string") {
      try {
        const parsed = JSON.parse(data.source);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        items = [data.source];
      }
    }
  } else if (data && typeof data === "object") {
    items = [data];
  }
  return items.map(normalizeTest);
};

// Extract token helper
const extractToken = () => {
  const storedData = sessionStorage.getItem("loginResponse");
  if (!storedData) return null;
  try {
    const parsed = JSON.parse(storedData);
    if (!parsed?.source) return null;
    const src = JSON.parse(parsed.source);
    return {
      token: src?.token || null,
      userId: src?._id?.$oid || src?._id || null,
    };
  } catch {
    return null;
  }
};

// Helper function to extract text from deeply nested objects
const extractText = (obj) => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj !== "object") return String(obj);

  if (obj.text) {
    return extractText(obj.text);
  }

  return "";
};

// Helper function to extract subtrait from deeply nested objects
const extractSubtrait = (obj) => {
  if (!obj || typeof obj !== "object") return "";

  if (obj.subtrait) return obj.subtrait;

  if (obj.text && typeof obj.text === "object") {
    return extractSubtrait(obj.text);
  }

  return "";
};

const TestCreate = () => {
  const { t } = useLanguage();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] =
    useState(null);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // Test Library list (for showing above skill chips)
  const [testList, setTestList] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTestDocId, setEditTestDocId] = useState(null);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  // Delete confirmation modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    skill: "",
    description: "",
    duration: 60,
    language: "",
    difficulty: "Medium",
    category: "",
    instructions: "",
    tags: [],
    passingScore: 60,
    maxAttempts: 3,
    minQuestions: 1,
  });
  const [editQuestions, setEditQuestions] = useState([]);
  const [createSkillFilter, setCreateSkillFilter] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // State for Edit modal question addition
  const [showAddQuestions, setShowAddQuestions] = useState(false);
  const [editSkillFilter, setEditSkillFilter] = useState([]);
  const [editSelectedQuestions, setEditSelectedQuestions] = useState([]);

  // Create test form state
  const [testForm, setTestForm] = useState({
    title: "",
    skill: "",
    description: "",
    duration: 60,
    language: "",
    difficulty: "Medium",
    category: "",
    instructions: "",
    tags: [],
    passingScore: 60,
    maxAttempts: 3,
    minQuestions: 1,
  });

  // Tags input state
  const [tagInput, setTagInput] = useState("");

  // Selection state for checkboxes (similar to QuestionBank)
  const [selectedIds, setSelectedIds] = useState([]);

  // Per-question skill drafts for the Edit modal token input
  const [skillDrafts, setSkillDrafts] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasFetchedRef = useRef(false);
  const tokenRef = useRef(null);

  // Fetch questions from QuestionBank
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const storedData = sessionStorage.getItem("loginResponse");
    let token = null;
    let userId = null;

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.source) {
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
        userId = sourceObj._id?.$oid || sourceObj._id || null;
      }
    }

    if (!token || !userId) {
      toast.error("Token or UserId not found");
      setLoading(false);
      return;
    }

    try {
      const apiPage = 1;
      const limit = 1000; // single request with large limit
      const response = await fetch(
        `${BaseUrl}/auth/retrievecollection?ColName=${uid}_QuestionBank&page=${apiPage}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      const data = await response.json();
      console.log("Fetched questions data:", data);

      if (!data || !Array.isArray(data.source)) {
        console.error("Invalid response format:", data);
        toast.error("Failed to load questions.");
        setLoading(false);
        return;
      }

      // Flatten all qs arrays, then map to internal UI shape
      const allQs = [];
      data.source.forEach((item) => {
        try {
          const parsedItem = JSON.parse(item);
          const parentId = parsedItem?._id?.$oid || parsedItem?._id || null;
          if (Array.isArray(parsedItem.qs)) {
            parsedItem.qs.forEach((q) => {
              // attach parent id so we can uniquely identify duplicates across resources
              allQs.push({ ...q, __parentId: parentId });
            });
          }
        } catch (err) {
          console.error("Error parsing item:", err);
        }
      });

      if (allQs.length === 0) {
        setTests([]);
        setLoading(false);
        return;
      }

      let counter = 0;
      const mapped = allQs.map((q) => {
        // options array from opts map (Option1..Option4), maintaining order
        const optsMap = q.opts || {};
        let options = [];
        if (q.type === "Disc") {
          const order = ["Option1", "Option2", "Option3", "Option4"];
          options = order
            .map((k) => optsMap[k])
            .filter((v) => v !== undefined && v !== null)
            .map((v) => (typeof v === "object" && v !== null ? v.text : v));
        } else {
          options = [
            optsMap.Option1,
            optsMap.Option2,
            optsMap.Option3,
            optsMap.Option4,
          ].filter((v) => v !== undefined && v !== null);
        }

        // correctOption from ans like 'Option N'
        let correctOption = null;
        if (q.type === "SingleSelect" && typeof q.ans === "string") {
          const m = q.ans.match(/Option\s+(\d+)/i);
          if (m) correctOption = parseInt(m[1], 10) - 1;
        }

        counter += 1;
        return {
          id: q.id,
          uiKey: `${q.id || "Q"}-${counter}`, // Add uiKey for selection tracking like QuestionBank
          title: q.q || "Untitled Question",
          description: q.q || "No description",
          type: q.type || "Multiple Select",
          category:
            Array.isArray(q.skills) && q.skills.length > 0
              ? q.skills[0]
              : "General",
          creator: "—",
          score: q.score || 1,
          duration: q.time || 0,
          questions: 1, // Each question is one question
          difficulty: q.level || "Medium",
          status: "Active",
          __raw: {
            qs: [q], // Wrap single question in array for modal compatibility
          },
          // Preserve original question data
          originalQuestion: {
            id: q.id,
            parentId: q.__parentId || null,
            text: q.q,
            type: q.type,
            score: q.score ?? 1,
            timeLimit: q.time ?? null,
            image: q.image || null,
            imageName: q.imageName || null,
            answer: q.ans || "",
            options,
            correctOption,
            skills: Array.isArray(q.skills) ? q.skills : [],
            notes: q.notes || "",
            opts: q.opts || {},
          },
        };
      });

      console.log(`Loaded ${mapped.length} questions from QuestionBank`);
      setTests([...mapped].reverse());
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to load questions");
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tokenRef.current = extractToken();
    if (!tokenRef.current) {
      setError("Token not found");
      setLoading(false);
      return;
    }
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchQuestions();
    fetchTestLibrary();
  }, [fetchQuestions]);

  // Fetch Test Library list
  const fetchTestLibrary = async () => {
    const creds = tokenRef.current || extractToken();
    if (!creds?.token || !creds?.userId) return;

    setTestsLoading(true);
    try {
      let allData = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?ColName=${uid}_TestLibrary&page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${creds.token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );

        const data = await response.json();
        if (data?.source && Array.isArray(data.source)) {
          allData = allData.concat(data.source);
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      const normalized = allData.map((item) => {
        const parsed = typeof item === "string" ? JSON.parse(item) : item;
        const qCount = Array.isArray(parsed?.qs) ? parsed.qs.length : 0;
        return {
          id: parsed._id?.$oid || parsed._id || "",
          tid: parsed.tid || parsed._id?.$oid || "",
          title: parsed.title || "Untitled Test",
          description: parsed.desc || parsed.description || "No description",
          duration: Number(parsed.dur) || Number(parsed.duration) || 0,
          questions: qCount,
          difficulty: parsed.diff || parsed.difficulty || "Medium",
          category: parsed.cat || parsed.category || "General",
          // additional fields to support full edit
          skill: parsed.skill || parsed.skills || "",
          lan: parsed.lan || parsed.language || "",
          instr: parsed.instr || parsed.instructions || "",
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          pass: parsed.pass ?? parsed.passingScore ?? 60,
          attempts: parsed.attempts ?? parsed.maxAttempts ?? 1,
          minQuestions: parsed.minQuestions ?? 1,
          status: parsed.status || "Active",
          creator: parsed.creator || "",
          created: parsed.created || parsed.createdAt || new Date().toISOString(),
          qs: parsed.qs || [],
        };
      });

      // Sort tests by creation date (newest first)
      const sortedTests = normalized.sort((a, b) => {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        return dateB - dateA; // Descending order (newest first)
      });

      setTestList(sortedTests);
    } catch (e) {
      console.error("Error fetching Test Library:", e);
      toast.error(t("failedtoloadtest") || "Failed to load tests");
    } finally {
      setTestsLoading(false);
    }
  };

  // Open Edit Test modal
  const handleOpenEditTest = (test) => {
    setEditTestDocId(test.id);
    setEditForm({
      title: test.title || "",
      skill: test.skill || "",
      description: test.description || "",
      duration: Number(test.duration) || 0,
      language: test.lan || test.language || "",
      difficulty: test.difficulty || "Medium",
      category: test.category || "",
      instructions: test.instr || "",
      tags: Array.isArray(test.tags) ? test.tags : [],
      passingScore: Number(test.pass || test.passingScore || 60),
      maxAttempts: Number(test.attempts || test.maxAttempts || 1),
      minQuestions: Number(test.minQuestions || 1),
    });
    // Deep copy and migrate answer to stable key if needed (preselect on open)
    const copied = Array.isArray(test.qs) ? JSON.parse(JSON.stringify(test.qs)) : [];
    const baseOrder = ['Option1', 'Option2', 'Option3', 'Option4'];
    const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, '');

    for (let i = 0; i < copied.length; i++) {
      const q = copied[i] || {};
      const type = String(q.type || '').toLowerCase();
      const opts = q.opts || {};
      const orderedKeys = [
        ...baseOrder.filter((k) => Object.prototype.hasOwnProperty.call(opts, k)),
        ...Object.keys(opts).filter((k) => !baseOrder.includes(k)),
      ];
      const labelByKey = (k) => {
        const v = opts[k];
        return typeof v === 'object' && v !== null ? (v.text ?? '') : String(v ?? '');
      };

      // helper: derive key from text like 'Option 2'
      const keyFromOptionText = (s) => {
        const m = String(s || '').match(/option\s*(\d+)/i);
        if (m) return `Option${m[1]}`;
        return '';
      };

      // Enhanced preselection logic for all question types (except Disc)
      if (!type.includes('disc')) {
        // For True/False questions
        if (type.includes('true') || type.includes('false')) {
          // Ensure options exist for True/False
          if (!opts.Option1 && !opts.Option2) {
            q.opts = {
              Option1: 'True',
              Option2: 'False'
            };
          }

          // Preselect based on answer
          if (typeof q.ans === 'string') {
            const ansNorm = norm(q.ans);
            if (ansNorm === 'true' || ansNorm === 'option1') {
              q.selAnsKey = 'Option1';
            } else if (ansNorm === 'false' || ansNorm === 'option2') {
              q.selAnsKey = 'Option2';
            }
          }
        }
        // For Yes/No questions
        else if (type.includes('yes') || type.includes('no')) {
          // Ensure options exist for Yes/No
          if (!opts.Option1 && !opts.Option2) {
            q.opts = {
              Option1: 'Yes',
              Option2: 'No'
            };
          }

          // Preselect based on answer
          if (typeof q.ans === 'string') {
            const ansNorm = norm(q.ans);
            if (ansNorm === 'yes' || ansNorm === 'option1') {
              q.selAnsKey = 'Option1';
            } else if (ansNorm === 'no' || ansNorm === 'option2') {
              q.selAnsKey = 'Option2';
            }
          }
        }
        // For SingleSelect and Image questions
        else if (type.includes('singleselect') || type.includes('image')) {
          if (!q.selAnsKey && typeof q.ans === 'string') {
            // Try to match by Option format first (e.g., "Option 1")
            let found = keyFromOptionText(q.ans);
            if (!found) {
              // Try to match by label text
              for (const k of orderedKeys) {
                if (norm(labelByKey(k)) === norm(q.ans)) {
                  found = k;
                  break;
                }
              }
            }
            if (found) q.selAnsKey = found;
          }
        }
        // For MultipleSelect questions
        else if (type.includes('multipleselect')) {
          if (typeof q.ans === 'string' && q.ans.includes(',')) {
            // Parse CSV format like "Option 1,Option 3"
            const selectedOptions = {};
            const parts = q.ans.split(',').map(s => s.trim());
            for (const part of parts) {
              const key = keyFromOptionText(part);
              if (key) {
                selectedOptions[key] = true;
              } else {
                // Try to match by label
                for (const k of orderedKeys) {
                  if (norm(labelByKey(k)) === norm(part)) {
                    selectedOptions[k] = true;
                    break;
                  }
                }
              }
            }
            q.ans = selectedOptions;
          }
        }
        // For Fillup questions
        else if (type.includes('fillup')) {
          // If options exist and ans matches one option's label, preselect that option
          if (!q.selAnsKey && orderedKeys.length > 0 && typeof q.ans === 'string') {
            for (const k of orderedKeys) {
              if (norm(labelByKey(k)) === norm(q.ans)) {
                q.selAnsKey = k;
                break;
              }
            }
          }
        }
        // For Essay and Coding questions
        else if (type.includes('essay') || type.includes('coding')) {
          q.selAnsKey = '';
          // Show existing answer content inside Notes editor if notes is empty
          if (!q.notes && typeof q.ans === 'string' && q.ans.trim()) {
            q.notes = q.ans;
          }
        }
      }
    }
    setEditQuestions(copied);
    setShowEditModal(true);

    // Reset add questions state
    setShowAddQuestions(false);
    setEditSkillFilter([]);
    setEditSelectedQuestions([]);
  };

  // Handle adding selected questions to edit modal
  const handleAddQuestionsToEdit = () => {
    const selectedQuestionsData = displayedQuestionsForEdit.filter((test) =>
      editSelectedQuestions.includes(test.uiKey || test.id || test._id)
    );

    if (selectedQuestionsData.length === 0) {
      toast.error("Please select at least one question to add");
      return;
    }

    // Convert selected questions to the same format as editQuestions
    const newQuestions = selectedQuestionsData.map((q) => ({
      id: q.originalQuestion.id || q.id,
      q: q.originalQuestion.text,
      type: q.originalQuestion.type,
      level: q.difficulty,
      score: q.originalQuestion.score || 1,
      time: q.originalQuestion.timeLimit || 60,
      ans: q.originalQuestion.answer,
      opts: q.originalQuestion.opts || {},
      notes: q.originalQuestion.notes || "",
      selAns: "",
      skills: q.originalQuestion.skills || [],
      image: q.originalQuestion.image || null,
      imageName: q.originalQuestion.imageName || null,
    }));

    // Add to existing questions
    setEditQuestions(prev => [...prev, ...newQuestions]);

    // Close add questions section
    setShowAddQuestions(false);
    setEditSkillFilter([]);
    setEditSelectedQuestions([]);
    toast.success(`${newQuestions.length} ${t("questionsAddedToTest")}`);

  };

  // Update Test via API
  const handleUpdateTest = async () => {
    if (isUpdating) return; // prevent double clicks
    setIsUpdating(true);
    const storedData = sessionStorage.getItem("loginResponse");
    let token = null,
      userId = null;
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const sourceObj = JSON.parse(parsedData.source);
      token = sourceObj.token;
      userId = sourceObj._id?.$oid || sourceObj._id;
    }

    if (!token || !userId) {
      setIsUpdating(false);

      // toast.error("User not authenticated.");
      return;
    }

    if (!editTestDocId) {
      setIsUpdating(false);

      // toast.error("Missing test id");
      return;
    }

    // Transform questions per type before submit
    const transformQsForSubmit = (arr) => {
      const out = (arr || []).map((q) => {
        const type = String(q.type || '').toLowerCase();
        const opts = q.opts || {};
        const labelByKey = (k) => {
          const v = opts[k];
          return typeof v === 'object' && v !== null ? (v.text ?? '') : String(v ?? '');
        };
        const keyFromAny = (s) => {
          if (!s) return '';
          const m = String(s).match(/option\s*(\d+)/i);
          return m ? `Option${m[1]}` : '';
        };
        const keyToPretty = (k) => {
          const m = String(k).match(/Option\s*(\d+)/i);
          return m ? `Option ${m[1]}` : String(k);
        };
        const clone = { ...q };
        if (type.includes('true') || type.includes('false') || type.includes('yes') || type.includes('no')) {
          if (clone.selAnsKey) clone.ans = labelByKey(clone.selAnsKey);
          // Remove UI-only key from payload
          delete clone.selAnsKey;
          return clone;
        }
        if (type.includes('fillup') || type.includes('essay') || type.includes('coding')) {
          // For Essay/Coding, persist notes into ans
          if (type.includes('essay') || type.includes('coding')) {
            if (typeof clone.notes === 'string') clone.ans = clone.notes;
          }
          // Remove UI-only key from payload
          delete clone.selAnsKey;
          return clone;
        }
        if (type.includes('singleselect') || type.includes('image')) {
          if (clone.selAnsKey) {
            // store as 'Option N' with space as in create payloads
            const pretty = keyToPretty(clone.selAnsKey);
            clone.ans = pretty;
          } else if (typeof clone.ans === 'string') {
            // normalize any key-like value to pretty
            const k = keyFromAny(clone.ans) || clone.ans;
            clone.ans = keyToPretty(k);
          }
          delete clone.selAnsKey;
          return clone;
        }
        if (type.includes('multipleselect')) {
          // Build CSV 'Option 1,Option 2' with spaces
          let keys = [];
          if (clone.ans && typeof clone.ans === 'object') {
            keys = Object.keys(clone.ans).filter((k) => clone.ans[k]);
          } else if (typeof clone.ans === 'string' && clone.ans.trim()) {
            const parts = clone.ans.split(',').map((s) => s.trim()).filter(Boolean);
            keys = parts.map((p) => keyFromAny(p) || p);
          }
          const keyed = keys
            .map((k) => {
              const m = String(k).match(/option\s*(\d+)/i);
              return m ? { n: parseInt(m[1], 10), key: `Option${m[1]}` } : { n: 999, key: k };
            })
            .sort((a, b) => a.n - b.n)
            .map((o) => keyToPretty(o.key));
          if (keyed.length) clone.ans = keyed.join(',');
          delete clone.selAnsKey;
          return clone;
        }
        // Disc: keep ans object, but remove UI-only key for payload parity with create
        delete clone.selAnsKey;
        return clone;
      });
      return out;
    };

    const updatedPayload = {
      // preserve typical fields used when creating tests
      title: editForm.title,
      skill: editForm.skill,
      desc: editForm.description,
      dur: Number(editForm.duration) || 0,
      lan: editForm.language,
      diff: editForm.difficulty,
      cat: editForm.category,
      instr: editForm.instructions,
      tags: Array.isArray(editForm.tags) ? editForm.tags : [],
      qs: Array.isArray(editQuestions) ? transformQsForSubmit(editQuestions) : [],
      pass: Number(editForm.passingScore) || 0,
      attempts: Number(editForm.maxAttempts) || 1,
      minQuestions: Number(editForm.minQuestions) || 1,
      updated: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        `${BaseUrl}/eUpdateColl?resourceId=${editTestDocId}&ColName=${uid}_TestLibrary`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
          body: JSON.stringify(updatedPayload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update test");
      }

      // Update local list UI
      setTestList((prev) =>
        prev.map((t) =>
          t.id === editTestDocId
            ? {
              ...t,
              title: updatedPayload.title,
              description: updatedPayload.desc,
              duration: updatedPayload.dur,
              difficulty: updatedPayload.diff,
              category: updatedPayload.cat,
              qs: updatedPayload.qs,
              questions: Array.isArray(updatedPayload.qs)
                ? updatedPayload.qs.length
                : t.questions,
              minQuestions: updatedPayload.minQuestions,
              pass: updatedPayload.pass,
              attempts: updatedPayload.attempts,
            }
            : t
        )
      );

      toast.success("Test updated successfully");
      setShowEditModal(false);
      setEditTestDocId(null);
      // Refresh the test list to show updated data
      await fetchTestLibrary();
    } catch (e) {
      console.error("Update test error:", e);
      toast.error("Failed to update test");
    }
    finally {
      setIsUpdating(false);
    }
  };


  // Open delete confirmation modal (called from TestListTable)
  const requestDeleteTest = (test) => {
    setDeleteTarget(test);
    setConfirmDeleteOpen(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const testId = deleteTarget.id;
    const creds = tokenRef.current || extractToken();
    if (!creds?.token) return;
    try {
      setIsDeleting(true);
      const response = await fetch(
        `${BaseUrl}/auth/eDeleteWCol?ColName=${uid}_TestLibrary&resourceId=${testId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${creds.token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete test");
      setTestList((prev) => prev.filter((t) => t.id !== testId));
      toast.success("Test deleted successfully");
      setConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      console.error("Delete test error:", e);
      toast.error("Failed to delete test");
    } finally {
      setIsDeleting(false);
    }
  };

  // Build merged skills per question text across ALL tests (stable regardless of duplicates)
  const mergedSkillsByText = useMemo(() => {
    const expandSkills = (arr, fallbackCat) => {
      const out = new Set();
      const src = Array.isArray(arr) && arr.length > 0 ? arr : [fallbackCat || "General"];
      for (const s of src) {
        String(s || "")
          .split(/[;,|]/)
          .map((p) => p.trim().toLowerCase())
          .filter(Boolean)
          .forEach((p) => out.add(p));
      }
      return out;
    };
    const map = new Map();
    for (const t of tests) {
      const text = (t.originalQuestion.text || "").trim();
      if (!text) continue;
      const set = map.get(text) || new Set();
      for (const s of expandSkills(t.originalQuestion?.skills, t.category)) set.add(s);
      map.set(text, set);
    }
    return map;
  }, [tests]);

  // 1️⃣ Filter tests by search term (skills)
  const filteredTests = useMemo(() => {
    if (!searchTerm) return tests; // use base array

    const norm = (s) => String(s || "").toLowerCase();
    const term = norm(searchTerm);

    return tests.filter((test) => {
      const text = (test.originalQuestion.text || "").trim();
      const set = mergedSkillsByText.get(text);
      if (!set || set.size === 0) return false;
      for (const s of set) {
        if (norm(s).includes(term)) return true;
      }
      return false;
    });
  }, [tests, searchTerm, mergedSkillsByText]);

  // 2️⃣ Deduplicate by question text with stable Skills
  // - Prefer the duplicate with richer skills (non-General, more tokens)
  // - Merge skills from ALL tests having the same text so display is consistent
  const uniqueTests = useMemo(() => {
    // 1) Choose best representative from filteredTests
    const byText = new Map(); // text -> item
    for (const test of filteredTests) {
      const text = (test.originalQuestion.text || "").trim();
      if (!text) continue;
      const cur = byText.get(text);
      if (!cur) { byText.set(text, test); continue; }
      const curSkills = mergedSkillsByText.get(text) || new Set();
      const newSkills = mergedSkillsByText.get(text) || new Set();
      const curIsGeneric = curSkills.size === 0 || (curSkills.size === 1 && curSkills.has("general"));
      const newIsGeneric = newSkills.size === 0 || (newSkills.size === 1 && newSkills.has("general"));
      const newIsRicher = newSkills.size > curSkills.size || (curIsGeneric && !newIsGeneric);
      if (newIsRicher) byText.set(text, test);
    }

    // 3) Project result array with merged skills injected for stable display
    const result = [];
    for (const [text, item] of byText.entries()) {
      const mergedSet = mergedSkillsByText.get(text);
      if (mergedSet && mergedSet.size) {
        const normalized = Array.from(mergedSet)
          .map((s) => String(s || "").trim().toLowerCase())
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .sort();
        result.push({
          ...item,
          originalQuestion: {
            ...item.originalQuestion,
            skills: normalized,
          },
        });
      } else {
        result.push(item);
      }
    }

    return result;
  }, [filteredTests, mergedSkillsByText]);


  // Overall total across all questions (deduped by text, independent of search)
  const allUniqueTests = useMemo(() => {
    const seen = new Set();
    return tests.filter((test) => {
      const text = (test.originalQuestion.text || "").trim();
      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    });
  }, [tests]);



  const displayedQuestions = useMemo(() => {
    if (!createSkillFilter || createSkillFilter.length === 0) return uniqueTests;

    const selectedSkills = createSkillFilter.map((s) => s.toLowerCase().trim());

    console.log("Filtering by selectedSkills:", selectedSkills);

    return uniqueTests.filter((test) => {
      const questionSkills = Array.isArray(test.originalQuestion?.skills)
        ? test.originalQuestion.skills.map((s) => s.toLowerCase().trim())
        : [];

      // ✅ Match only by skills, ignore category completely
      return questionSkills.some((s) => selectedSkills.includes(s));
    });
  }, [uniqueTests, createSkillFilter]);

  // For Edit modal - questions matching selected skills in edit mode
  const displayedQuestionsForEdit = useMemo(() => {
    if (!editSkillFilter || editSkillFilter.length === 0) return uniqueTests;

    const selectedSkills = editSkillFilter.map((s) => s.toLowerCase().trim());

    return uniqueTests.filter((test) => {
      const questionSkills = Array.isArray(test.originalQuestion?.skills)
        ? test.originalQuestion.skills.map((s) => s.toLowerCase().trim())
        : [];

      return questionSkills.some((s) => selectedSkills.includes(s));
    });
  }, [uniqueTests, editSkillFilter]);


  const getQId = (q, idx) => {
    if (q.id) return String(q.id);
    if (q._id) return String(q._id);
    const txt = String(q.originalQuestion?.text || "").trim();
    return txt ? `text:${txt}` : `idx:${idx}`;
  };

  // Keep selections valid - only remove selections for questions that no longer exist in the entire dataset
  // DO NOT remove selections just because they're not currently displayed due to skill filtering
  useEffect(() => {
    setSelectedQuestions((prev) =>
      prev.filter((id) => uniqueTests.some((q, i) => getQId(q, i) === id))
    );
  }, [uniqueTests]); // Changed dependency from displayedQuestions to uniqueTests

  // Check for pre-selected questions from AssessmentLibrary (runs after uniqueTests is available)
  useEffect(() => {
    const preSelectedQuestions = sessionStorage.getItem("preSelectedQuestions");
    if (preSelectedQuestions && uniqueTests.length > 0) {
      try {
        const parsed = JSON.parse(preSelectedQuestions);
        // Strict match by normalized text only (punctuation/quotes/dash-insensitive)
        const norm = (s) => {
          let v = String(s || "").toLowerCase();
          // unicode normalization and strip diacritics
          try { v = v.normalize('NFKD'); } catch (_) { }
          v = v.replace(/[\u0300-\u036f]/g, '');
          // normalize unicode quotes and dashes
          v = v
            .replace(/[“”„«»]/g, '"')
            .replace(/[’‘‛‹›]/g, "'")
            .replace(/[–—−]/g, '-')
            .replace(/[\u200B-\u200D\uFEFF]/g, ''); // remove zero-widths
          // drop punctuation/symbols; keep alphanumerics and spaces
          v = v.replace(/[^a-z0-9]+/g, ' ');
          // collapse whitespace
          v = v.trim().replace(/\s+/g, ' ');
          return v;
        };

        const pairSet = new Set(); // just normalized text
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item === "object") {
              const text = norm(item.text);
              if (text) pairSet.add(text);
            }
          });
        }
        console.log("pairSet (text only)", pairSet);

        // Map each normalized text to a single (first) matching uiKey to avoid duplicates
        const pickedByText = new Map();
        // Use uniqueTests (deduped by text) so selected uiKey matches the visible row
        for (const q of uniqueTests) {
          const text = norm(q.originalQuestion.text || "");
          if (!pairSet.has(text)) continue;
          if (!pickedByText.has(text)) {
            pickedByText.set(text, q.uiKey);
          }
        }

        let preSelectedUiKeys = Array.from(pickedByText.values());

        // Fuzzy fallback: for any text in pairSet not matched yet, try substring matching
        if (preSelectedUiKeys.length < pairSet.size) {
          const matchedTexts = new Set(Array.from(pickedByText.keys()));
          for (const targetText of pairSet) {
            if (matchedTexts.has(targetText)) continue;
            let foundKey = '';
            for (const q of uniqueTests) {
              const qt = norm(q.originalQuestion.text || '');
              if (qt.includes(targetText) || targetText.includes(qt)) {
                foundKey = q.uiKey;
                break;
              }
            }
            if (foundKey) {
              preSelectedUiKeys.push(foundKey);
            }
          }
        }
        console.log("preSelectedUiKeys", preSelectedUiKeys);

        setSelectedIds(preSelectedUiKeys);

        // Clear after using
        sessionStorage.removeItem("preSelectedQuestions");
      } catch (error) {
        console.error("Error parsing pre-selected questions:", error);
      }
    }
  }, [uniqueTests]);

  const totalPages = Math.ceil(uniqueTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTests = uniqueTests.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    // When skills are selected, DO NOT auto-select questions
    // Let user manually select the questions they want
    // This effect can be removed if no other logic is needed
  }, [createSkillFilter, uniqueTests]);
  // const paginatedTests = filteredTests.slice(
  //   startIndex,
  //   startIndex + itemsPerPage
  // );

  // Reset to first page and clear selection when search changes (similar to QuestionBank)
  useEffect(() => {
    setCurrentPage(1);

  }, [searchTerm]);

  const handleViewQuestions = (test) => {
    setSelectedTestForQuestions(test);
    setShowQuestionsModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      // Add all visible questions to selectedIds
      const visibleIds = filteredTests.map((q) => q.uiKey);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    } else {
      // Remove all visible questions from selectedIds
      const visibleIds = filteredTests.map((q) => q.uiKey);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  // Check if all filtered questions are selected for "Select All" checkbox
  const isAllSelected = useMemo(() => {
    if (filteredTests.length === 0) return false;
    return filteredTests.every((q) => selectedIds.includes(q.uiKey));
  }, [selectedIds, filteredTests]);

  const toggleSelect = (uiKey) => {
    setSelectedIds((prev) =>
      prev.includes(uiKey) ? prev.filter((x) => x !== uiKey) : [...prev, uiKey]
    );
  };

  // Enhanced form validation with detailed checks
  const formValidation = useMemo(() => {
    const validation = {
      isValid: false,
      errors: [],
      fieldErrors: {}
    };

    // Check mandatory text fields (marked with *)
    const requiredTextFields = [
      { field: 'title', label: 'Title' },
      { field: 'skill', label: 'Skill' },
      { field: 'category', label: 'Category' },
      { field: 'language', label: 'Language' },
      { field: 'difficulty', label: 'Difficulty' }
    ];

    const missingFields = [];
    requiredTextFields.forEach(({ field, label }) => {
      if (!testForm[field] || testForm[field].trim() === "") {
        missingFields.push(label);
        validation.fieldErrors[field] = ``;
      }
    });

    // Check numeric fields with proper ranges
    if (testForm.passingScore === "" || testForm.passingScore < 0 || testForm.passingScore > 100) {
      validation.fieldErrors.passingScore = "Passing score must be between 0 and 100";
    }

    if (testForm.maxAttempts === "" || testForm.maxAttempts < 1) {
      validation.fieldErrors.maxAttempts = "Maximum attempts must be at least 1";
    }

    if (testForm.minQuestions === "" || testForm.minQuestions < 1) {
      validation.fieldErrors.minQuestions = "Minimum questions must be at least 1";
    } else if (testForm.minQuestions > selectedQuestions.length) {
      validation.fieldErrors.minQuestions = "Min questions must not exceed selected questions";
    }

    // Check at least one question is selected
    if (selectedQuestions.length === 0) {
      validation.fieldErrors.questions = "Please select at least one question";
    }

    // Set overall validation status
    validation.isValid = (
      missingFields.length === 0 &&
      !validation.fieldErrors.passingScore &&
      !validation.fieldErrors.maxAttempts &&
      !validation.fieldErrors.minQuestions &&
      !validation.fieldErrors.questions
    );

    return validation;
  }, [testForm, selectedQuestions.length]);

  // For backward compatibility
  const isCreateFormValid = formValidation.isValid;

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setTestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Tag handling functions (same as TestCreateBasicInfoTab)
  const handleAddTag = () => {
    if (tagInput.trim() !== "") {
      const updatedTags = [...(testForm.tags || []), tagInput.trim()];
      setTestForm((prev) => ({
        ...prev,
        tags: updatedTags,
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = (testForm.tags || []).filter(
      (tag) => tag !== tagToRemove
    );
    setTestForm((prev) => ({
      ...prev,
      tags: updatedTags,
    }));
  };

  // Handle test creation
  const handleCreateTest = async () => {
    // Use enhanced validation
    if (!formValidation.isValid) {
      // Show the first error message
      if (formValidation.errors.length > 0) {
        toast.error(formValidation.errors[0]);
      }
      return;
    }

    const storedData = sessionStorage.getItem("loginResponse");
    if (!storedData) {
      toast.error("User session not found");
      return;
    }

    setIsCreating(true);

    try {
      const parsedData = JSON.parse(storedData);
      const sourceObj = JSON.parse(parsedData.source);
      const token = sourceObj.token;
      const userId = sourceObj._id?.$oid || sourceObj._id;
      const creator = sourceObj.firstName || "SUPERADMIN";

      // Get selected questions - use the questions that are actually checked in the modal
      const selectedQuestionsData = displayedQuestions.filter((test) =>
        selectedQuestions.includes(test.uiKey || test.id || test._id)
      );

      if (selectedQuestionsData.length === 0) {
        toast.error("Please select at least one question");
        return;
      }

      const tid = uuidv4();

      const checkedQuestions = displayedQuestions.filter((q) => {
        const key = String(q.uiKey || q.id || q._id || "");
        return selectedQuestions.includes(key);
      });

      if (checkedQuestions.length === 0) {
        toast.error("Please select at least one question before continuing.");
        return;
      }


      // Format questions to match Test.jsx structure
      const formattedQuestions = checkedQuestions.map((q, index) => ({
        id: `Q${String(index + 1).padStart(2, "0")}`,
        q: q.originalQuestion.text,
        type: q.originalQuestion.type,
        level: q.difficulty,
        score: q.originalQuestion.score || 1,
        time: q.originalQuestion.timeLimit || 60,
        ans: q.originalQuestion.answer,
        opts: q.originalQuestion.opts || {},
        notes: q.originalQuestion.notes || "",
        selAns: "",
        skills: q.originalQuestion.skills || [],
        image: q.originalQuestion.image || null,
        imageName: q.originalQuestion.imageName || null,
      }));

      // Create payload matching Test.jsx structure
      const payload = {
        tid,
        title: testForm.title,
        skill: testForm.skill,
        desc: testForm.description,
        dur: testForm.duration,
        lan: testForm.language,
        diff: testForm.difficulty,
        cat: testForm.category,
        instr: testForm.instructions,
        tags: testForm.tags || [],
        qs: formattedQuestions,
        pass: testForm.passingScore,
        attempts: testForm.maxAttempts,
        minQuestions: testForm.minQuestions,
        status: "Active",
        plag: false,
        shuffle: false,
        showRes: false,
        created: new Date().toISOString(),
        userId: { $oid: userId },
        creator,
        sa: SuperAdminID,
      };

      // Save to TestLibrary using same endpoint as Test.jsx
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

      if (!response.ok) {
        throw new Error("Failed to save test");
      }

      toast.success("Test created successfully!");
      setShowCreateTestModal(false);
      setSelectedIds([]);
      setSelectedQuestions([]);
      setCreateSkillFilter([]);
      setTestForm({
        title: "",
        skill: "",
        description: "",
        duration: 60,
        language: "",
        difficulty: "Medium",
        category: "",
        instructions: "",
        tags: [],
        passingScore: 60,
        maxAttempts: 3,
        minQuestions: 1,
      });
      // Refresh test list to show the newly created test at the top
      await fetchTestLibrary();
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error("Error creating test");
    } finally {
      setIsCreating(false);
    }
  };

  // Get skill counts dynamically (normalized) from uniqueTests (deduped)
  const skillCounts = useMemo(() => {
    const counts = {};

    for (const test of uniqueTests) {
      const rawSkills =
        Array.isArray(test.originalQuestion.skills) &&
          test.originalQuestion.skills.length > 0
          ? test.originalQuestion.skills
          : [test.category || "General"];

      // expand composite skill strings into separate tokens
      const skills = rawSkills
        .flatMap((s) => String(s || "").split(/[;,|]/))
        .map((s) => s.trim())
        .filter(Boolean);

      for (let s of skills) {
        let v = String(s || "").trim();
        if (!v) continue;
        v = v.toLowerCase();
        v = v.charAt(0).toUpperCase() + v.slice(1);
        counts[v] = (counts[v] || 0) + 1;
      }
    }

    return counts;
  }, [uniqueTests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">
            {t("loadingTests", "Loading Tests...")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-3">{error}</div>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => {
            setError("");
            hasFetchedRef.current = false;
            setLoading(true);
            fetchTests();
          }}
        >
          {t("retry", "Retry")}
        </button>
      </div>
    );
  }

  const colors = [
    "bg-blue-100 border-blue-300 text-blue-700",
    "bg-green-100 border-green-300 text-green-700",
    "bg-yellow-100 border-yellow-300 text-yellow-700",
    "bg-purple-100 border-purple-300 text-purple-700",
    "bg-pink-100 border-pink-300 text-pink-700",
    "bg-teal-100 border-teal-300 text-teal-700",

    "bg-cyan-100 border-cyan-300 text-cyan-700",
  ];

  const generateRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };
  const isFormInvalid = !editForm.title?.trim() ||
    !editForm.skill?.trim() ||
    !editForm.category?.trim() ||
    !editForm.language?.trim() ||
    !editForm.difficulty?.trim() ||
    editForm.passingScore === "" ||
    editForm.maxAttempts === "";

  return (
    <div className="max-w-7xl">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("testLibrary")}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t("manageandorganise")}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateTestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            {t("createtest")}
          </button>
        </div>
      </div>

      {/* Test List - shown above Skill chips summary */}
      <TestListTable
        tests={testList}
        loading={testsLoading}
        token={tokenRef.current?.token}
        onDelete={requestDeleteTest}
        onEdit={handleOpenEditTest}
      />

      {/* Skill chips summary */}
      {false && (
        <div className="flex flex-wrap gap-2 mb-4 max-h-10 overflow-y-auto">

          {/* Total (overall), Filtered (current), and Selected counts */}
          <span className="px-4 py-2 text-xs rounded-full border bg-gray-100 border-gray-600 text-gray-800">
            {t("total", "Total")}: {allUniqueTests.length}
          </span>
          {/* <span className="px-4 py-2 text-xs rounded-full border bg-amber-100 border-amber-300 text-amber-900">
          {t("filtered", "Filtered")}: {uniqueTests.length}
        </span>
        <span className="px-4 py-2 text-xs rounded-full border bg-blue-100 border-blue-300 text-blue-800">
          {t("selectedquestions", "Selected")}: {selectedIds.length}
        </span> */}
          {Object.entries(skillCounts).map(([skill, count]) => {
            // Assign a random color for each skill
            const randomColor = generateRandomColor(); // You can define this function to return Tailwind classes like "bg-blue-100 border-blue-300 text-blue-700"

            return (
              <span
                key={skill}
                className={`px-4 py-2 text-xs rounded-full border cursor-pointer ${randomColor}`}
                onClick={() => setSearchTerm(skill)}
              >
                {skill}: {count}
              </span>
            );
          })}


        </div>
      )}


      {/* Edit Test Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {t("EditTest")}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0 ml-2"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("basicInformation")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("testTitle")} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("skill")} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={editForm.skill}
                        onChange={(e) => setEditForm((p) => ({ ...p, skill: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("language")} <span className="text-red-500">*</span></label>
                      <select
                        value={editForm.language}
                        onChange={(e) => setEditForm((p) => ({ ...p, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="" disabled>{t("selectlang")}</option>
                        <option value="English">{t("english")}</option>
                        <option value="Arabic">{t("arabic")}</option>
                        <option value="Spanish">{t("spanish")}</option>
                        <option value="French">{t("french")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("difficulty")} <span className="text-red-500">*</span></label>
                      <select
                        value={editForm.difficulty}
                        onChange={(e) => setEditForm((p) => ({ ...p, difficulty: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="" disabled>{t("select")}</option>
                        <option value="Easy">{t("easy")}</option>
                        <option value="Medium">{t("medium")}</option>
                        <option value="Hard">{t("hard")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("category")} <span className="text-red-500">*</span></label>
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="" disabled>{t("selectcategory")}</option>
                        <option value="Technical">{t("technical")}</option>
                        <option value="Behavioral">{t("behavioral")}</option>
                        <option value="Cognitive">{t("cognitive")}</option>
                        <option value="Other">{t("other")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("duration")}</label>
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={(e) => setEditForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t("description")}</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Configuration Section */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("testConfiguration")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Passing Score */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("passingScore")} (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.passingScore}
                        onChange={(e) => setEditForm((p) => ({ ...p, passingScore: Number(e.target.value) || 0 }))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={t("enterpassignscore")}
                      />
                    </div>

                    {/* Max Attempts */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("maxAttempts")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.maxAttempts}
                        onChange={(e) => setEditForm((p) => ({ ...p, maxAttempts: Number(e.target.value) || 1 }))}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={t("entermaximumattempts")}
                      />
                    </div>

                    {/* Min Questions */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("minQuestions")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editForm.minQuestions}
                        onChange={(e) => setEditForm((p) => ({ ...p, minQuestions: Number(e.target.value) || 1 }))}
                        min="1"
                        max={editQuestions.length || 1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={t("enterminquestions", "Enter minimum questions")}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t("totalQuestions", "Total questions")}: {editQuestions.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("additionaldetails")}
                  </h4>

                  {/* Instructions */}
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("instructions")}
                    </label>
                    <textarea
                      value={editForm.instructions}
                      onChange={(e) => setEditForm((p) => ({ ...p, instructions: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder={t("provideInstructions")}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("tags")}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(editForm.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => {
                              const updatedTags = (editForm.tags || []).filter((t, i) => i !== idx);
                              setEditForm((p) => ({ ...p, tags: updatedTags }));
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={t("addTagPlaceholder")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.target.value.trim()) {
                            e.preventDefault();
                            const newTag = e.target.value.trim();
                            const updatedTags = [...(editForm.tags || []), newTag];
                            setEditForm((p) => ({ ...p, tags: updatedTags }));
                            e.target.value = "";
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.parentElement.querySelector('input');
                          if (input.value.trim()) {
                            const newTag = input.value.trim();
                            const updatedTags = [...(editForm.tags || []), newTag];
                            setEditForm((p) => ({ ...p, tags: updatedTags }));
                            input.value = "";
                          }
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {t("add")}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Questions Editor with options */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">{t("questions")}</h4>
                    <button
                      onClick={() => setShowAddQuestions(true)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t("addMoreQuestions")}
                    </button>
                  </div>
                  {editQuestions.length === 0 ? (
                    <div className="text-sm text-gray-500">{t("noquestionsavailable")}</div>
                  ) : (
                    <div className="space-y-4">
                      {editQuestions.map((q, idx) => {
                        const typeLC = (q?.type || '').toLowerCase();
                        // Build entries with deterministic order Option1..Option4 then extras
                        const baseOrder = ['Option1', 'Option2', 'Option3', 'Option4'];
                        let entries = [];
                        if (q?.opts && typeof q.opts === 'object') {
                          const ordered = baseOrder
                            .filter((k) => Object.prototype.hasOwnProperty.call(q.opts, k))
                            .map((k) => [k, q.opts[k]]);
                          const extras = Object.keys(q.opts)
                            .filter((k) => !baseOrder.includes(k))
                            .map((k) => [k, q.opts[k]]);
                          entries = [...ordered, ...extras];
                        }
                        // Synthesize options for True/False or Yes/No if not provided
                        if ((!entries || entries.length === 0) && (/(true|false)/i.test(typeLC) || /(yes|no)/i.test(typeLC))) {
                          entries = /(yes|no)/i.test(typeLC)
                            ? [['Option1', { text: 'Yes' }], ['Option2', { text: 'No' }]]
                            : [['Option1', { text: 'True' }], ['Option2', { text: 'False' }]];
                        }
                        // Helper: determine if option key is selected for this question
                        const isSelected = (key) => {
                          if (!q) return false;
                          const type = String(q.type || '').toLowerCase();
                          const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
                          const isDisc = /disc/i.test(type);
                          const isMulti = /multipleselect/i.test(type);

                          if (isDisc) {
                            // Disc: never preselect in Edit
                            return false;
                          }

                          // For True/False questions
                          if (type.includes('true') || type.includes('false')) {
                            if (typeof q.selAnsKey === 'string') return q.selAnsKey === key;
                            if (typeof q.ans === 'string') {
                              const ansNorm = norm(q.ans);
                              if (key === 'Option1' && (ansNorm === 'true' || ansNorm === 'option1')) return true;
                              if (key === 'Option2' && (ansNorm === 'false' || ansNorm === 'option2')) return true;
                            }
                            return false;
                          }

                          // For Yes/No questions
                          if (type.includes('yes') || type.includes('no')) {
                            if (typeof q.selAnsKey === 'string') return q.selAnsKey === key;
                            if (typeof q.ans === 'string') {
                              const ansNorm = norm(q.ans);
                              if (key === 'Option1' && (ansNorm === 'yes' || ansNorm === 'option1')) return true;
                              if (key === 'Option2' && (ansNorm === 'no' || ansNorm === 'option2')) return true;
                            }
                            return false;
                          }

                          // For MultipleSelect questions
                          if (isMulti) {
                            // Check if ans is an object with boolean values
                            if (q.ans && typeof q.ans === 'object') return Boolean(q.ans[key]);
                            // Check if ans is a CSV string
                            if (typeof q.ans === 'string') {
                              const set = new Set(q.ans.split(',').map((s) => norm(s.trim())));
                              return set.has(norm(key)) || set.has(norm(key.replace('Option', 'Option ')));
                            }
                            return false;
                          }

                          // For SingleSelect, Image, Fillup questions
                          if (typeof q.selAnsKey === 'string') return q.selAnsKey === key;
                          if (typeof q.ans === 'string') {
                            // Direct key match or Option format match
                            return norm(q.ans) === norm(key) || norm(q.ans) === norm(key.replace('Option', 'Option '));
                          }
                          return false;
                        };

                        const updateAnsSingle = (key) => {
                          setEditQuestions((prev) => {
                            const c = [...prev];
                            const typeStr = String(c[idx]?.type || '').toLowerCase();
                            const isDisc = /disc/i.test(typeStr);
                            const isYN = /(yes\s*\/\s*no|yes|no)/i.test(typeStr);
                            const isTF = /(true\s*\/\s*false|true|false)/i.test(typeStr);
                            const isFill = /fillup/i.test(typeStr);
                            const currentKey = c[idx]?.selAnsKey || '';
                            const nextKey = currentKey === key ? '' : key;

                            if (isDisc) {
                              // Disc: do not allow selection changes
                              return c;
                            } else if (isTF) {
                              // For True/False: store actual text value
                              c[idx] = {
                                ...c[idx],
                                selAnsKey: nextKey,
                                ans: nextKey === 'Option1' ? 'True' : nextKey === 'Option2' ? 'False' : ''
                              };
                            } else if (isYN) {
                              // For Yes/No: store actual text value
                              c[idx] = {
                                ...c[idx],
                                selAnsKey: nextKey,
                                ans: nextKey === 'Option1' ? 'Yes' : nextKey === 'Option2' ? 'No' : ''
                              };
                            } else if (isFill) {
                              // For Fillup with options: update ans to actual label text; keep selAnsKey for UI only
                              const v = c[idx]?.opts?.[key];
                              const label = typeof v === 'object' && v !== null ? (v.text ?? '') : String(v ?? '');
                              c[idx] = { ...c[idx], selAnsKey: nextKey, ans: label };
                            } else {
                              // For other question types: store Option format
                              c[idx] = {
                                ...c[idx],
                                selAnsKey: nextKey,
                                ans: nextKey ? nextKey.replace('Option', 'Option ') : ''
                              };
                            }
                            return c;
                          });
                        };

                        const toggleAnsMulti = (key) => {
                          setEditQuestions((prev) => {
                            const c = [...prev];
                            const cur = { ...c[idx] };
                            const obj = cur.ans && typeof cur.ans === 'object' ? { ...cur.ans } : {};
                            obj[key] = !obj[key];
                            cur.ans = obj;
                            c[idx] = cur;
                            return c;
                          });
                        };

                        const updateOptionText = (key, val) => {
                          setEditQuestions((prev) => {
                            const c = [...prev];
                            const cur = { ...c[idx] };
                            const opts = { ...(cur.opts || {}) };
                            const v = opts[key];
                            if (v && typeof v === 'object') {
                              opts[key] = { ...v, text: val };
                            } else {
                              opts[key] = val;
                            }
                            cur.opts = opts;
                            c[idx] = cur;
                            return c;
                          });
                        };

                        return (
                          <div key={q.id || idx} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-gray-500">Q{idx + 1}</div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{q.type || 'SingleSelect'}</span>
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                  onClick={() => {
                                    setEditQuestions((prev) => prev.filter((_, i) => i !== idx));
                                    toast.success(t('questionRemoved', 'Question removed from test'));
                                  }}
                                  title={t('deleteQuestion', 'Delete Question')}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M3 6H5H21"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M10 11V17"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M14 11V17"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Question text */}
                            <input
                              type="text"
                              value={q.q || q.text || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditQuestions((prev) => {
                                  const copy = [...prev];
                                  const item = { ...copy[idx] };
                                  if (item.q !== undefined) item.q = val; else item.text = val;
                                  copy[idx] = item;
                                  return copy;
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                              placeholder={t('question')}
                            />

                            {/* Skills display and editor */}
                            <div className="mb-3">
                              <div className="text-xs font-medium text-gray-600 mb-1">{t('skills', 'Skills')}</div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {(Array.isArray(q.skills) ? q.skills : []).length === 0 ? (
                                  <span className="text-gray-400 text-xs">—</span>
                                ) : (
                                  (q.skills || []).map((s, si) => (
                                    <span key={`${idx}-skill-${si}`} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                      {String(s)}
                                      <button
                                        type="button"
                                        className="text-blue-700 hover:text-blue-900"
                                        onClick={() => {
                                          setEditQuestions((prev) => {
                                            const copy = [...prev];
                                            const cur = Array.isArray(copy[idx].skills) ? [...copy[idx].skills] : [];
                                            cur.splice(si, 1);
                                            copy[idx] = { ...copy[idx], skills: cur };
                                            return copy;
                                          });
                                        }}
                                        aria-label="Remove skill"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={skillDrafts[idx] || ''}
                                  onChange={(e) => setSkillDrafts((d) => ({ ...d, [idx]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (skillDrafts[idx] || '').trim()) {
                                      const val = (skillDrafts[idx] || '').trim();
                                      setEditQuestions((prev) => {
                                        const copy = [...prev];
                                        const cur = Array.isArray(copy[idx].skills) ? [...copy[idx].skills] : [];
                                        cur.push(val);
                                        copy[idx] = { ...copy[idx], skills: cur };
                                        return copy;
                                      });
                                      setSkillDrafts((d) => ({ ...d, [idx]: '' }));
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs"
                                  placeholder={t('enterSkillAndPressEnter')}
                                />
                                <button
                                  type="button"
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                                  onClick={() => {
                                    const val = (skillDrafts[idx] || '').trim();
                                    if (!val) return;
                                    setEditQuestions((prev) => {
                                      const copy = [...prev];
                                      const cur = Array.isArray(copy[idx].skills) ? [...copy[idx].skills] : [];
                                      cur.push(val);
                                      copy[idx] = { ...copy[idx], skills: cur };
                                      return copy;
                                    });
                                    setSkillDrafts((d) => ({ ...d, [idx]: '' }));
                                  }}
                                >
                                  {t('add', 'Add')}
                                </button>
                              </div>
                            </div>

                            {/* Image preview if available */}
                            {/* {q.image && (
                                      <div className="mt-2 mb-3">
                                        <img
                                          src={q.image}
                                          alt={`Q${idx + 1} image`}
                                          className="max-w-full h-auto rounded border border-gray-200"
                                          style={{ maxHeight: '200px' }}
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        {q.imageName && (
                                          <p className="text-xs text-gray-500 mt-1">{t('image')}: {q.imageName}</p>
                                        )}
                                      </div>
                                    )} */}


                            {/* Image uploader and preview for Image-type questions only */}
                            {(/image/i.test(typeLC)) && (
                              <div className="mt-2 mb-3">
                                <label className="block text-xs text-gray-600 mb-1">{t('image', 'Image')}</label>
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files && e.target.files[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        const dataUrl = ev.target?.result || '';
                                        setEditQuestions((prev) => {
                                          const c = [...prev];
                                          c[idx] = { ...c[idx], image: String(dataUrl), imageName: file.name };
                                          return c;
                                        });
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                  {q.image && (
                                    <button
                                      type="button"
                                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                                      onClick={() =>
                                        setEditQuestions((prev) => {
                                          const c = [...prev];
                                          c[idx] = { ...c[idx], image: '', imageName: '' };
                                          return c;
                                        })
                                      }
                                    >
                                      {t('remove', 'Remove')}
                                    </button>
                                  )}
                                </div>
                                {q.image && (
                                  <div>
                                    <img
                                      src={q.image}
                                      alt={`Q${idx + 1} image`}
                                      className="max-w-full h-auto rounded border border-gray-200"
                                      style={{ maxHeight: '200px' }}
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    {q.imageName && (
                                      <p className="text-xs text-gray-500 mt-1">{t('image')}: {q.imageName}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Score and Time */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">{t('score', 'Marks')}</label>
                                <input
                                  type="number"
                                  value={q.score ?? 1}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditQuestions((prev) => {
                                      const c = [...prev];
                                      c[idx] = { ...c[idx], score: val };
                                      return c;
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder={t('score')}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">{t('time', 'Time (sec)')}</label>
                                <input
                                  type="number"
                                  value={q.time ?? 60}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setEditQuestions((prev) => {
                                      const c = [...prev];
                                      c[idx] = { ...c[idx], time: val };
                                      return c;
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder={t('time')}
                                />
                              </div>
                            </div>

                            {/* Grading Notes for Essay/Coding (hide Answer while editing) */}
                            {(/(essay|coding)/i.test(typeLC)) && (
                              <div className="mb-3">
                                <label className="block text-xs text-gray-600 mb-1">{t('gradingNotes', 'Grading Notes')}</label>
                                <textarea
                                  value={q.notes || ''}
                                  onChange={(e) => setEditQuestions((prev) => { const c = [...prev]; c[idx] = { ...c[idx], notes: e.target.value }; return c; })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
                                  placeholder={t('enterGradingNotes')}
                                />
                              </div>
                            )}

                            {(/fillup/i.test(typeLC)) && (
                              <div className="mb-3">
                                <label className="block text-xs text-gray-600 mb-1">{t('answer', 'Answer')}</label>
                                <input
                                  type="text"
                                  value={q.ans || ''}
                                  onChange={(e) => setEditQuestions((prev) => { const c = [...prev]; c[idx] = { ...c[idx], ans: e.target.value }; return c; })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder={t('enterAnswer', 'Enter answer')}
                                />
                              </div>
                            )}

                            {/* Options list */}
                            {entries.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-600 mb-1">{t('options')}</div>
                                {entries.map(([key, value], oidx) => {
                                  const label = typeof value === 'object' && value !== null ? (value.text ?? '') : String(value ?? '');
                                  const isSingle = !/(multi)/i.test(q.type || '') || /(true|false|yes|no)/i.test(typeLC);
                                  return (
                                    <div key={key} className="flex items-center gap-3">
                                      {isSingle ? (
                                        <input
                                          type="radio"
                                          name={`q-${idx}-ans`}
                                          checked={isSelected(key)}
                                          onChange={() => { if (!/(disc)/i.test(q.type || '')) updateAnsSingle(key); }}
                                          disabled={/(disc)/i.test(q.type || '')}
                                        />
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={isSelected(key)}
                                          onChange={() => toggleAnsMulti(key)}
                                        />
                                      )}
                                      <input
                                        type="text"
                                        value={label}
                                        onChange={(e) => updateOptionText(key, e.target.value)}
                                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                                        placeholder={`${key}`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Questions Section - Only show when showAddQuestions is true */}
            {showAddQuestions && (
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Question Selection by Skill for Edit */}
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                      {t("questionSelection", "Question Selection")}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          {t("selectSkillsToChooseQuestions", "Select Skills to choose questions")}
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 w-full max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {Object.keys(skillCounts)
                              .sort((a, b) => a.localeCompare(b))
                              .map((skill) => (
                                <label
                                  key={skill}
                                  className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={editSkillFilter.includes(skill)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditSkillFilter([...editSkillFilter, skill]);
                                      } else {
                                        setEditSkillFilter(editSkillFilter.filter(s => s !== skill));
                                      }
                                    }}
                                  />
                                  <span className="text-sm text-gray-700">
                                    {skill} ({skillCounts[skill]})
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("selectMultipleSkills")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Questions Matching Selected Skills for Edit */}
                  {editSkillFilter.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">
                        {t("questionsMatchingSkills")}
                      </h5>
                      <div className="max-h-48 overflow-y-auto">
                        {displayedQuestionsForEdit.length > 0 ? (
                          <ul className="space-y-1">
                            {displayedQuestionsForEdit.map((q, idx) => {
                              const key = q.uiKey || q.id || q._id || idx;
                              const isSelected = editSelectedQuestions.includes(key);
                              const skills = q.originalQuestion?.skills || [];

                              return (
                                <li key={key} className="flex items-start space-x-2 py-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      setEditSelectedQuestions((prev) =>
                                        prev.includes(key)
                                          ? prev.filter((x) => x !== key)
                                          : [...prev, key]
                                      )
                                    }
                                    className="mt-1"
                                  />

                                  <div className="flex-1">
                                    <p className="text-sm leading-tight text-gray-800">
                                      {q.originalQuestion?.text}
                                    </p>

                                    {skills.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {skills.map((s, i) => (
                                          <span
                                            key={i}
                                            className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                          >
                                            {s}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {t("noQuestionsFound", "No questions found for selected skills")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Add Selected Questions Button - Always visible at bottom */}
                {editSkillFilter.length > 0 && editSelectedQuestions.length > 0 && (
                  <div className="border-t border-gray-200 pt-3 mt-4 bg-white">
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddQuestionsToEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        {t("addSelectedQuestions")} ({editSelectedQuestions.length})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                {t("cancel")}
              </button>
              {/* <button
                      onClick={handleUpdateTest}
                      disabled={isUpdating}
                      className={`px-4 py-2 rounded-lg text-sm text-white ${isUpdating
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {isUpdating ? t("updating", "Updating...") : t("update", "Update")}
                    </button> */}
              <button
                onClick={handleUpdateTest}
                disabled={isUpdating || isFormInvalid}
                className={`px-4 py-2 rounded-lg text-sm text-white ${isUpdating || isFormInvalid
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isUpdating ? t("updating", "Updating...") : t("update", "Update")}
              </button>

            </div>
          </div>
        </div>
      )}
      {/* Question List header with search and collapse (same style as Test List) */}

      {/* <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3
          className="text-lg font-semibold text-gray-800 cursor-pointer"
          onClick={() => setQuestionsExpanded((v) => !v)}
        >
          {t('questionList')}
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t('entersearchskills')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
          <button
            className="p-1.5 rounded border"
            onClick={() => setQuestionsExpanded((v) => !v)}
            title={questionsExpanded ? 'Collapse' : 'Expand'}
          >
            {questionsExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div> */}




      {false && questionsExpanded && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("questions")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("type")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("skills")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("score")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("action")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {t("loadingTests")}
                  </td>
                </tr>
              ) : paginatedTests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {t("noquestionsavailable")}
                  </td>
                </tr>
              ) : (
                paginatedTests.map((test) => (
                  <tr key={test.uiKey} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(test.uiKey)}
                        onChange={() => toggleSelect(test.uiKey)}
                      />
                    </td>
                    <td className="px-4 py-2">

                      <div
                        className="text-sm text-gray-700 "
                        style={{
                          wordBreak: "break-word",
                          maxWidth: "300px",
                          whiteSpace: "normal",
                        }}
                      >
                        {test.title}
                      </div>

                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {test.type}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <div className="max-h-6 overflow-y-auto">
                        {Array.isArray(test.originalQuestion.skills) && test.originalQuestion.skills.length > 0
                          ? test.originalQuestion.skills.join(', ')
                          : 'General'}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {test.score}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      <button
                        onClick={() => handleViewQuestions(test)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                        title="View Questions"
                      >
                        <FiEye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}


            </tbody>
          </table>
        </div>
      )}



      {/* Pagination */}
      {/* <div className="flex items-center justify-center mt-4 gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          {t("previous")}
        </button>
        <span className="px-3 py-1">
          {t("page")} {currentPage} {t("of")} {totalPages}
        </span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          {t("next")}
        </button>
      </div> */}

      {/* Create Test Modal */}
      {showCreateTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {t("createNewTest")}
              </h3>
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0 ml-2"
              >
                ×
              </button>
            </div>

            {/* Selected Questions Summary */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
                {t("testcreationsummary")}
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 mb-1">
                <strong>{t("selectedquestions")}</strong> {selectedQuestions.length}{" "}
                {t("questions")}{selectedQuestions.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs sm:text-sm text-blue-700">
                {t("fillinthetestdetails")}
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Basic Information Section */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("basicInformation")}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Test Title */}
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("testTitle")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={testForm.title}
                        onChange={(e) =>
                          handleFormChange("title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                        placeholder={t("enterTestTitle")}
                      />
                      {formValidation.fieldErrors.title && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.title}
                        </p>
                      )}
                    </div>

                    {/* Skill/Subject */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("skillSubject")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={testForm.skill}
                        onChange={(e) =>
                          handleFormChange("skill", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-xs sm:text-sm ${formValidation.fieldErrors.skill
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                        placeholder={t("enterskillorsubject")}
                      />
                      {formValidation.fieldErrors.skill && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.skill}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("category")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testForm.category}
                        onChange={(e) =>
                          handleFormChange("category", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-xs sm:text-sm ${formValidation.fieldErrors.category
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                      >
                        <option value="" disabled>
                          {t("selectcategory")}
                        </option>
                        <option value="Technical">{t("technical")}</option>
                        <option value="Behavioral">{t("behavioral")}</option>
                        <option value="Cognitive">{t("cognitive")}</option>
                        <option value="Other">{t("other")}</option>
                      </select>
                      {formValidation.fieldErrors.category && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.category}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {/* Question Selection by Skill */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("questionSelection", "Question Selection")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("selectSkillsToChooseQuestions", "Select Skills to choose questions")}
                      </label>

                      {/* Checkbox list for skills */}
                      <div className="w-full">
                        <div className="border border-gray-300 rounded-lg p-3 w-full max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {Object.keys(skillCounts)
                              .sort((a, b) => a.localeCompare(b))
                              .map((skill) => (
                                <label
                                  key={skill}
                                  className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={createSkillFilter.includes(skill)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCreateSkillFilter([...createSkillFilter, skill]);
                                      } else {
                                        setCreateSkillFilter(createSkillFilter.filter(s => s !== skill));
                                      }
                                    }}
                                  />
                                  <span className="text-sm text-gray-700">
                                    {skill} ({skillCounts[skill]})
                                  </span>
                                </label>
                              ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("selectMultipleSkills", "Check multiple skills to filter questions")}
                        </p>
                      </div>


                      <p className="text-xs text-gray-500 mt-1">
                        {t("autoselect")}
                      </p>
                    </div>
                  </div>
                </div>
                {createSkillFilter.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900 text-sm sm:text-base">
                        {t("questionsMatchingSkills")}
                      </h5>
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {selectedQuestions.length} {t("selected", "selected")} total
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {displayedQuestions.length > 0 ? (
                        <ul className="space-y-1">
                          {displayedQuestions.map((q, idx) => {
                            const key = q.uiKey || q.id || q._id || idx;
                            const isSelected = selectedQuestions.includes(key);
                            const skills = q.originalQuestion?.skills || [];

                            return (
                              <li key={key} className="flex items-start space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    setSelectedQuestions((prev) =>
                                      prev.includes(key)
                                        ? prev.filter((x) => x !== key)
                                        : [...prev, key]
                                    )
                                  }
                                  className="mt-1"
                                />

                                <div className="flex-1">
                                  <p className="text-sm leading-tight text-gray-800">
                                    {q.originalQuestion?.text}
                                  </p>

                                  {skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                      {skills.map((s, i) => (
                                        <span
                                          key={i}
                                          className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {t("noQuestionsFound", "No questions found for selected skills")}
                        </p>
                      )}
                    </div>
                    {selectedQuestions.length > 0 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        💡 {t("selectedQuestionsPreserved", "Your question selections are preserved when switching between skills. Selected questions from other skills remain selected.")}
                      </div>
                    )}
                  </div>
                )}
                {/* Test Configuration Section */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("testConfiguration")}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Duration */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("durationMinutes")}
                      </label>
                      <input
                        type="number"
                        value={testForm.duration}
                        onChange={(e) =>
                          handleFormChange(
                            "duration",
                            parseInt(e.target.value) || 0
                          )
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      />
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("language")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testForm.language}
                        onChange={(e) =>
                          handleFormChange("language", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-xs sm:text-sm ${formValidation.fieldErrors.language
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                      >
                        <option value="" disabled>
                          {t("selectlang")}
                        </option>
                        <option value="English">{t("english")}</option>
                        <option value="Arabic">{t("arabic")}</option>
                        <option value="Spanish">{t("spanish")}</option>
                        <option value="French">{t("french")}</option>
                      </select>
                      {formValidation.fieldErrors.language && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.language}
                        </p>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("difficulty")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={testForm.difficulty}
                        onChange={(e) =>
                          handleFormChange("difficulty", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-xs sm:text-sm ${formValidation.fieldErrors.difficulty
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                      >
                        <option value="" disabled>
                          {t("select")}
                        </option>
                        <option value="Easy">{t("easy")}</option>
                        <option value="Medium">{t("medium")}</option>
                        <option value="Hard">{t("hard")}</option>
                      </select>
                      {formValidation.fieldErrors.difficulty && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.difficulty}
                        </p>
                      )}
                    </div>

                    {/* Passing Score */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("passingScore")} (%)
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={testForm.passingScore}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFormChange(
                            "passingScore",
                            val === "" ? "" : parseInt(val)
                          );
                        }}
                        min="0"
                        max="100"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${formValidation.fieldErrors.passingScore
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                        placeholder={t("enterpassignscore")}
                      />
                      {formValidation.fieldErrors.passingScore && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.passingScore}
                        </p>
                      )}
                    </div>

                    {/* Max Attempts */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("maxAttempts")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={testForm.maxAttempts}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFormChange(
                            "maxAttempts",
                            val === "" ? "" : parseInt(val)
                          );
                        }}
                        min="1"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${formValidation.fieldErrors.maxAttempts
                          ? "border-red-500 bg-red-50 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                        placeholder={t("entermaximumattempts")}
                      />
                      {formValidation.fieldErrors.maxAttempts && (
                        <p className="text-xs text-red-500 mt-1">
                          {formValidation.fieldErrors.maxAttempts}
                        </p>
                      )}
                    </div>

                    {/* Min Questions */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        {t("minQuestions", "Min Questions")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={testForm.minQuestions}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFormChange(
                            "minQuestions",
                            val === "" ? "" : parseInt(val)
                          );
                        }}
                        min="1"
                        max={selectedQuestions.length || 1}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${formValidation.fieldErrors.minQuestions
                          ? ""
                          : "border-gray-300 focus:ring-blue-500"
                          }`}
                        placeholder={t("enterminquestions", "Enter minimum questions")}
                      />
                      {formValidation.fieldErrors.minQuestions && (
                        <p className="text-xs text-gray-600 mt-1">
                          Min questions must not exceed selected questions
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {t("selectedQuestions", "Selected questions")}: {selectedQuestions.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                    {t("additionaldetails")}
                  </h4>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("description")}
                    </label>
                    <textarea
                      value={testForm.description}
                      onChange={(e) =>
                        handleFormChange("description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      placeholder={t("describeTest")}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="mb-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("instructions")}
                    </label>
                    <textarea
                      value={testForm.instructions}
                      onChange={(e) =>
                        handleFormChange("instructions", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                      placeholder={t("provideInstructions")}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      {t("tags")}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(testForm.tags || []).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                        placeholder={t("addTagPlaceholder")}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FaPlus className="text-xs sm:text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowCreateTestModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={() => handleCreateTest()}
                  disabled={isCreating || !isCreateFormValid}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm ${isCreating || !isCreateFormValid
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {isCreating ? t("creating") : t("createtest")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {showQuestionsModal && selectedTestForQuestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {t("questionsfor")} {selectedTestForQuestions.title}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionsModal(false);
                  setSelectedTestForQuestions(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0 ml-2"
              >
                ×
              </button>
            </div>

            {/* Test Info */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                <div className="flex-1 min-w-0">
                  {/* <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    <strong>Description:</strong> <span className="break-words">{selectedTestForQuestions.description}</span>
                  </p> */}
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>{t("category")}:</strong>{" "}
                    {selectedTestForQuestions.category}
                  </p>
                </div>
                <div className="text-left lg:text-right flex-shrink-0">
                  <div className="flex flex-row lg:flex-col items-center lg:items-end space-x-4 lg:space-x-0 lg:space-y-1 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FiClock />
                      <span>{selectedTestForQuestions.duration}m</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiBookOpen />
                      <span>
                        {selectedTestForQuestions.questions} {t("questions")}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 block mt-1">
                    {selectedTestForQuestions.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto">
              {selectedTestForQuestions.__raw?.qs &&
                selectedTestForQuestions.__raw.qs.length > 0 ? (
                <div className="space-y-4">
                  {selectedTestForQuestions.__raw.qs.map((question, index) => (
                    <div
                      key={question.id || index}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <span className="text-xs sm:text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded flex-shrink-0">
                          Q{index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base break-words">
                            {question.q ||
                              question.text ||
                              "Question text not available"}
                          </h4>

                          {/* Image for Image type questions */}
                          {question.image && (
                            <div className="mt-2 mb-3">
                              <img
                                src={question.image}
                                alt={`Question ${index + 1} image`}
                                className="max-w-full h-auto rounded-lg border border-gray-200"
                                style={{ maxHeight: "200px" }}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              {question.imageName && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {t("image")}: {question.imageName}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Question Type */}
                          {question.type && (
                            <p className="text-xs text-gray-500 mb-2">
                              <strong>{t("type")}:</strong> {question.type}
                            </p>
                          )}

                          {/* Options for multiple choice questions */}
                          {question.opts &&
                            Object.keys(question.opts).length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                  {t("options")}:
                                </p>
                                <div className="grid grid-cols-1 gap-1">
                                  {Object.entries(question.opts).map(
                                    ([key, value]) => {
                                      const textValue = extractText(value);
                                      const subtraitValue =
                                        extractSubtrait(value);

                                      return (
                                        <div
                                          key={key}
                                          className="text-xs sm:text-sm text-gray-600 pl-2 sm:pl-4"
                                        >
                                          <span className="font-medium">
                                            {key}:{" "}
                                          </span>
                                          <span className="break-words">
                                            {textValue}
                                            {subtraitValue && (
                                              <span className="text-xs text-gray-500 ml-2">
                                                ({subtraitValue})
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Answer */}
                          {question.ans && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-xs sm:text-sm text-green-800">
                                <strong>{t("answer")}: </strong>
                                {typeof question.ans === "object" &&
                                  question.ans !== null ? (
                                  <span className="break-words">
                                    {Object.entries(question.ans).map(
                                      ([key, value], index) => {
                                        const textValue = extractText(value);
                                        const subtraitValue =
                                          extractSubtrait(value);

                                        return (
                                          <span key={key}>
                                            {index > 0 && <span>, </span>}
                                            <strong>{key}: </strong>
                                            <span>
                                              {textValue}
                                              {subtraitValue && (
                                                <span className="text-xs">
                                                  {" "}
                                                  ({subtraitValue})
                                                </span>
                                              )}
                                            </span>
                                          </span>
                                        );
                                      }
                                    )}
                                  </span>
                                ) : (
                                  <span className="break-words">
                                    {question.ans != null
                                      ? String(question.ans)
                                      : ""}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Time */}
                          {question.time && (
                            <p className="text-xs text-gray-500 mt-2">
                              <strong>{t("time")}:</strong> {question.time} {t("seconds")}
                            </p>
                          )}

                          {/* Score */}
                          {question.score && (
                            <p className="text-xs text-gray-500 mt-1">
                              <strong>{t("score")}:</strong> {question.score} {t("points")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiBookOpen className="mx-auto text-2xl sm:text-4xl mb-2" />
                  <p className="text-sm sm:text-base">
                    {t("noquestionsavilable")}
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowQuestionsModal(false);
                  setSelectedTestForQuestions(null);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('confirmDeletion')}</h3>
            <p className="text-sm text-gray-700 mb-4">
              {t('areYouSureDelete')} {" "}
              <span className="font-semibold">{deleteTarget?.title || t('thisTest', 'this test')}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmDeleteOpen(false); setDeleteTarget(null); }}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-lg text-sm text-white ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isDeleting ? t('deleting', 'Deleting...') : t('delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCreate;

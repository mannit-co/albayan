import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import TestEditQuestionsTab from "../Testlibrary/EditTabs/TestEditQuestionsTab";
import { v4 as uuidv4 } from 'uuid';
import { uid, BaseUrl, SuperAdminID } from "../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import { FaPlus, FaEye, FaSave, FaBookOpen, FaCog, FaEdit, FaTrash, FaChevronLeft } from "react-icons/fa";
import { BiPencil } from "react-icons/bi";       // BoxIcons pencil
import { FiArrowLeft } from "react-icons/fi";
import { AiOutlineDelete } from "react-icons/ai";
import { useLanguage } from "../../contexts/LanguageContext";


// Local-only Question Bank page that reuses the Test Library's Questions editor UI
// Layout wrapping is applied via the route in src/App.jsx

const defaultNewQuestion = (seedSkill = "General") => ({
  id: "", // assigned on save as Q01, Q02, ...
  type: "",
  text: "",
  options: ["", "", "", ""],
  answer: "",
  correctOption: null,
  score: 1,
  level: "",
  timeLimit: null,
  skills: seedSkill && seedSkill !== 'all' ? [seedSkill] : [],
});

const QuestionBank = () => {
  const { t } = useLanguage();

  const [questions, setQuestions] = useState([]);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(defaultNewQuestion());
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTick, setSaveTick] = useState(0);
  // View mode: list (default) or editor
  const [viewMode, setViewMode] = useState("list");
  const [isLoading, setIsLoading] = useState(true);

  // Skill filter UI (for future server integration). Currently annotates created questions with chosen skill.
  const [skillFilter, setSkillFilter] = useState("all");
  const skills = ["all", "JavaScript", "React", "Node.js", "CSS", "General"];
  const [fetchedData, setFetchedData] = useState(null); // New state for fetched data
  // Table pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  // state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null); // { id, resource, q, type, options[], answer, skillsStr, score, time }
  const hasFetched = useRef(false);
  // Custom skills dropdown state
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const skillMenuRef = useRef(null);

  // Remove leading labels like "Ques :", "Question:", "Q:" from the question text
  const sanitizeQuestionText = (text) => {
    const s = String(text || "");
    return s
      .replace(/^\s*(ques(?:tion)?\.?\s*[:\-]?\s*)/i, "")
      .replace(/^\s*(q\s*[:\-]?\s*)/i, "")
      .trim();
  };

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true); // start loading
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
      console.log("Fetched data:", data);
      // Storing the fetched data in the fetchedData state
      setFetchedData(data);
      if (!data || !Array.isArray(data.source)) {
        console.error("Invalid response format:", data);
        toast.error("Failed to load questions. ");
        setIsLoading(false);
        return;
      }

      // Flatten all qs arrays, then map to internal UI shape, while preserving resourceId
      const allQs = [];
      data.source.forEach((item) => {
        try {
          const parsedItem = JSON.parse(item);
          const resourceId = parsedItem?._id?.$oid || parsedItem?._id || null;
          if (Array.isArray(parsedItem.qs)) {
            parsedItem.qs.forEach((q) => allQs.push({ ...q, _resourceId: resourceId }));
          }
        } catch (err) {
          console.error("Error parsing item:", err);
        }
      });

      if (allQs.length === 0) {

        setQuestions([]);
        setIsLoading(false);
        return;
      }

      let counter = 0;
      const mapped = allQs.map((q) => {
        // options array from opts map (Option1..Option4), maintaining order
        const optsMap = q.opts || {};
        let options = [];
        if (q.type === 'Disc') {
          const order = ['Option1', 'Option2', 'Option3', 'Option4'];
          options = order
            .map(k => optsMap[k])
            .filter((v) => v !== undefined && v !== null)
            .map((v) => (typeof v === 'object' && v !== null ? v.text : v));
        } else {
          options = [optsMap.Option1, optsMap.Option2, optsMap.Option3, optsMap.Option4]
            .filter((v) => v !== undefined && v !== null);
        }

        // correctOption from ans like 'Option N'
        let correctOption = null;
        if (q.type === 'SingleSelect' && typeof q.ans === 'string') {
          const m = q.ans.match(/Option\s+(\d+)/i);
          if (m) correctOption = parseInt(m[1], 10) - 1;
        }

        counter += 1;
        return {
          id: q.id,
          uiKey: `${q.id || 'Q'}-${counter}`,
          text: sanitizeQuestionText(q.q),
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
          selAns: q.selAns || "",
          resourceId: q._resourceId || null,
          // Preserve DISC rich structures for round-trip editing
          ...(q.type === 'Disc' ? { opts: q.opts || {}, discAns: q.ans || {} } : {}),
        };
      });

      setQuestions([...mapped].reverse());
      setPage(1); // reset to first page so pagination shows 5/5/1 correctly
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions.");
    } finally {
      setIsLoading(false); // finish loading
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return; // Guard against React StrictMode double-call
    hasFetched.current = true;
    fetchQuestions();
  }, [fetchQuestions]);


  // Helpers to assign globally unique IDs for questions using uuid
  const uniqueQId = () => `Q-${uuidv4().slice(0, 8)}`;
  const normalizeQuestionIds = (list) => {
    const seen = new Set();
    return list.map((q) => {
      let id = (q.id || '').toString().trim();
      // If missing, generate a unique id
      if (!id) {
        id = uniqueQId();
      }
      // If duplicate within the list, generate a new unique id to avoid collision in this batch
      if (seen.has(id)) {
        id = uniqueQId();
      }
      seen.add(id);
      return { ...q, id };
    });
  };

  // Ensure each question has a unique uiKey for React lists and selection state
  const ensureUiKeys = (list) => {
    return list.map((q, idx) => ({
      ...q,
      uiKey: q.uiKey || `${q.id || 'NEW'}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    }));
  };

  // Merge skills across all duplicates by question text
  const mergedSkillsByText = useMemo(() => {
    const expand = (arr) => {
      const out = new Set();
      const src = Array.isArray(arr) && arr.length > 0 ? arr : ["General"];
      for (const s of src) {
        String(s || "")
          .split(/[;,|]/)
          .map((p) => p.trim())
          .filter(Boolean)
          .forEach((p) => out.add(p.toLowerCase()));
      }
      return out;
    };
    const map = new Map(); // text -> Set(skills)
    for (const q of questions) {
      const text = (q.text || "").trim();
      if (!text) continue;
      const set = map.get(text) || new Set();
      for (const s of expand(q.skills)) set.add(s);
      map.set(text, set);
    }
    return map;
  }, [questions]);

  const skillCounts = useMemo(() => {
    const counts = {};
    for (const [_, set] of mergedSkillsByText.entries()) {
      const list = Array.from(set);
      for (let s of list) {
        s = String(s || "").trim();
        if (!s) continue;
        s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return counts;
  }, [mergedSkillsByText]);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (skillMenuRef.current && !skillMenuRef.current.contains(e.target)) {
        setIsSkillMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleAddQuestion = (shouldClear = false) => {
    setIsEditingQuestion(true);
    // Set the skill based on the current filter or default to 'General'
    const newSkill = skillFilter === 'all' ? 'General' : skillFilter;
    setCurrentQuestion(defaultNewQuestion(skillFilter === 'all' ? 'General' : skillFilter));
    setViewMode("editor");
    if (shouldClear) {
      setQuestions([]); // Clear the left panel ONLY when explicitly requested (Create New Question)
    }
  };
  // Function to generate random colors
  const generateRandomColor = () => {
    const colors = [

      'bg-blue-100 border-blue-300 text-blue-700',
      'bg-green-100 border-green-300 text-green-700',
      'bg-yellow-100 border-yellow-300 text-yellow-700',
      'bg-purple-100 border-purple-300 text-purple-700',
      'bg-pink-100 border-pink-300 text-pink-700',
      'bg-teal-100 border-teal-300 text-teal-700',

      'bg-cyan-100 border-cyan-300 text-cyan-700',
    ];

    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion((prev) => {
      const opts = [...(prev.options || [])];
      while (opts.length < 4) opts.push("");
      opts[index] = value;
      return { ...prev, options: opts };
    });
  };

  const handleCancelQuestion = () => {
    setIsEditingQuestion(false);
    setCurrentQuestion(defaultNewQuestion(skillFilter === 'all' ? 'General' : skillFilter));
    setViewMode("list");
  };

  // Ensure questions are reloaded when navigating back to the list after editing/creating
  const handleBackToList = async () => {
    setIsEditingQuestion(false);
    setCurrentQuestion(defaultNewQuestion(skillFilter === 'all' ? 'General' : skillFilter));
    setSkillFilter('all');
    setSelectedIds([]);
    setPage(1);
    await fetchQuestions();
    setViewMode('list');
  };

  const handleSaveQuestion = async (updatedQuestions, options = {}) => {
    const { finalize = false } = options;
    if (Array.isArray(updatedQuestions)) {
      const normalized = ensureUiKeys(normalizeQuestionIds(updatedQuestions));
      setQuestions(normalized);
      if (finalize) {
        setIsSaving(true);
        console.log('[QuestionBank] Save clicked. Questions list:', normalized);
        const formattedQs = normalized.map((q, index) => {
          let opts = {};
          let ans = q.answer || "";
          // Coerce MultipleSelect with a single answer into SingleSelect
          let t = q.type;
          if (t === 'MultipleSelect') {
            const s = String(ans || '').trim();
            if (s !== '' && !s.includes(',')) t = 'SingleSelect';
          }
          if (t === 'Disc') {
            const primaryTraits = ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'];
            const defaultSub = { Dominance: 'Control', Influence: 'Persuasion', Steadiness: 'Support', Conscientiousness: 'Accuracy' };
            (q.options || []).slice(0, 4).forEach((optText, idx) => {
              if ((optText ?? '').toString().trim() === '') return;
              const optionKey = `Option${idx + 1}`;
              const trait = primaryTraits[idx] || '';
              const pickedSub = q[`discSubtrait_${idx}`] || q[`dropdown2_${idx}`] || '';
              const subtrait = pickedSub && pickedSub !== trait ? pickedSub : (defaultSub[trait] || trait);
              const obj = { text: optText, trait, subtrait };
              opts[optionKey] = obj;
            });
            // For DISC, ans mirrors opts object
            ans = { ...opts };
          } else if (t === 'SingleSelect') {
            if (Number.isInteger(q.correctOption)) ans = `Option ${q.correctOption + 1}`;
            else if (!String(ans).startsWith('Option')) {
              const idx = (q.options || []).findIndex(o => o === ans);
              ans = idx >= 0 ? `Option ${idx + 1}` : String(ans || "");
            }
            opts = (q.options || []).reduce((acc, opt, idx) => {
              if ((opt ?? "").toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
              return acc;
            }, {});
          } else if (t === 'MultipleSelect') {
            const selected = String(ans || "").split(',').map(s => s.trim()).filter(Boolean);
            let optionCsv = selected.filter(s => s.startsWith('Option ')).join(',');
            if (!optionCsv) optionCsv = selected.join(',');
            ans = optionCsv;
            opts = (q.options || []).reduce((acc, opt, idx) => {
              if ((opt ?? "").toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
              return acc;
            }, {});
          } else {
            opts = (q.options || []).reduce((acc, opt, idx) => {
              if ((opt ?? "").toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
              return acc;
            }, {});
          }
          return {
            id: q.id,
            q: sanitizeQuestionText(q.text),
            type: t,
            score: q.score ?? 1,
            time: q.timeLimit ?? null,
            image: q.image || null,
            imageName: q.imageName || null,
            ans,
            opts,
            skills: Array.isArray(q.skills) ? q.skills : (q.skill ? [q.skill] : []),
            notes: q.notes || ((q.type === 'Essay' || q.type === 'Coding') ? q.answer : ""),
            selAns: q.selectedAnswer || q.selAns || "",
          };
        });

        const storedData = sessionStorage.getItem("loginResponse");
        let token = null, userId = null, creator = null;
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const sourceObj = JSON.parse(parsedData.source);
          token = sourceObj.token;
          userId = sourceObj._id?.$oid || sourceObj._id;
          creator = sourceObj.name || sourceObj.email || "";
        }

        const payload = {
          qs: formattedQs,
          userId: { $oid: userId },
          creator,
          sa: SuperAdminID,
        };

        try {
          const response = await fetch(
            `${BaseUrl}/auth/eCreateCol?colname=${uid}_QuestionBank`,
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
            const errText = await response.text();
            throw new Error(errText || 'Failed to save Question Bank');
          }

       toast.success(t("questionBankSavedSuccessfully"));

          console.log('[QuestionBank] Saved to backend successfully.');
          // Refresh and go back to list view
          await fetchQuestions();
          setSaveTick((t) => t + 1);
          setIsEditingQuestion(false);
          setViewMode('list');
          setCurrentQuestion(defaultNewQuestion(skillFilter === 'all' ? 'General' : skillFilter));
          setSelectedIds([]);
          setPage(1);
        } catch (err) {
          console.error('❌ Error saving Question Bank:', err);
        } finally {
          setIsSaving(false);
        }
        return;
      }
      setIsEditingQuestion(false);
      setViewMode('editor');
      return;
    }
    let list = ensureUiKeys([...questions]);
    const idx = list.findIndex((q) => q.id === currentQuestion.id);
    if (isEditingQuestion) {
      if (idx >= 0) list[idx] = currentQuestion;
      else list.push(currentQuestion);
    }
    const normalized = ensureUiKeys(normalizeQuestionIds(list));
    setQuestions(normalized);
    if (finalize) {
      setIsSaving(true);
      console.log('[QuestionBank] Save clicked. Questions list:', normalized);
      const formattedQs = normalized.map((q, index) => {
        let opts = {};
        let ans = q.answer || "";
        if (q.type === 'Disc') {
          const primaryTraits = ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'];
          const defaultSub = { Dominance: 'Control', Influence: 'Persuasion', Steadiness: 'Support', Conscientiousness: 'Accuracy' };
          (q.options || []).slice(0, 4).forEach((optText, idx) => {
            if ((optText ?? '').toString().trim() === '') return;
            const optionKey = `Option${idx + 1}`;
            const trait = primaryTraits[idx] || '';
            const pickedSub = q[`discSubtrait_${idx}`] || q[`dropdown2_${idx}`] || '';
            const subtrait = pickedSub && pickedSub !== trait ? pickedSub : (defaultSub[trait] || trait);
            const obj = { text: optText, trait, subtrait };
            opts[optionKey] = obj;
          });
          ans = { ...opts };
        } else if (q.type === 'SingleSelect') {
          if (Number.isInteger(q.correctOption)) ans = `Option ${q.correctOption + 1}`;
          else if (!String(ans).startsWith('Option')) {
            const idx = (q.options || []).findIndex(o => o === ans);
            ans = idx >= 0 ? `Option ${idx + 1}` : String(ans || "");
          }
          opts = (q.options || []).reduce((acc, opt, idx) => {
            if ((opt ?? "").toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
            return acc;
          }, {});
        } else if (q.type === 'MultipleSelect') {
          const selected = String(ans || "").split(',').map(s => s.trim()).filter(Boolean);
          let optionCsv = selected.filter(s => s.startsWith('Option ')).join(',');
          if (!optionCsv) optionCsv = selected.join(',');
          ans = optionCsv;
          opts = (q.options || []).reduce((acc, opt, idx) => {
            if ((opt ?? "").toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
            return acc;
          }, {});
        } else {
          opts = (q.options || []).reduce((acc, opt, idx) => {
            if ((opt ?? "").toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
            return acc;
          }, {});
        }
        return {
          id: q.id,
          q: sanitizeQuestionText(q.text),
          type: q.type,
          score: q.score ?? 1,
          time: q.timeLimit ?? null,
          image: q.image || null,
          imageName: q.imageName || null,
          ans,
          opts,
          notes: q.notes || ((q.type === 'Essay' || q.type === 'Coding') ? q.answer : ""),
          selAns: q.selectedAnswer || q.selAns || "",
        };
      });

      const storedData = sessionStorage.getItem("loginResponse");
      let token = null, userId = null, creator = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
        userId = sourceObj._id?.$oid || sourceObj._id;
        creator = sourceObj.name || sourceObj.email || "";
      }

      const payload = {
        qs: formattedQs,
        userId: { $oid: userId },
        creator,
        sa: SuperAdminID,
      };

      try {
        const response = await fetch(
          `${BaseUrl}/auth/eCreateCol?colname=${uid}_QuestionBank`,
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
          const errText = await response.text();
          throw new Error(errText || 'Failed to save Question Bank');
        }
        console.log('[QuestionBank] Saved to backend successfully.');
        await fetchQuestionsOnce();
        setViewMode('list');
        setIsEditingQuestion(false);
        setSaveTick((t) => t + 1);
      } catch (err) {
        console.error('❌ Error saving Question Bank:', err);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingQuestion(false);
    setViewMode('editor');
  };

  const visibleQuestions = useMemo(() => {
    if (skillFilter === 'all') return questions;
    const needle = (skillFilter || '').toLowerCase();
    return questions.filter((q) => {
      const text = (q.text || '').trim();
      const set = mergedSkillsByText.get(text);
      if (!set || set.size === 0) return false;
      for (const s of set) {
        if (String(s || '').toLowerCase().includes(needle)) return true;
      }
      return false;
    });
  }, [questions, skillFilter, mergedSkillsByText]);


  // const paginated = useMemo(() => {
  //   const start = (page - 1) * pageSize;
  //   return visibleQuestions.slice(start, start + pageSize);
  // }, [visibleQuestions, page, pageSize]);

  // Remove duplicate questions based on sanitized text
  const uniqueVisibleQuestions = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const q of visibleQuestions) {
      const text = (q.text || '').trim();
      if (seen.has(text)) continue;
      seen.add(text);
      const mergedSet = mergedSkillsByText.get(text);
      if (mergedSet && mergedSet.size) {
        const normalized = Array.from(mergedSet)
          .map((s) => String(s || '').trim())
          .filter(Boolean)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
          .sort();
        out.push({ ...q, skills: normalized });
      } else {
        out.push(q);
      }
    }
    return out;
  }, [visibleQuestions, mergedSkillsByText]);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return uniqueVisibleQuestions.slice(start, start + pageSize);
  }, [uniqueVisibleQuestions, page, pageSize]);



  // 2️⃣ Total pages based on unique questions
  const totalPages = Math.max(1, Math.ceil(uniqueVisibleQuestions.length / pageSize));
  // Reset to first page and clear selection whenever the search filter changes
  useEffect(() => {
    setPage(1);

  }, [skillFilter]);
  // 3️⃣ Clamp page whenever uniqueVisibleQuestions change
  useEffect(() => {
    if (page > totalPages) setPage(totalPages); // instead of resetting to 1
  }, [page, totalPages]);
  const toggleSelectAll = (checked) => {
    if (checked) {
      // Select all questions (across all pages, or just current page)
      setSelectedIds(visibleQuestions.map(q => q.uiKey));
    } else {
      // Deselect all questions
      setSelectedIds([]);
    }
  };
  // Check if all questions on the current page are selected for "Select All" checkbox
  const isAllSelected = useMemo(() => {
    if (paginated.length === 0) return false;
    return paginated.every(q => selectedIds.includes(q.uiKey));
  }, [selectedIds, paginated]);


  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEditQuestion = (question) => {
    try {
      if (!fetchedData || !Array.isArray(fetchedData.source)) {
        toast.error("Invalid data structure received.");
        return;
      }
      const id = question.id;
      const targetResId = question.resourceId || null;
      let resourceToUpdate = null;
      let foundQ = null;

      // Prefer locating by resourceId when present to avoid duplicate ID clashes
      if (targetResId) {
        for (const resourceStr of fetchedData.source) {
          let resource;
          try { resource = JSON.parse(resourceStr); } catch { continue; }
          const rid = resource?._id?.$oid || resource?._id;
          if (rid === targetResId) {
            resourceToUpdate = resource;
            if (resource.qs && Array.isArray(resource.qs)) {
              foundQ = resource.qs.find((qq) => qq.id === id) || null;
            }
            break;
          }
        }
      }
      // Fallback: search by id across all resources (legacy)
      if (!resourceToUpdate || !foundQ) {
        for (const resourceStr of fetchedData.source) {
          let resource;
          try { resource = JSON.parse(resourceStr); } catch { continue; }
          if (resource.qs && Array.isArray(resource.qs)) {
            const q = resource.qs.find((qq) => qq.id === id);
            if (q) { resourceToUpdate = resource; foundQ = q; break; }
          }
        }
      }

      if (!resourceToUpdate || !foundQ) {
        toast.error("Question not found.");
        return;
      }

      const optsMap = foundQ.opts || {};
      const options = (() => {
        const raw = [optsMap.Option1, optsMap.Option2, optsMap.Option3, optsMap.Option4];
        // For DISC, opts are objects { text, trait, subtrait }
        if ((foundQ.type || '') === 'Disc') {
          return raw.map(v => (v && typeof v === 'object') ? (v.text || '') : (v || ''));
        }
        return raw.map(v => v || '');
      })();
      // Normalize answer for MultipleSelect and SingleSelect to a consistent form
      let normalizedAnswer = foundQ.ans || "";
      try {
        const type = foundQ.type || '';
        if (type === 'MultipleSelect') {
          const raw = Array.isArray(normalizedAnswer)
            ? normalizedAnswer.join(',')
            : String(normalizedAnswer || '');
          const parts = raw
            .split(',')
            .map(s => s && s.toString().trim())
            .filter(Boolean)
            .map(token => {
              // If numeric like "1" -> "Option 1"
              if (/^\d+$/.test(token)) return `Option ${token}`;
              // If "Option1" -> "Option 1"
              const m = token.match(/^Option\s*(\d+)$/i);
              if (m) return `Option ${m[1]}`;
              // If token equals option text, convert to Option N
              const idx = options.findIndex(o => (o || '').toString().trim() === token);
              if (idx >= 0) return `Option ${idx + 1}`;
              return token; // leave as-is
            });
          normalizedAnswer = Array.from(new Set(parts)).join(',');
        } else if (type === 'SingleSelect') {
          const raw = String(normalizedAnswer || '');
          if (!/^Option\s*\d+$/i.test(raw)) {
            const idx = options.findIndex(o => (o || '').toString().trim() === raw.trim());
            if (idx >= 0) normalizedAnswer = `Option ${idx + 1}`;
          }
        }
      } catch (e) {
        // Non-breaking normalization failure
        console.warn('Answer normalization failed:', e);
      }
      const skillsArr = Array.isArray(foundQ.skills) ? foundQ.skills : [];

      // Extract trait/subtrait for DISC
      const discTraits = [];
      const discSubtraits = [];
      if ((foundQ.type || '') === 'Disc') {
        const primaryTraits = ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'];
        const defaultSub = { Dominance: 'Control', Influence: 'Persuasion', Steadiness: 'Support', Conscientiousness: 'Accuracy' };
        [0, 1, 2, 3].forEach((idx) => {
          const obj = [optsMap.Option1, optsMap.Option2, optsMap.Option3, optsMap.Option4][idx];
          const trait = (obj && typeof obj === 'object' && obj.trait) ? obj.trait : primaryTraits[idx];
          const subtrait = (obj && typeof obj === 'object' && obj.subtrait) ? obj.subtrait : (defaultSub[trait] || defaultSub[primaryTraits[idx]]);
          discTraits[idx] = trait;
          discSubtraits[idx] = subtrait;
        });
      }

      setEditForm({
        id: foundQ.id,
        resource: resourceToUpdate,
        q: foundQ.q || "",
        type: foundQ.type || "",
        options,
        answer: normalizedAnswer,
        skillsStr: skillsArr.join(", "),
        score: foundQ.score ?? 1,
        time: foundQ.time ?? null,
        image: foundQ.image || null,
        imageName: foundQ.imageName || null,
        // Prefer explicit notes, but for Essay/Coding also mirror ans if notes missing
        notes: foundQ.notes || ((foundQ.type === 'Essay' || foundQ.type === 'Coding') ? (foundQ.ans || '') : ''),
        // DISC specific fields
        ...(discTraits.length ? {
          discTrait_0: discTraits[0],
          discTrait_1: discTraits[1],
          discTrait_2: discTraits[2],
          discTrait_3: discTraits[3],
          discSubtrait_0: discSubtraits[0],
          discSubtrait_1: discSubtraits[1],
          discSubtrait_2: discSubtraits[2],
          discSubtrait_3: discSubtraits[3],
        } : {}),
      });
      setIsEditModalOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open editor.");
    }
  };
  const handleDeleteQuestion = (id, resourceId) => {
    console.log('id', id);
    console.log('fetchedData', fetchedData);

    if (!fetchedData || !Array.isArray(fetchedData.source)) {
      toast.error("Invalid data structure received.");
      return;
    }

    let resourceToUpdate = null;
    let questionText = '';

    // Prefer direct resource match by resourceId
    if (resourceId) {
      for (const resourceStr of fetchedData.source) {
        let resource;
        try { resource = JSON.parse(resourceStr); } catch (e) { continue; }
        const rid = resource?._id?.$oid || resource?._id;
        if (rid === resourceId) {
          resourceToUpdate = resource;
          break;
        }
      }
    }
    // Fallback: search by id across all resources
    if (!resourceToUpdate) {
      for (const resourceStr of fetchedData.source) {
        let resource;
        try { resource = JSON.parse(resourceStr); } catch (e) { continue; }
        if (resource.qs && Array.isArray(resource.qs)) {
          const question = resource.qs.find((q) => q.id === id);
          if (question) { resourceToUpdate = resource; break; }
        }
      }
    }

    if (resourceToUpdate && resourceToUpdate.qs && Array.isArray(resourceToUpdate.qs)) {
      const question = resourceToUpdate.qs.find((q) => q.id === id);
      if (question) {
        questionText = question.q || 'No text available';
        console.log('Found Question Text:', questionText);
      }
    }

    if (!resourceToUpdate) {
      toast.error("Question not found.");
      return;
    }

    setQuestionToDelete({ id, resourceToUpdate, questionText });
    setIsDeleteModalOpen(true);  // Open the modal
  };


  const handleConfirmDelete = async () => {
    const { id, resourceToUpdate } = questionToDelete;

    // Remove the question from the found resource
    const updatedQuestions = resourceToUpdate.qs.filter((q) => q.id !== id);

    // Prepare the payload for the PUT request
    const updatedPayload = {
      qs: updatedQuestions, // Updated list of questions without the deleted question
    };

    try {
      const storedData = sessionStorage.getItem("loginResponse");
      let token = null, userId = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
        userId = sourceObj._id?.$oid || sourceObj._id;
      }

      if (!token || !userId) {
        toast.error("User not authenticated.");
        return;
      }

      const resourceIdToSend = resourceToUpdate._id.$oid || resourceToUpdate._id;

      const response = await fetch(
        `${BaseUrl}/eUpdateColl?resourceId=${resourceIdToSend}&ColName=${uid}_QuestionBank`,
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
        throw new Error("Failed to update the question list.");
      }

      // Re-fetch the questions after successful deletion
      await fetchQuestions();
      toast.success("Question deleted and list updated.");
    } catch (err) {
      console.error("❌ Error deleting question:", err);
      toast.error("Failed to delete the question.");
    } finally {
      setIsDeleteModalOpen(false);  // Close the modal after operation
    }
  };

  const EditQuestionModal = ({ isOpen, form, onClose, onSave }) => {
    const [localForm, setLocalForm] = React.useState(form);
    const [isUpdating, setIsUpdating] = useState(false);  // State to track update status
    React.useEffect(() => {
      if (isOpen) setLocalForm(form);
    }, [isOpen, form]);
    if (!isOpen || !localForm) return null;
    const type = localForm.type;
    const options = localForm.options || ["", "", "", ""];
    const isSingle = type === 'SingleSelect';
    const isMulti = type === 'MultipleSelect';
    const isBool = type === 'True/False' || type === 'Yes/No';
    const isEssay = type === 'Essay';
    const isCoding = type === 'Coding';
    const isDisc = type === 'Disc';
    const isImageType = /image/i.test(type || '');

    const handleOptionText = (i, val) => {
      setLocalForm(prev => {
        const next = [...(prev.options || ["", "", "", ""])];
        next[i] = val;
        return { ...prev, options: next };
      });
    };
    const toggleMultiAns = (idx, checked) => {
      setLocalForm(prev => {
        const token = `Option ${idx + 1}`;
        const parts = String(prev.answer || '').split(',').map(s => s.trim()).filter(Boolean);
        const set = new Set(parts);
        if (checked) set.add(token); else set.delete(token);
        return { ...prev, answer: Array.from(set).join(',') };
      });
    };
    const setSingleAns = (idx) => setLocalForm(prev => ({ ...prev, answer: `Option ${idx + 1}` }));
    const setBoolAns = (val) => setLocalForm(prev => ({ ...prev, answer: val }));

    const handleImageChange = async (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLocalForm(prev => ({ ...prev, image: reader.result, imageName: file.name }));
      };
      reader.readAsDataURL(file);
    };
    const handleRemoveImage = () => {
      setLocalForm(prev => ({ ...prev, image: null, imageName: null }));
    };

    const handleSave = () => {
      setIsUpdating(true);  // Set the state to indicate the update is in progress
      onSave(localForm)
        .then(() => {
          setIsUpdating(false);  // Reset the update state after successful update
        })
        .catch(() => {
          setIsUpdating(false);  // Reset the state even if there is an error
        });
    };

    // Enhanced validation for all mandatory fields
    const validateForm = () => {
      // Check question text
      if (!localForm.q || localForm.q.trim() === '') return false;
      
      // Check question type
      if (!localForm.type || localForm.type.trim() === '') return false;
      
      // Check skills
      if (!localForm.skillsStr || localForm.skillsStr.trim() === '') return false;
      
      // Check score
      if (!localForm.score || localForm.score < 1) return false;
      
      // Type-specific validation
      if (isSingle || isMulti || isImageType) {
        const nonEmptyOptions = options.filter(opt => opt && opt.trim() !== '');
        if (nonEmptyOptions.length < 2) return false;
        
        // Check if answer is selected for Single/Multi/Image questions
        if (!localForm.answer || localForm.answer.trim() === '') return false;
      }
      
      if (isBool) {
        // For True/False and Yes/No questions, answer should be selected
        if (!localForm.answer || localForm.answer.trim() === '') return false;
      }
      
      if (isEssay || isCoding) {
        // For Essay/Coding questions, answer/notes should be provided
        const hasAnswer = localForm.answer && localForm.answer.trim() !== '';
        const hasNotes = localForm.notes && localForm.notes.trim() !== '';
        if (!hasAnswer && !hasNotes) return false;
      }
      
      if (isDisc) {
        // For DISC questions, all 4 options should be filled
        const nonEmptyOptions = options.filter(opt => opt && opt.trim() !== '');
        if (nonEmptyOptions.length < 4) return false;
      }
      
      if (isImageType) {
        // For Image questions, image should be provided
        if (!localForm.image && !localForm.imageName) return false;
      }
      
      return true;
    };

    const isFormValid = validateForm();

    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t("previewandeditquestion")}</h3>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("questiontext")} <span className="text-red-500">*</span>
              </label>
              <textarea 
                className={`w-full border rounded px-3 py-2 ${
                  !localForm.q || localForm.q.trim() === '' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`} 
                rows={3}
                value={localForm.q}
                onChange={(e) => setLocalForm(prev => ({ ...prev, q: e.target.value }))} 
                placeholder="Enter your question text..."
              />
              {(!localForm.q || localForm.q.trim() === '') && (
                <p className="text-xs text-red-500 mt-1">Question text is required</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("type")}</label>
                <input className="w-full border rounded px-3 py-2 bg-gray-100" value={type} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("skills")} <span className="text-red-500">*</span>
                </label>
                <input 
                  className={`w-full border rounded px-3 py-2 ${
                    !localForm.skillsStr || localForm.skillsStr.trim() === '' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., Leadership, Communication"
                  value={localForm.skillsStr}
                  onChange={(e) => setLocalForm(prev => ({ ...prev, skillsStr: e.target.value }))} 
                />
                {(!localForm.skillsStr || localForm.skillsStr.trim() === '') && (
                  <p className="text-xs text-red-500 mt-1">Skills are required</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("score")} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  min={1} 
                  className={`w-full border rounded px-3 py-2 ${
                    !localForm.score || localForm.score < 1 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  value={localForm.score}
                  onChange={(e) => setLocalForm(prev => ({ ...prev, score: e.target.value === '' ? '' : (parseInt(e.target.value) || 1) }))} 
                />
                {(!localForm.score || localForm.score < 1) && (
                  <p className="text-xs text-red-500 mt-1">Score must be at least 1</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("timeseconds")}</label>
                <input type="number" min={0} className="w-full border rounded px-3 py-2"
                  value={localForm.time ?? ''} onChange={(e) => setLocalForm(prev => ({ ...prev, time: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) }))} />
              </div>
            </div>

            {(isSingle || isMulti || isImageType) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("options")} <span className="text-red-500">*</span>
                </label>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    {(isSingle || isImageType) && (
                      <input type="radio" name="singleAns"
                        checked={String(localForm.answer || '') === `Option ${i + 1}` || String(localForm.answer || '') === (options[i] || '')}
                        onChange={() => setSingleAns(i)} />
                    )}
                    {isMulti && (
                      <input type="checkbox"
                        checked={(() => {
                          const ans = String(localForm.answer || '');
                          const parts = ans.split(',').map(s => s && s.trim()).filter(Boolean);
                          const token1 = `Option ${i + 1}`;
                          const token2 = (options[i] || '').toString().trim();
                          const token3 = String(i + 1);
                          const token4 = `Option${i + 1}`;
                          return parts.includes(token1) || (token2 && parts.includes(token2)) || parts.includes(token3) || parts.includes(token4);
                        })()}
                        onChange={(e) => toggleMultiAns(i, e.target.checked)} />
                    )}
                    <input 
                      className={`flex-1 border rounded px-3 py-2 ${
                        i < 2 && (!options[i] || options[i].trim() === '') 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      placeholder={`Option ${i + 1}${i < 2 ? ' *' : ''}`}
                      value={options[i] || ''}
                      onChange={(e) => handleOptionText(i, e.target.value)} />
                  </div>
                ))}
                {(() => {
                  const nonEmptyOptions = options.filter(opt => opt && opt.trim() !== '');
                  if (nonEmptyOptions.length < 2) {
                    return <p className="text-xs text-red-500 mt-1">At least 2 options are required</p>;
                  }
                  if (!localForm.answer || localForm.answer.trim() === '') {
                    return <p className="text-xs text-red-500 mt-1">Please select the correct answer</p>;
                  }
                  return null;
                })()}
              </div>
            )}

            {isDisc && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t("discoptions")} <span className="text-red-500">*</span>
                </label>
                {[0, 1, 2, 3].map((i) => {
                  const primaryTraits = ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'];
                  const subMap = {
                    Dominance: ['Assertiveness', 'Decisiveness', 'Control', 'Patience'],
                    Influence: ['Optimism', 'Sociability', 'Persuasiveness'],
                    Steadiness: ['Supportiveness', 'Patience'],
                    Conscientiousness: ['Accuracy', 'Compliance', 'Analytical'],
                  };

                  const traitKey = `discTrait_${i}`;
                  const subtraitKey = `discSubtrait_${i}`;

                  // Always select the main trait and disable it
                  const traitVal = primaryTraits[i];
                  const subtraitVal = localForm[subtraitKey] || (subMap[traitVal][0] || '');

                  return (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      <input
                        className={`border rounded px-3 py-2 md:col-span-1 ${
                          !localForm.options[i] || localForm.options[i].trim() === ''
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder={`Option ${i + 1} text *`}
                        value={localForm.options[i] || ''}
                        onChange={(e) => {
                          const nextOptions = [...(localForm.options || ["", "", "", ""])];
                          nextOptions[i] = e.target.value;
                          setLocalForm(prev => ({ ...prev, options: nextOptions }));
                        }}
                      />
                      <select
                        className="border rounded px-3 py-2"
                        value={traitVal}
                        disabled // main trait cannot be changed
                      >
                        <option value={traitVal}>{traitVal}</option>
                      </select>
                      <select
                        className="border rounded px-3 py-2"
                        value={subtraitVal}
                        onChange={(e) => setLocalForm(prev => ({ ...prev, [subtraitKey]: e.target.value }))}
                      >
                        {subMap[traitVal].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                <p className="text-xs text-gray-500">{t("tips")}</p>
                {(() => {
                  const nonEmptyOptions = options.filter(opt => opt && opt.trim() !== '');
                  if (nonEmptyOptions.length < 4) {
                    return <p className="text-xs text-red-500 mt-1">All 4 DISC options are required</p>;
                  }
                  return null;
                })()}
              </div>
            )}

            {isBool && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("correctAnswer")} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="boolAns"
                      checked={localForm.answer === (type === 'Yes/No' ? 'Yes' : 'True')}
                      onChange={() => setBoolAns(type === 'Yes/No' ? 'Yes' : 'True')} />
                    <span>{type === 'Yes/No' ? 'Yes' : 'True'}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="boolAns"
                      checked={localForm.answer === (type === 'Yes/No' ? 'No' : 'False')}
                      onChange={() => setBoolAns(type === 'Yes/No' ? 'No' : 'False')} />
                    <span>{type === 'Yes/No' ? 'No' : 'False'}</span>
                  </label>
                </div>
                {(!localForm.answer || localForm.answer.trim() === '') && (
                  <p className="text-xs text-red-500 mt-1">Please select the correct answer</p>
                )}
              </div>
            )}

            {(isEssay || isCoding) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("answer")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`w-full border rounded px-3 py-2 ${
                    (!localForm.answer || localForm.answer.trim() === '') && 
                    (!localForm.notes || localForm.notes.trim() === '')
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  rows={6}
                  placeholder="Enter the answer/solution text"
                  value={localForm.answer || localForm.notes || ''}
                  onChange={(e) => setLocalForm(prev => ({ ...prev, answer: e.target.value, notes: e.target.value }))}
                />
                {(!localForm.answer || localForm.answer.trim() === '') && 
                 (!localForm.notes || localForm.notes.trim() === '') && (
                  <p className="text-xs text-red-500 mt-1">Answer/solution text is required</p>
                )}
              </div>
            )}

            {isImageType && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t("image")} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files && e.target.files[0])}
                  />
                  {(localForm.image || localForm.imageName) && (
                    <button type="button" onClick={handleRemoveImage} className="px-3 py-1 border rounded">{t("remove")}</button>
                  )}
                </div>
                {(!localForm.image && !localForm.imageName) && (
                  <p className="text-xs text-red-500 mt-1">Image is required for image-type questions</p>
                )}
                {(localForm.image || localForm.imageName) && (
                  <div className="border rounded p-2">
                    <img
                      src={localForm.image || localForm.imageUrl || ''}
                      alt={localForm.imageName || 'question image'}
                      className="max-h-64 object-contain mx-auto"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    {!localForm.image && localForm.imageName && (
                      <p className="text-xs text-gray-500">{t("imagename")} {localForm.imageName}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 border rounded">{t("cancel")}</button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 rounded transition-colors ${
                isUpdating || !isFormValid
                  ? 'bg-gray-400 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              disabled={isUpdating || !isFormValid}
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleConfirmEdit = async (updatedForm) => {
    const formToUse = updatedForm || editForm;
    if (!formToUse || !formToUse.resource) return;
    try {
      const storedData = sessionStorage.getItem("loginResponse");
      let token = null, userId = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
        userId = sourceObj._id?.$oid || sourceObj._id;
      }
      if (!token || !userId) { toast.error("User not authenticated."); return; }

      // Build updated q/ans/opts/skills
      let opts = {};
      let ans = formToUse.answer || "";
      if (formToUse.type === 'Disc') {
        const primaryTraits = ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'];
        (formToUse.options || []).slice(0, 4).forEach((optText, idx) => {
          if ((optText ?? '').toString().trim() === '') return;
          const optionKey = `Option${idx + 1}`;
          const trait = (formToUse[`discTrait_${idx}`] || primaryTraits[idx] || '').toString();
          const subtrait = (formToUse[`discSubtrait_${idx}`] || '').toString() || trait;
          const obj = { text: optText, trait, subtrait };
          opts[optionKey] = obj;
        });
        ans = { ...opts };
      } else {
        opts = (formToUse.options || []).reduce((acc, opt, idx) => {
          if ((opt ?? '').toString().trim() !== "") acc[`Option${idx + 1}`] = opt;
          return acc;
        }, {});
      }

      if (formToUse.type === 'SingleSelect' && !String(ans).startsWith('Option')) {
        const idx = (formToUse.options || []).findIndex(o => o === ans);
        if (idx >= 0) ans = `Option ${idx + 1}`;
      }
      if (formToUse.type === 'MultipleSelect') {
        const parts = String(ans || '').split(',').map(s => s.trim()).filter(Boolean);
        const onlyOpts = parts.map(p => {
          if (/^\d+$/.test(p)) return `Option ${p}`;
          const m = p.match(/^Option\s*(\d+)$/i);
          if (m) return `Option ${m[1]}`;
          const idx = (formToUse.options || []).findIndex(o => (o || '').toString().trim() === p);
          if (idx >= 0) return `Option ${idx + 1}`;
          return p;
        }).filter(p => p.startsWith('Option '));
        ans = onlyOpts.join(',');
      }
      const skills = (formToUse.skillsStr || '').split(',').map(s => s.trim()).filter(Boolean);

      const updatedQs = (formToUse.resource.qs || []).map(q => q.id === formToUse.id ? {
        ...q,
        q: formToUse.q,
        type: formToUse.type,
        score: formToUse.score ?? 1,
        time: formToUse.time ?? null,
        ans,
        opts,
        skills,
        // Preserve and/or update rich fields
        image: formToUse.image || q.image || null,
        imageName: formToUse.imageName || q.imageName || null,
        notes: (formToUse.notes !== undefined) ? formToUse.notes : q.notes || ((formToUse.type === 'Essay' || formToUse.type === 'Coding') ? ans : q.notes),
      } : q);

      const payload = { qs: updatedQs };
      const resourceIdToSend = formToUse.resource._id?.$oid || formToUse.resource._id;

      const response = await fetch(
        `${BaseUrl}/eUpdateColl?resourceId=${resourceIdToSend}&ColName=${uid}_QuestionBank`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', xxxid: uid },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to update the question.');
      toast.success('Question updated successfully.');
      setIsEditModalOpen(false);
      setEditForm(null);
      await fetchQuestions();

    } catch (e) {
      console.error(e);
      toast.error('Failed to update question.');
    }
  };

  const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, questionText }) => {
    if (!isOpen) return null;

    console.log('Modal Question Text:', questionText);  // Log to check if it's correctly passed

    return (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
          <h3 className="text-xl font-semibold mb-4">{t("suredelete")}</h3>
          <p className="mb-4 text-sm text-gray-700">{questionText}</p>
          <div className="flex justify-center gap-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg text-gray-700 hover:bg-gray-400">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">OK</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header: show search + create in list mode; show Back button in editor mode */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        {viewMode === 'list' ? (
          <>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("questionbank")}</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {t("manageandorganise")}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto mt-7">
              {/* Enter search skills input */}
              {/* <input
                type="text"
                placeholder={t("entersearchskills")}
                value={skillFilter === 'all' ? '' : skillFilter}
                onChange={(e) => setSkillFilter(e.target.value.trim() === '' ? 'all' : e.target.value)}
                className="flex-1 sm:w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              /> */}
              {/* Custom skills dropdown with scrollable menu */}
              <div className="relative" ref={skillMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsSkillMenuOpen((v) => !v)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[12rem] text-left"
                >
                  {skillFilter === 'all' ? (t("selectcategory") || 'Select category') : skillFilter}
                </button>
                {isSkillMenuOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => { setSkillFilter('all'); setIsSkillMenuOpen(false); }}
                    >
                      {t("selectskills")}
                    </div>
                    {Object.keys(skillCounts)
                      .sort((a, b) => a.localeCompare(b))
                      .map((skill) => (
                        <div
                          key={skill}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                          onClick={() => { setSkillFilter(skill); setIsSkillMenuOpen(false); }}
                        >
                          {skill} ({skillCounts[skill]})
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAddQuestion(true)}
                disabled={isLoading}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors
      ${isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <AiOutlinePlus size={20} />
                <span>{t("createnewquestions")}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <button
              onClick={handleBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft />
              {t("backtoquestionbank")}
            </button>
            <button
              onClick={() => handleSaveQuestion(visibleQuestions, { finalize: true })}
              disabled={visibleQuestions.length === 0 || isSaving}
              className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2
      ${isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : (visibleQuestions.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700')
                }`}
            >
              {isSaving ? (
                <>
                  <FaSave className="animate-spin" />
                  <span>{t("Saving")}</span>
                </>
              ) : (
                t("save")
              )}
            </button>


          </div>
        )}
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Skill chips summary hidden as requested */}
          {false && (
            <div className="flex flex-wrap gap-2 mb-4 max-h-10 overflow-y-auto">
              <span className="px-4 py-2 text-xs rounded-full border bg-gray-100 border-gray-600 text-gray-800">
                {t("total")} {uniqueVisibleQuestions.length}
              </span>
              {Object.entries(skillCounts).map(([s, c]) => {
                const randomColor = generateRandomColor();
                return (
                  <span
                    key={s}
                    className={`px-4 py-2 text-xs rounded-full border cursor-pointer ${randomColor}`}
                    onClick={() => setSkillFilter(s)}
                  >
                    {s}: {c}
                  </span>
                );
              })}
            </div>
          )}

          {/* Questions table with checkboxes and pagination */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t("questions")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t("type")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t("skills")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t("score")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      {t("loadingquestions")}
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      {t("noquestionsavilable")}
                    </td>
                  </tr>
                ) : (
                  paginated.map((q) => (
                    <tr key={q.uiKey} className="hover:bg-gray-50">
                      <td
                        className="px-4 py-2 text-sm text-gray-900"
                        style={{
                          wordBreak: 'break-word',
                          maxWidth: '250px', // Set a fixed width for the "Question" column
                          whiteSpace: 'normal', // Allow the content to break into the next line
                        }}
                      >{q.text || '(Not available)'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{q.type}</td>
                      {/* <td className="px-4 py-2 text-sm text-gray-700">{Array.isArray(q.skills) && q.skills.length > 0 ? q.skills.join(', ') : 'General'}</td> */}

                      <td className="px-4 py-2 text-sm text-gray-700">
                        <div className="max-h-6 overflow-y-auto">
                          {Array.isArray(q.skills) && q.skills.length > 0
                            ? q.skills.join(', ')
                            : 'General'}
                        </div>
                      </td>

                      <td className="px-4 py-2 text-sm text-gray-700">{q.score ?? 1}</td>
                      {/* Action column with Edit and Delete icons */}
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {/* Edit icon */}
                        <button
                          onClick={() => handleEditQuestion(q)}
                          className="text-blue-500 hover:text-blue-800"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>

                        {/* Delete icon */}
                        <button
                          onClick={() => {
                            console.log("Question:", q);
                            handleDeleteQuestion(q.id, q.resourceId || null);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <AiOutlineDelete size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>


          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}  // Close modal without deleting
            onConfirm={handleConfirmDelete}  // Confirm delete
            questionText={questionToDelete?.questionText || ''}
          />

          <EditQuestionModal
            isOpen={isEditModalOpen}
            form={editForm}
            onClose={() => { setIsEditModalOpen(false); setEditForm(null); }}
            onSave={handleConfirmEdit}
          />

          {/* Pagination controls (fixed 5 per page): Prev / Next only */}

          <div className="flex items-center justify-center mt-4 gap-2">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              {t("previous")}
            </button>

            {/* Page info */}
            <span className="px-3 py-1">
              {t("page")} {page} {t("of")} {totalPages}
            </span>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {t("next")}
            </button>
          </div>

        </>
      ) : (
        <TestEditQuestionsTab
          questions={questions}   // ✅ now will be empty after Create New Question  // ✅ only show the new/active question
          isEditingQuestion={isEditingQuestion}
          setQuestions={(list) => {
            if (skillFilter === 'all') {
              setQuestions(list);
            } else {
              const others = questions.filter((q) => (q.skill || 'General') !== skillFilter);
              setQuestions([...others, ...list]);
            }
          }}
          currentQuestion={currentQuestion}
          setShowImportModal={setShowImportModal}
          handleAddQuestion={handleAddQuestion}
          handleQuestionChange={handleQuestionChange}
          handleOptionChange={handleOptionChange}
          handleCancelQuestion={handleCancelQuestion}
          handleSaveQuestion={handleSaveQuestion}
          resourceId={null}
          refreshTests={() => { }}
          isQuestionBank={true}
          saveTick={saveTick}
        />
      )}
    </div>
  );
};

export default QuestionBank;


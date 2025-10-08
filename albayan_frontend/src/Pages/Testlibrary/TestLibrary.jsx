import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AiOutlinePlus } from "react-icons/ai";
import {
  FiSearch,
  FiFilter,
  FiBookOpen,
  FiGrid,
  FiList,
  FiClock,
  FiCalendar,
  FiEye,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiArchive,
  FiUser,
  FiTag,
  FiPlay,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";
import { FaChartLine } from "react-icons/fa";
import TestPreview from "./TestPreviewTabs/TestPreview";
import TestEdit from "./EditTabs/TestEdit";
import TestCreate from "./TestCreateTabs/TestCreate";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { usePagination } from "../../components/Pagination/usePagination";
import PaginationControls from "../../components/Pagination/PaginationControls";
import { useLanguage } from "../../contexts/LanguageContext";
/* ===================== CONFIG ===================== */
import { BaseUrl, uid } from "../../Api/Api";

/* ===================== HELPERS ===================== */
const extractToken = () => {
  const storedData = sessionStorage.getItem("loginResponse");
  if (!storedData) return null;
  try {
    const parsed = JSON.parse(storedData);
    if (!parsed?.source) return null;
    const src = JSON.parse(parsed.source);
    return {
      token: src?.token || null,
      userId: src?._id?.$oid || src?._id || null, // <-- pull userId
    };
  } catch {
    return null;
  }
};

// Take any raw record from API and map to UI-friendly test object
const normalizeTest = (raw) => {
  let obj = raw;

  try {
    // unwrap stringified JSON
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

  // const createdISO = obj?.created || obj?.createdDate || obj?.createdAt || null;
  // const createdDate = createdISO
  //   ? createdISO.split("T")[0]
  //   : new Date().toISOString().split("T")[0];

  const createdISO = obj?.created || obj?.createdDate || obj?.createdAt || null;

  // Format as DD-MM-YYYY
  const createdDate = createdISO
    ? (() => {
        const d = new Date(createdISO);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      })()
    : (() => {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      })();

  const qCount = Array.isArray(obj?.qs)
    ? obj.qs.length
    : typeof obj?.qs === "number"
    ? obj.qs
    : 0;
  console.log(
    "Raw cat:",
    obj.cat,
    "Mapped category:",
    obj?.cat || obj?.category
  );

  return {
    id,
    title: obj?.title || "Untitled Test",
    description: obj?.desc || obj?.description || "—",
    category: obj?.cat || obj?.category || "—",
    creator: obj?.creator || "—",
    duration: Number(obj?.dur) || Number(obj?.duration) || 0,
    questions: qCount,
    createdDate,
    skill: obj?.skill || "—",
    tags: Array.isArray(obj?.tags) ? obj.tags : [],
    instructions: obj?.instr || "",
    attempts: obj?.attempts || 1,
    status: obj?.status || obj?.settings?.status || "—",
    difficulty: obj?.diff || obj?.difficulty || "—",
    type: obj?.type || "—",
    showResults: obj?.showRes ?? false,
    languages:
      Array.isArray(obj?.languages) && obj.languages.length > 0
        ? obj.languages
        : ["EN"],
    __raw: raw,
  };
};

// Normalize an entire response body from retrievecollection endpoint
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

/* ===================== COMPONENT ===================== */
const TestLibrary = () => {
  const { t } = useLanguage();
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("asc"); // asc or desc
  const [selected, setSelected] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [previewTest, setPreviewTest] = useState(null);
  const [editTest, setEditTest] = useState(null);

  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteTargetName, setDeleteTargetName] = useState(""); // <-- New state for test name(s)

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);
  

  // Prevent multiple fetches
  const hasFetchedRef = useRef(false);
  const tokenRef = useRef(null);

  /* ---------- fetch tests (memoized) ---------- */
  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const creds = extractToken();
      if (!creds) throw new Error("Token not found");
      tokenRef.current = creds;

      const { token, userId } = creds;

      // Fetch from TestLibrary collection only
      const testLibraryRes = await fetch(
        `${BaseUrl}/auth/retrievecollection?ColName=${uid}_TestLibrary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      if (!testLibraryRes.ok) {
        throw new Error(
          `Failed to load tests (TestLibrary: ${testLibraryRes.status})`
        );
      }

      // Parse response from TestLibrary collection
      const testLibraryData = await testLibraryRes.json();

      // Normalize data from TestLibrary
      const normalizedTests = normalizeResponseToTests(testLibraryData);

      console.log(`Loaded ${normalizedTests.length} tests from TestLibrary`);

      setTests(normalizedTests);
    } catch (e) {
      console.error(e);
      setError("Failed to load tests");
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load token and fetch tests once
  useEffect(() => {
    tokenRef.current = extractToken();
    if (!tokenRef.current) {
      setError("Token not found");
      setLoading(false);
      return;
    }
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchTests(); //  safe, defined above
  }, [fetchTests]);

  /* ---------- callbacks ---------- */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelected([]);

  // const handleDelete = async () => {
  //   try {
  //     if (!deleteTarget) return;

  //     const storedData = sessionStorage.getItem("loginResponse");
  //     let token = null;
  //     let userId = null;
  //     if (storedData) {
  //       const parsedData = JSON.parse(storedData);
  //       if (parsedData.source) {
  //         const sourceObj = JSON.parse(parsedData.source);
  //         token = sourceObj.token;
  //         userId = sourceObj._id?.$oid || sourceObj._id || null;
  //       }
  //     }
  //     if (!token || !userId) throw new Error("Token or UserId not found");

  //     // Single delete
  //     if (deleteTarget !== "bulk") {
  //       const response = await fetch(
  //         `${BaseUrl}/auth/eDeleteWCol?ColName=${uid}_TestLibrary&resourceId=${deleteTarget}`,
  //         {
  //           method: "DELETE",
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //             xxxid: uid,
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         const errText = await response.text();
  //         throw new Error(errText || "Failed to delete test");
  //       }

  //       // Update UI immediately
  //       setTests((prev) => prev.filter((t) => t.id !== deleteTarget));
  //     }

  //     // Bulk delete
  //     else {
  //       await Promise.all(
  //         selected.map((id) =>
  //           fetch(
  //             `${BaseUrl}/auth/eDeleteWCol?ColName=${uid}_TestLibrary&resourceId=${id}`,
  //             {
  //               method: "DELETE",
  //               headers: {
  //                 Authorization: `Bearer ${token}`,
  //                 "Content-Type": "application/json",
  //                 xxxid: uid,
  //               },
  //             }
  //           )
  //         )
  //       );
  //       setTests((prev) => prev.filter((t) => !selected.includes(t.id)));
  //       setSelected([]);
  //     }

  //     setShowDeleteModal(false);
  //     setDeleteTarget(null);
  //     setDeleteTargetName("");
  //   } catch (err) {
  //     console.error("❌ Error deleting test:", err);
  //     alert(err.message || "Failed to delete test");
  //   }

  //   // 🔥 re-fetch fresh data after edit/create
  //   fetchTests();
  // };
  const handleDelete = async () => {
    try {
      if (!deleteTarget) return;
      setIsDeleting(true); // disable button immediately

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
      if (!token || !userId) throw new Error("Token or UserId not found");

      // ✅ Fetch candidate list
      const candidateRes = await fetch(
        `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );
      if (!candidateRes.ok) throw new Error("Failed to fetch candidates");

      const candidateData = await candidateRes.json();
      const candidates = (candidateData.source || [])
        .map((item) => {
          try {
            return typeof item === "string" ? JSON.parse(item) : item;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // ✅ Fetch test library collection to resolve tid for the test(s) being deleted
      const testLibraryRes = await fetch(
        `${BaseUrl}/auth/retrievecollection?ColName=${uid}_TestLibrary`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      if (!testLibraryRes.ok) {
        throw new Error("Failed to fetch tests from TestLibrary collection");
      }

      const testLibraryData = await testLibraryRes.json();

      const testLibraryTests = (testLibraryData.source || [])
        .map((item) => {
          try {
            return typeof item === "string" ? JSON.parse(item) : item;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const allTests = testLibraryTests;

      // 🔥 Find tid(s) of the test(s) you’re deleting
      const deleteTids =
        deleteTarget !== "bulk"
          ? allTests
              .filter(
                (t) => t._id?.$oid === deleteTarget || t._id === deleteTarget
              )
              .map((t) => t.tid)
          : allTests
              .filter((t) => selected.includes(t._id?.$oid || t._id))
              .map((t) => t.tid);

      // 🔥 Check if any of those tids exist in candidates.asnT
      const isAssigned = candidates.some(
        (c) =>
          Array.isArray(c.asnT) &&
          c.asnT.some((t) => deleteTids.includes(t.tid))
      );

      if (isAssigned) {
        toast.error(
          "This test is already assigned to a candidate and cannot be deleted."
        );
        // setShowToast(true);
        // setTimeout(() => setShowToast(false), 3000);
        setShowDeleteModal(false);
        setDeleteTarget(null);
        return;
      }

      // ✅ Step 2: Proceed with actual deletion
      if (deleteTarget !== "bulk") {
        // Determine which collection the test belongs to
        const collectionName = `${uid}_TestLibrary`;

        const response = await fetch(
          `${BaseUrl}/auth/eDeleteWCol?ColName=${collectionName}&resourceId=${deleteTarget}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );
        if (!response.ok)
          throw new Error(`Failed to delete test from ${collectionName}`);

        setTests((prev) => prev.filter((t) => t.id !== deleteTarget));
      } else {
        // Handle bulk deletion from both collections
        const deletionPromises = selected.map(async (id) => {
          const collectionName = `${uid}_TestLibrary`;

          return fetch(
            `${BaseUrl}/auth/eDeleteWCol?ColName=${collectionName}&resourceId=${id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                xxxid: uid,
              },
            }
          );
        });

        await Promise.all(deletionPromises);
        setTests((prev) => prev.filter((t) => !selected.includes(t.id)));
        setSelected([]);
      }

      setShowDeleteModal(false);
      setDeleteTarget(null);
      setDeleteTargetName("");
      fetchTests();
    } catch (err) {
      console.error("❌ Error deleting test:", err);
      toast.error(err.message || "Failed to delete test");
    } finally {
      setIsDeleting(false); // re-enable button
    }
  };

  const handlePreview = (test) => {
    setPreviewTest(test.__raw);
    console.log("Edit Test Data:", test.__raw); // check if all fields are correct
  };

  const handleBackToLibrary = () => {
    setPreviewTest(null);
    setEditTest(null);
    setShowCreateTest(false);

    // 🔥 re-fetch fresh data after edit/create
    fetchTests();
  };

  const handleEdit = (test) => {
    // Pass the original raw JSON into TestEdit
    setEditTest(test.__raw);
    console.log("Edit Test Data:", test.__raw);
  };

  // Called by TestCreate AFTER API success — receive server response, normalize, and append
  const handleTestCreated = (serverResponse) => {
    const normalized = normalizeResponseToTests(serverResponse);
    // If API returns a single object, normalized will be [one]; if array, spread
    setTests((prev) => [...prev, ...normalized]);
    setToastMessage("Test created successfully!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // 🔥 re-fetch fresh data after edit/create
    fetchTests();
  };

  /* ---------- FILTER + SEARCH + SORT ---------- */
  const sortedTests = useMemo(() => {
    let filtered = [...tests];

    if (search) {
      filtered = filtered.filter((t) =>
        (t.title || "").toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterStatus !== "all")
      filtered = filtered.filter(
        (t) => (t.status || "").toLowerCase() === filterStatus
      );

    if (filterCategory !== "all")
      filtered = filtered.filter(
        (t) => (t.category || "") === filterCategory
      );

    if (filterDifficulty !== "all")
      filtered = filtered.filter(
        (t) => (t.difficulty || "") === filterDifficulty
      );

    filtered.sort((a, b) => {
      if (sortBy === "title") {
        // Always sort A-Z for title, ignore sortOrder and reverse
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "duration") {
        const diff = (a.duration || 0) - (b.duration || 0);
        return sortOrder === "desc" ? -diff : diff;
      }
      if (sortBy === "questions") return (a.qCount || 0) - (b.qCount || 0);
      // default: created
      return new Date(a.created || 0) - new Date(b.created || 0);
    });

    // Only reverse if NOT sorting by title
    if (sortBy === "title") {
      return filtered;
    }
    
    //  Just reverse the final list to show recent first
    return filtered.slice().reverse();
  }, [tests, search, filterStatus, filterCategory, filterDifficulty, sortBy, sortOrder]);

   /* ---------- pagination ---------- */
   const pagination = usePagination(sortedTests);

  /* ---------- derived stats ---------- */
  const totalTests = tests.length;
  const activeCount = tests.filter(
    (t) => (t.status || "").toLowerCase() === "active"
  ).length;
  const draftCount = tests.filter(
    (t) => (t.status || "").toLowerCase() === "draft"
  ).length;
  const avgDuration =
    tests.length > 0
      ? Math.round(
          tests.reduce((sum, t) => sum + (Number(t.duration) || 0), 0) /
            tests.length
        )
      : 0;

  /* ===================== RENDER ===================== */

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">
            {t("loadingTests")}
          </p>
        </div>
      </div>
    );

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
            // trigger re-fetch
            (async () => {
              try {
                const res = await fetch(
                  `${BaseUrl}/auth/retrievecollection?ColName=TestLibrary`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${
                        tokenRef.current || extractToken()
                      }`,
                      "Content-Type": "application/json",
                      xxxid: uid,
                    },
                  }
                );
                const data = await res.json();
                const normalized = normalizeResponseToTests(data);
                setTests(normalized);
              } catch {
                setError("Failed to load tests");
                setTests([]);
              } finally {
                setLoading(false);
              }
            })();
          }}
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div>
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />

      {previewTest ? (
        <div>
          <button
            onClick={handleBackToLibrary}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FiArrowLeft />
            <span>{t("backToTestLibrary","Back To TestLibrary")}</span>
          </button>
          <TestPreview test={previewTest} onBack={handleBackToLibrary} />
        </div>
      ) : editTest ? (
        <div>
          <button
            onClick={handleBackToLibrary}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FiArrowLeft />
            <span>{t("backToTestLibrary","Back To TestLibrary")}</span>
          </button>
          <TestEdit test={editTest} onBack={handleBackToLibrary} />
        </div>
      ) : showCreateTest ? (
        <TestCreate
          onBack={handleBackToLibrary}
          onTestCreated={handleTestCreated}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("testLibrary")}
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {t("manageOrganizeTests")}
              </p>
            </div>
            <button
              onClick={() => setShowCreateTest(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <AiOutlinePlus size={20} />
              <span>{t("createNewTest")}</span>
            </button>
          </div>

          {/* Stats Grid (dynamic) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {/* Total Tests */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiBookOpen className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-900">
                  {totalTests}
                </div>
                <div className="text-xs sm:text-sm text-blue-700">
                  {t("totalTests")}
                </div>
              </div>
            </div>

            {/* Active Tests */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiPlay className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <div className="text-xl sm:text-2xl font-bold text-green-900">
                  {activeCount}
                </div>
                <div className="text-xs sm:text-sm text-blue-700">
                  {t("activeTests")}
                </div>
              </div>
            </div>

            {/* Draft Tests */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiEdit className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-900">
                  {draftCount}
                </div>
                <div className="text-xs sm:text-sm text-blue-700">
                  {t("draftTests")}
                </div>
              </div>
            </div>

            {/* Avg Duration */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaChartLine className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-900">
                  {avgDuration}m
                </div>
                <div className="text-xs sm:text-sm text-blue-700">
                  {t("avgDuration")}
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-48 flex-shrink-0">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchTests")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Filters */}
            <FiFilter className="text-gray-400 ml-1" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-shrink-0"
            >
              <option value="all">{t("allTests")}</option>
              <option value="active">{t("active")}</option>
              <option value="draft">{t("draft")}</option>
              <option value="archived">{t("archived")}</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-shrink-0"
            >
              <option value="all">{t("allCategories")}</option>
              <option value="Technical">{t("technical")}</option>
              <option value="Behavioral">{t("behavioral")}</option>
              <option value="Cognitive">{t("cognitive")}</option>
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-shrink-0"
            >
              <option value="all">{t("allDifficulties")}</option>
              <option value="Easy">{t("easy")}</option>
              <option value="Medium">{t("medium")}</option>
              <option value="Hard">{t("hard")}</option>
            </select>

            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => setView("grid")}
                className={`px-3 py-2 text-sm font-medium ${
                  view === "grid"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <FiGrid size={18} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-2 text-sm font-medium ${
                  view === "list"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <FiList size={18} />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex-shrink-0"
            >
              <option value="created">{t("sortByCreated")}</option>
              <option value="title">{t("sortByTitle")}</option>
              <option value="duration">{t("sortByDuration")}</option>
              {/* <option value="questions">Sort by Questions</option> */}
            </select>

          </div>

          {/* Bulk Action Bar */}
          {selected.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm font-medium text-blue-700">
                {selected.length} {t("selected")}
              </span>
              <div className="flex gap-2">

                <button
                  onClick={() => {
                    setDeleteTarget("bulk");
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                >
                  {t("delete")}
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  {t("clear")}
                </button>
              </div>
            </div>
          )}

          {/* Cards */}
          {sortedTests.length === 0 ? (
            <div className="text-center py-12 col-span-full">
              <FiBookOpen className="text-gray-300 mx-auto mb-4 w-12 h-12" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("noTestsFound")}
              </h3>
              <p className="text-gray-500 mb-4">
                {t("tryAdjustingFilters")}
              </p>
              <button
                onClick={() => setShowCreateTest(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus />
                <span>{t("createNewTest")}</span>
              </button>
            </div>
          ) : (
            
            <>
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg"
              }
            >
              {pagination.paginatedData.map((test) =>
                view === "grid" ? (
                  <GridCard
                    key={test.id}
                    test={test}
                    selected={selected.includes(test.id)}
                    toggleSelect={toggleSelect}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onDelete={() => {
                      setDeleteTarget(test.id);
                      setDeleteTargetName(test.title);
                      setShowDeleteModal(true);
                    }}
                    t={t}
                  />
                ) : (
                  <ListCard
                    key={test.id}
                    test={test}
                    selected={selected.includes(test.id)}
                    toggleSelect={toggleSelect}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                    onDelete={() => {
                      setDeleteTarget(test.id);
                      setDeleteTargetName(test.title);
                      setShowDeleteModal(true);
                    }}
                  />
                )
              )}
            </div>
            
            {/* Pagination Controls */}
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={pagination.goToPage}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
            />
          </>
            
          )}

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-lg font-semibold mb-2">{t("confirmDelete")}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {deleteTarget === "bulk" ? (
                    <>
                      {t("areYouSureDelete")} {t("selected")} {t("tests")}:{" "}
                      <span className="font-bold">
                        {selected
                          .map((id) => tests.find((t) => t.id === id)?.title)
                          .join(", ")}
                      </span>
                      ?
                    </>
                  ) : (
                    <>
                      {t("areYouSureDelete")} {t("test")}:{" "}
                      <span className="font-bold">{deleteTargetName}</span>?
                    </>
                  )}
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteTarget(null);
                      setDeleteTargetName("");
                    }}
                    className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`px-3 py-1 rounded-lg text-white transition ${
                      isDeleting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isDeleting ? t('deleting') : t('delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ---------- GRID CARD ---------- */
const GridCard = ({
  test,
  selected,
  toggleSelect,
  onPreview,
  onEdit,
  onDelete,
  t,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group relative">
    <div className="p-6">
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => toggleSelect(test.id)}
          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
        />
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
          {test.title}
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">{test.description}</p>
      <p className="flex items-center text-sm text-gray-500 mb-1">
        <FiBookOpen className="mr-2 text-gray-400" />
        {t("category")}: {test.category}
      </p>
      <p className="flex items-center text-sm text-gray-500 mb-4">
        <FiUser className="mr-2 text-gray-400" />
        {t("creator")}: {test.creator}
      </p>

      {/* Languages / Tag section */}
      <div className="flex items-center mb-4">
        <FiTag className="text-gray-400 mr-2" />
        <div className="flex flex-wrap gap-1">
          {Array.isArray(test.languages) &&
            test.languages.map((lang) => (
              <span
                key={lang}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                {lang}
              </span>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-4 text-sm">
        <Stat
          icon={<FiClock />}
          label={t('minutes')}
          value={
            <span className="text-xs whitespace-nowrap">{test.duration}</span>
          }
          color="blue"
        />
        <Stat
          icon={<FiBookOpen />}
          label={t('questions')}
          value={
            <span className="text-xs whitespace-nowrap">{test.questions}</span>
          }
          color="green"
        />
        <Stat
          icon={<FiCalendar />}
          label={t('createdAt')}
          value={
            <span className="text-xs whitespace-nowrap">
              {test.createdDate}
            </span>
          }
          color="purple"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Tag text={test.status} color="green" />
        <Tag text={test.difficulty} color="yellow" />
        <Tag text={test.category} color="blue" />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm">
          <button
            onClick={() => onPreview(test)}
            className="flex items-center text-blue-600 hover:underline"
          >
            <FiEye className="mr-1" />
          </button>
          <button
            onClick={() => onEdit(test)}
            className="flex items-center text-blue-600 hover:underline"
          >
            <FiEdit className="mr-1" />
          </button>
        </div>
        <div className="flex space-x-2">
          {/* <IconBtn icon={<FiCopy />} />
          <IconBtn icon={<FiArchive />} /> */}
          <IconBtn icon={<FiTrash2 />} color="red" onClick={onDelete} />
        </div>
      </div>
    </div>
  </div>
);

/* ---------- LIST CARD ---------- */
const ListCard = ({
  test,
  selected,
  toggleSelect,
  onPreview,
  onEdit,
  onDelete,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-gray-100 mb-2 gap-3">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => toggleSelect(test.id)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
      />
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{test.title}</h3>
        <p className="text-sm text-gray-500 truncate">{test.category}</p>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
      <p className="text-sm text-gray-700 truncate">{test.creator}</p>
      <div className="flex items-center gap-1">
        {/* <Tag
          text={test.difficulty}
          color={
            String(test.difficulty).toLowerCase() === "hard" ? "red" : "yellow"
          }
        />
        <Tag text={test.type} color="blue" /> */}
        <Tag text={test.status} color="green" />
        <Tag text={test.difficulty} color="yellow" />
        <Tag text={test.category} color="blue" />
      </div>
    </div>

    <div className="flex items-center gap-4 flex-1 justify-center min-w-0 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <FiClock /> {test.duration}m
      </div>
      <div className="flex items-center gap-1">
        <FiBookOpen /> {test.questions}q
      </div>
    </div>

    <div className="flex items-center gap-3">
      <button
        onClick={() => onPreview(test)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <FiEye />
      </button>
      <button
        onClick={() => onEdit(test)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <FiEdit />
      </button>
      {/* <IconBtn icon={<FiUser />} /> */}
      <IconBtn icon={<FiTrash2 />} color="red" onClick={onDelete} />
    </div>
  </div>
);

/* ---------- SMALL UI PRIMITIVES ---------- */
const Stat = ({ icon, label, value, color }) => {
  const bgColorClass =
    color === "blue"
      ? "bg-blue-50"
      : color === "green"
      ? "bg-green-50"
      : color === "purple"
      ? "bg-purple-50"
      : "bg-gray-50";
  const textColorClass =
    color === "blue"
      ? "text-blue-600"
      : color === "green"
      ? "text-green-600"
      : color === "purple"
      ? "text-purple-600"
      : "text-gray-600";
  const labelColorClass =
    color === "blue"
      ? "text-blue-700"
      : color === "green"
      ? "text-green-700"
      : color === "purple"
      ? "text-purple-700"
      : "text-gray-700";

  return (
    <div className={`p-3 rounded-lg ${bgColorClass}`}>
      <div
        className={`flex items-center justify-center ${textColorClass} mb-1`}
      >
        {icon}
        <span className="ml-1 font-medium text-sm text-gray-900">{value}</span>
      </div>
      <span className={`text-xs ${labelColorClass}`}>{label}</span>
    </div>
  );
};

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
      : color === "orange"
      ? "bg-orange-100"
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
      : color === "orange"
      ? "text-orange-800"
      : "text-gray-800";

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${bgColorClass} ${textColorClass}`}
    >
      {text}
    </span>
  );
};

const IconBtn = ({ icon, color = "gray", onClick }) => {
  const textColorClass =
    color === "blue"
      ? "text-blue-400"
      : color === "green"
      ? "text-green-400"
      : color === "yellow"
      ? "text-yellow-400"
      : color === "red"
      ? "text-red-400"
      : color === "gray"
      ? "text-gray-400"
      : "text-gray-400";
  const hoverTextColorClass =
    color === "blue"
      ? "hover:text-blue-600"
      : color === "green"
      ? "hover:text-green-600"
      : color === "yellow"
      ? "hover:text-yellow-600"
      : color === "red"
      ? "hover:text-red-600"
      : color === "gray"
      ? "hover:text-gray-600"
      : "hover:text-gray-600";
  const hoverBgColorClass =
    color === "blue"
      ? "hover:bg-blue-50"
      : color === "green"
      ? "hover:bg-green-50"
      : color === "yellow"
      ? "hover:bg-yellow-50"
      : color === "red"
      ? "hover:bg-red-50"
      : color === "gray"
      ? "hover:bg-gray-50"
      : "hover:bg-gray-50";

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${textColorClass} ${hoverTextColorClass} ${hoverBgColorClass}`}
    >
      {icon}
    </button>
  );
};
export default TestLibrary;

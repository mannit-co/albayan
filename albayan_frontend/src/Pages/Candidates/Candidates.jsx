import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { uid, BaseUrl } from "../../Api/Api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaUsers,
  FaUserPlus,
  FaEnvelope,
  FaFileAlt,
  FaTimes,
  FaExclamationTriangle,
  FaFileExcel,
  FaSearch,
  FaUpload,
  FaPlus,
  FaDownload,
  FaThLarge,
  FaList,
  FaFile,
} from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { Toaster, toast } from "react-hot-toast";
import { ImportCandidatesModal } from "../Candidates/ImportCandidateModal";
import { EditCandidateModal } from "../Candidates/EditCandidateModal";
import { ViewCandidateModal } from "../Candidates/ViewCandidateModal";
import { DeleteCandidateModal } from "../Candidates/DeleteCandidateModal";
import { SendInvitesModal } from "../Candidates/SendInvitationModal";
import { AssignTestsModal } from "../Candidates/AssignTestModal";
import CandidateList from "../Candidates/CandidateList";
import { AddCandidateModal } from "../Candidates/AddCandidateModal";
const Candidates = () => {
  const { t, currentLanguage } = useLanguage();
  const [viewType, setViewType] = useState("grid");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false); // NEW: for modal
  const [showImportForm, setShowImportForm] = useState(false); // NEW state for import modal
  const [sendInvites, setSendInvites] = useState(false); // NEW state for import modal
  const [showEditForm, setShowEditForm] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCandidate, setViewCandidate] = useState(null);
  const [inviteCandidate, setInviteCandidate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [languages, setLanguages] = useState([]);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null); // 👈 store userId

  //  Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitedCount, setInvitedCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    preferredLanguage: "", // NEW
    role: "",
    skills: "",
  });

  // Removed pageSize state - using pagination component instead

  const [availableTests, setAvailableTests] = useState([]);
  const fetchAvailableTests = async () => {
    if (!token || !userId) return;
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
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );

        const data = await response.json();

        if (data?.source && Array.isArray(data.source)) {
          allData = allData.concat(data.source);

          // If less than limit returned → no more pages
          if (data.source.length < limit) {
            break;
          }
        } else {
          break;
        }

        page++;
      }

      setAvailableTests(normalizeTests(allData));
    } catch (error) {
      console.error("Error fetching available tests:", error);
      setAvailableTests([]);
    }
  };


  const normalizeTests = (tests) => {
    return tests.map((item) => {
      const parsed = typeof item === "string" ? JSON.parse(item) : item;
      return {
        ...parsed, // keep ALL original fields intact
        id: parsed._id?.$oid || parsed._id || "", // Ensure there's a unique key
        title: parsed.title || "Untitled Test",
        difficulty: parsed.difficulty || "Medium",
        duration: parsed.duration || 60,
      };
    });
  };

  //  Call fetch when token is available
  useEffect(() => {
    if (token) {
      fetchAvailableTests();
    }
  }, [token]);

  //  Extract token once when component mounts
  useEffect(() => {
    const storedData = sessionStorage.getItem("loginResponse");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.source) {
        const sourceObj = JSON.parse(parsedData.source);
        setToken(sourceObj.token);
        setUserId(sourceObj._id?.$oid || sourceObj._id || null); // 👈 store userId
      }
    }
  }, []);

  const fetchCandidates = async () => {
    if (!token || !userId) return;
    try {
      setLoading(true);

      let allData = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?distinct_field=email&ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
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
        if (data?.source && Array.isArray(data.source)) {
          allData = allData.concat(data.source);

          if (data.source.length < limit) break; // stop if fewer results
        } else {
          break;
        }
        page++;
      }

      setCandidates(normalizeCandidates(allData));
    } catch (err) {
      setError("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  // Fetch invited count using distinct_field API
  const fetchInvitedCount = async () => {
    if (!token || !userId) return;
    try {
      const response = await fetch(
        `${BaseUrl}/auth/retrievecollection?distinct_field=inviteStatus&ColName=${uid}_Candidates`,
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
      if (data?.source && Array.isArray(data.source)) {
        // Count candidates with inviteStatus = "invited"
        const invitedCandidates = data.source.filter((item) => {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          return parsed.inviteStatus === "invited";
        });
        setInvitedCount(invitedCandidates.length);
      }
    } catch (err) {
      console.error("Failed to fetch invited count:", err);
    }
  };

  // Fetch assigned count using distinct_field API
  const fetchAssignedCount = async () => {
    if (!token || !userId) return;
    try {
      const response = await fetch(
        `${BaseUrl}/auth/retrievecollection?distinct_field=assigned&ColName=${uid}_Candidates`,
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
      if (data?.source && Array.isArray(data.source)) {
        // Sum all assigned values from the response
        const totalAssigned = data.source.reduce((sum, item) => {
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          const assignedValue = parsed.assigned || 0;
          return sum + assignedValue;
        }, 0);
        setAssignedCount(totalAssigned);
      }
    } catch (err) {
      console.error("Failed to fetch assigned count:", err);
    }
  };

  useEffect(() => {
    if (token && userId) {
      fetchCandidates();
      fetchInvitedCount();
      fetchAssignedCount();
    }
  }, [token, userId]);

  const normalizeCandidates = (data) => {
    const candidates = data.map((item) => {
      const parsed = typeof item === "string" ? JSON.parse(item) : item;

      let formattedDate = "";
      let createdAt = null;
      if (parsed.created && parsed.created.$date) {
        const dateObj = new Date(parsed.created.$date);
        createdAt = dateObj; // keep actual date for sorting
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = String(dateObj.getFullYear()).slice(-2);
        formattedDate = `${day}-${month}-${year}`;
      }

      return {
        id: parsed._id?.$oid || "",
        name: parsed.name || "Unknown",
        role: parsed.role || "N/A",
        email: parsed.email || "",
        phone: parsed.phone || "",
        status: parsed.status,
        statusColor: getStatusColor(parsed.status || "N/A"),
        completed: parsed.completed ?? 0,
        assigned: parsed.assigned ?? 0,
        score: parsed.score || "0%",
        skills: Array.isArray(parsed.skills)
          ? parsed.skills
          : typeof parsed.skills === "string"
            ? parsed.skills.split(",").map((s) => s.trim())
            : [],
        preferredLanguage: parsed.preferredLanguage || "English",
        inviteStatus: parsed.inviteStatus ?? 0,
        date: formattedDate,
        createdAt, // keep raw date for sorting
        scheduledDate: parsed.scheduledDate
          ? new Date(parsed.scheduledDate.$date || parsed.scheduledDate)
          : null,
        scheduledDateStr:
          parsed.scheduledDate && (parsed.scheduledDate.$date || parsed.scheduledDate)
            ? (() => {
              const dateObj = new Date(
                parsed.scheduledDate.$date || parsed.scheduledDate
              );
              const day = String(dateObj.getDate()).padStart(2, "0");
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const year = String(dateObj.getFullYear()).slice(-2);
              return `${day}-${month}-${year}`;
            })()
            : "",

        assignedTests: parsed.asnT || [], // keep assigned test info (title, qnC, etc.)
      };
    });

    // 🔥 Always sort by createdAt DESC (latest first)
    return candidates.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Registered":
        return "bg-blue-100 text-blue-700";
      case "Invited":
        return "bg-yellow-100 text-yellow-700";
      case "Failed":
        return "bg-red-100 text-red-700";
      case "Plagiarism":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusCounts = {
    all: candidates.length,
    registered: candidates.filter((c) => c.status === "Registered").length,
    invited: invitedCount, // Use API count from line 195
    assigned: assignedCount, // Use API count from line 225
    failed: candidates.filter((c) => c.status === "Failed").length,
    plagiarism: candidates.filter((c) => c.status === "Plagiarism").length,
  };

  const statusCards = [
    {
      title: t("all", "All"),
      count: statusCounts.all,
      active: true,
      icon: FaUsers,
    },
    {
      title: t("registered", "Registered"),
      count: statusCounts.registered,
      active: true,
      icon: FaUserPlus,
    },
    {
      title: t("invited", "Invited"),
      count: statusCounts.invited,
      active: true,
      icon: FaEnvelope,
    },
    {
      title: t("assigned", "Assigned"),
      count: statusCounts.assigned,
      active: true,
      icon: FaFileAlt,
    },
    {
      title: t("failed", "Failed"),
      count: statusCounts.failed,
      active: true,
      icon: FaTimes,
    },
    {
      title: t("plagiarism", "Plagiarism"),
      count: statusCounts.plagiarism,
      active: true,
      icon: FaExclamationTriangle,
    },
  ];
  useEffect(() => {
    if (showAddForm) {
      const fetchLanguages = async () => {
        try {
          const response = await fetch(`${BaseUrl}/redcombo?collname=LAN`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              xxxid: uid, //  Custom header
            },
          });
          const data = await response.json();
          console.log("API Response:", data);

          if (data?.source?.AL) {
            const languagesArray = Object.values(data.source.AL);
            setLanguages(languagesArray);
            console.log("Languages:", languagesArray);
          }
        } catch (error) {
          console.error("Error fetching languages:", error);
        }
      };
      fetchLanguages();
    }
  }, [showAddForm]);

  useEffect(() => {
    if (
      showAddForm ||
      showImportForm ||
      showEditForm ||
      showDeleteModal ||
      showViewModal ||
      sendInvites ||
      assignModalOpen
    ) {
      document.body.style.overflow = "hidden"; // disable scroll
    } else {
      document.body.style.overflow = "auto"; // enable scroll
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [
    showAddForm,
    showImportForm,
    showEditForm,
    showDeleteModal,
    showViewModal,
    sendInvites,
    assignModalOpen,
  ]);
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCandidates(candidates.map((c) => c.id)); //  Use IDs instead of index
    } else {
      setSelectedCandidates([]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter((i) => i !== id));
    } else {
      setSelectedCandidates([...selectedCandidates, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("No candidates selected");
      return;
    }

    setIsDeleting(true);

    try {
      for (const id of selectedCandidates) {
        const response = await fetch(
          `${BaseUrl}/auth/eDeleteWCol?resourceId=${id}&ColName=${uid}_Candidates`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(`Failed to delete candidate with id ${id}:`, data);
        }
      }

      //  Remove from UI
      setCandidates((prev) =>
        prev.filter((candidate) => !selectedCandidates.includes(candidate.id))
      );

      toast.success(t("candidatesDeletedSuccessfully"));
      setSelectedCandidates([]); //  Clear selection
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error(t("errorDeletingCandidates"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Add Candidate form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCandidate((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Save button click (you can extend to actually save)
  const handleSaveCandidate = () => {
    console.log("New Candidate:", newCandidate);
    setShowAddForm(false);
    setNewCandidate({
      name: "",
      email: "",
      phone: "",
      role: "",
      skills: "",
      preferredLanguage: "",
    }); // reset
  };
  const handleDeleteCandidate = async () => {
    if (!candidateToDelete || !candidateToDelete.id) {
      toast.error("Invalid candidate selected");
      return;
    }

    setIsDeleting(true); //  Start loading

    try {
      const response = await fetch(
        `${BaseUrl}/auth/eDeleteWCol?resourceId=${candidateToDelete.id}&ColName=${uid}_Candidates`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`, //  Use already available token
            "Content-Type": "application/json",
            xxxid: uid,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(t("Candidatedeletedsuccessfully"));

        //  Remove from UI
        setCandidates((prev) =>
          prev.filter((c) => c.id !== candidateToDelete.id)
        );

        //  Close modal
        setCandidateToDelete(null);
        setShowDeleteModal(false);
      } else {
        toast.error(data.message || "Failed to delete candidate");
      }
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false); //  Stop loading
    }
  };
  const handleUpdateCandidate = async (updatedCandidate) => {
    if (!token) {
      console.error("Token missing");
      return false;
    }

    try {
      const originalCandidate = candidates.find(
        (c) => c.id === updatedCandidate.id
      );
      if (!originalCandidate) return false;

      const payload = {};
      for (const key in updatedCandidate) {
        if (updatedCandidate[key] !== originalCandidate[key] && key !== "id") {
          payload[key] = updatedCandidate[key];
        }
      }

      if (Object.keys(payload).length === 0) {
        console.log("No changes detected");
        return false;
      }

      //  Add updatedAt field with ISO date
      const today = new Date();
      payload.updatedAt = { $date: today.toISOString() };
      const resourceId = updatedCandidate.id;

      const response = await fetch(
        `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_Candidates&resourceId=${resourceId}`,
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

      const result = await response.json();
      if (response.ok) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === updatedCandidate.id ? { ...c, ...payload } : c
          )
        );
        return true;
      } else {
        console.error("Update failed:", result);
        return false;
      }
    } catch (error) {
      console.error("Error updating candidate:", error);
      return false;
    }
  };

  const handleAssignTests = (updatedCandidate) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.email === updatedCandidate.email ? updatedCandidate : c
      )
    );
  };
  // const filteredCandidates = candidates.filter(
  //   (candidate) =>
  //     candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  // Step 1: Search
  const searchedCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Step 2: Pass all filtered candidates to pagination component
  const paginatedCandidates = searchedCandidates;


  const handleExportSelected = () => {
    if (selectedCandidates.length === 0) {
      toast.error("No candidates selected for export");
      return;
    }

    //  Filter selected candidates
    const filteredCandidates = candidates.filter((candidate) =>
      selectedCandidates.includes(candidate.id)
    );

    //  Determine if we should include extra columns (any candidate has > 0 value)
    const includeCompleted = filteredCandidates.some((c) => c.completed > 0);
    const includeAssigned = filteredCandidates.some((c) => c.assigned > 0);
    const includeScore = filteredCandidates.some((c) => c.score > 0);

    //  Prepare export data
    const exportData = filteredCandidates.map((candidate) => {
      //  Derive Country Code from phone if length is 12
      let countryCode = "";
      if (candidate.phone && candidate.phone.length === 12) {
        countryCode = candidate.phone.substring(0, 2);
      }

      const data = {
        Name: candidate.name,
        Email: candidate.email,
        Phone: candidate.phone,
        CountryCode: countryCode, //  Derived dynamically
        Role: candidate.role,
        Status: candidate.status,
        Skills: Array.isArray(candidate.skills)
          ? candidate.skills.join(", ")
          : candidate.skills,
        PreferredLanguage: candidate.preferredLanguage,
        Date: candidate.date,
      };

      //  Add conditional columns if global include is true, and value > 0 for this candidate
      if (includeCompleted) {
        data.Completed = candidate.completed > 0 ? candidate.completed : "";
      }
      if (includeAssigned) {
        data.Assigned = candidate.assigned > 0 ? candidate.assigned : "";
      }
      if (includeScore) {
        data["Avg Score"] = candidate.score > 0 ? candidate.score : "";
      }

      return data;
    });

    //  Convert to Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Candidates");

    //  Export the file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(
      blob,
      `Selected_Candidates_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const allSelected = selectedCandidates.length === paginatedCandidates.length;

  return (
    <div className="mb-8 pl-2 pr-0 sm:pl-4 sm:pr-2 lg:pl-2 lg:pr-4">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("candidateManagement", "Candidate Management")}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {t("manageCandidates", "Manage and track candidate progress")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <a
            href={currentLanguage === 'ar' ? "/arabic-candidates.xlsx" : "/sample-candidates.xlsx"}
            download
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
          >
            <FaFileExcel className="text-white" />
            <span>{t("sampleExcel", "Download Sample Excel")}</span>
          </a>
          <button
            className="flex items-center space-x-2 bg-red-400 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            onClick={() => setShowImportForm(true)} // NEW: open import modal
          >
            <FaUpload className="text-white" />
            <span>{t("importCandidates", "Import Candidates")}</span>
          </button>
          <button
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            onClick={() => setShowAddForm(true)} // NEW: open modal
          >
            <FaPlus />
            <span>{t("addNewCandidate", "Add New Candidate")}</span>
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        {statusCards.map((item, index) => (
          <div
            key={index}
            className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${item.active
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
              }`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <item.icon className="text-gray-700" />
              <span className="text-sm font-medium text-gray-700 capitalize truncate">
                {item.title}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-3">
          <div className="relative flex-1 max-w-full lg:max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchCandidates", "Search by name or email...")}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors text-sm sm:text-base 
    ${selectedCandidates.length === 0
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            onClick={handleExportSelected}
            disabled={selectedCandidates.length === 0}
          >
            <FaDownload />
            <span>{t("export", "Export")}</span>
          </button>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              className={`p-2 ${viewType === "grid"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-400"
                } hover:bg-gray-50 transition-colors`}
              onClick={() => setViewType("grid")}
            >
              <FaThLarge />
            </button>
            <button
              className={`p-2 ${viewType === "list"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-400"
                } hover:bg-gray-50 transition-colors`}
              onClick={() => setViewType("list")}
            >
              <FaList />
            </button>
          </div>


        </div>
      </div>

      {selectedCandidates.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 space-y-3 sm:space-y-0">
          {/* Left: Selected count */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-3">
            <span className="text-sm font-medium text-blue-900">
              {selectedCandidates.length}{" "}
              {selectedCandidates.length === 1
                ? t("candidate", "candidate")
                : t("candidates", "candidates")}{" "}
              {t("selected", "selected")}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            {/* Send Invites */}
            {/* <button
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              onClick={() => setSendInvites(true)}
            >
              <LuSend size={16} />
              <span>{t("sendInvites", "Send Invites")}</span>
            </button> */}

            {/* Remove */}
            <button
              className="px-3 py-1 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : t("remove", "Remove")}
            </button>

            {/* Clear Selection */}
            <button
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              onClick={() => setSelectedCandidates([])}
            >
              {t("clear", "Clear")}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-gray-500 text-center">
          {t("loadingcandidates")}
        </p>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {!loading && paginatedCandidates.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No candidates Available
        </div>
      )}

      {/* Candidate List/Grid */}
      <CandidateList
        viewType={viewType}
        setViewType={setViewType}
        filteredCandidates={paginatedCandidates} // ✅ Now works with search + pagination
        selectedCandidates={selectedCandidates}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        allSelected={allSelected}
        setViewCandidate={setViewCandidate}
        setShowViewModal={setShowViewModal}
        setEditCandidate={setEditCandidate}
        setShowEditForm={setShowEditForm}
        setCandidateToDelete={setCandidateToDelete}
        setShowDeleteModal={setShowDeleteModal}
        setSelectedCandidate={setSelectedCandidate}
        setAssignModalOpen={setAssignModalOpen}
        setInviteCandidate={setInviteCandidate}
        setSendInvites={setSendInvites}
      />

      {/* Modals */}
      <AddCandidateModal
        show={showAddForm}
        onClose={() => setShowAddForm(false)}
        existingCandidate={candidates}
        newCandidate={newCandidate}
        handleInputChange={handleInputChange}
        handleSaveCandidate={handleSaveCandidate}
        languages={languages}
        onSaveSuccess={() => {
          fetchCandidates(); //  refresh list after add
          fetchInvitedCount(); // refresh invited count
          fetchAssignedCount(); // refresh assigned count
        }}
      />

      <SendInvitesModal
        show={sendInvites}
        onClose={() => {
          setSendInvites(false);
          setInviteCandidate(null);
          setNewCandidate({
            name: "",
            email: "",
            phone: "",
            preferredLanguage: "",
            role: "",
            skills: "",
          });
        }}
        selectedCandidates={selectedCandidates}
        candidates={candidates}
        inviteCandidate={inviteCandidate}
        clearSelectedCandidates={() => setSelectedCandidates([])}
        setCandidates={setCandidates}   // 👈 pass setter
      />
      <ImportCandidatesModal
        show={showImportForm}
        onClose={() => setShowImportForm(false)}
        onImportSuccess={() => {
          fetchCandidates();
          fetchInvitedCount();
          fetchAssignedCount();
        }}
        existingCandidate={candidates}
      />
      <EditCandidateModal
        show={showEditForm}
        onClose={() => setShowEditForm(false)}
        candidate={editCandidate}
        handleUpdateCandidate={handleUpdateCandidate}
      />
      <DeleteCandidateModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteCandidate}
        candidateName={candidateToDelete?.name}
      />
      <AssignTestsModal
        show={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        candidate={selectedCandidate}
        tests={availableTests}
        onAssign={handleAssignTests}
        onSaveSuccess={() => {
          fetchCandidates(); //  refresh list after add
          fetchInvitedCount(); // refresh invited count
          fetchAssignedCount(); // refresh assigned count
        }}

      />
      <ViewCandidateModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        candidate={viewCandidate}


      />
    </div>
  );
};

export default Candidates;

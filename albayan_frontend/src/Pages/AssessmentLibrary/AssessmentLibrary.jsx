import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { BaseUrl, uid } from "../../Api/Api";
import { toast, Toaster } from "react-hot-toast";
import AssessmentList from "./AssessmentList";
import {
  FaUsers,
  FaBookOpen,
  FaCheck,
  FaUser,
  FaClipboardList,
  FaClock,
  FaSearch,
  FaQuestionCircle,
  FaChevronRight,
} from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";

const AssessmentLibrary = () => {
  const { t } = useLanguage();
  const [selectedFlow, setSelectedFlow] = useState("candidates"); // "candidates" or "tests"
  const [step, setStep] = useState(1); // 1: select candidates/tests, 2: select tests/candidates
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userRole, setUserRole] = useState(null);

  // Data states
  const [candidates, setCandidates] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editableDuration, setEditableDuration] = useState("");
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] =
    useState(null);
  const [showAssessmentList, setShowAssessmentList] = useState(true);

  // Search and pagination states
  const [candidateSearch, setCandidateSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const [candidatesPage, setCandidatesPage] = useState(1);
  const [testsPage, setTestsPage] = useState(1);
  const itemsPerPage = 10;

  // Ref to prevent double loading in development mode
  const hasFetchedRef = useRef(false);

  // Function to generate unique test ID
  const generateUniqueTestId = () => {
    return Math.random().toString(36).substr(2, 12);
  };

  // Extract token and userId from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem("loginResponse");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.source) {
        const sourceObj = JSON.parse(parsedData.source);
        setToken(sourceObj.token);
        setUserId(sourceObj._id?.$oid || sourceObj._id || null);
        // ✅ Extract firstName, lastName, and role
        setFirstName(sourceObj.firstName || "");
        setLastName(sourceObj.lastName || "");
        setUserRole(sourceObj.role || null);

        console.log("Login Response:", parsedData)
        console.log("User Role:", sourceObj.role)
        console.log("FirstName", "Last Name", sourceObj.firstName, sourceObj.lastName)
      }
    }
  }, []);

  // Fetch candidates
  const fetchCandidates = async () => {
    if (!token || !userId) return;

    try {
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
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      const normalizedCandidates = allData.map((item) => {
        const parsed = typeof item === "string" ? JSON.parse(item) : item;
        return {
          id: parsed._id?.$oid || parsed._id || "",
          name: parsed.name || "Unknown",
          email: parsed.email || "",
          role: parsed.role || "N/A",
          status: parsed.status || "N/A",
          phone: parsed.phone || "",
          countryCode: parsed.countryCode || "",
          country: parsed.country || "",
          preferredLanguage: parsed.preferredLanguage || "",
          skills: parsed.skills || [],
          created: parsed.created,
          userId: parsed.userId,
        };
      });
      console.log("Normalized Candidates:", normalizedCandidates);
      setCandidates(normalizedCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast.error(`${t("failedtoloadcandidates")}`);
      throw error; // Re-throw to handle in the combined function
    }
  };

  // Fetch tests
  const fetchTests = async () => {
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
        console.log("Fetched Tests Data:", data); // Debug log
        if (data?.source && Array.isArray(data.source)) {
          allData = allData.concat(data.source);
          if (data.source.length < limit) break;
        } else {
          break;
        }
        page++;
      }

      const normalizedTests = allData.map((item) => {
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
          qs: parsed.qs || [], // Keep the full questions array
          hrname: parsed.hrname || [], // Keep the hrname array for filtering
        };
      });

      // Filter tests based on user role
      let filteredTests = normalizedTests;
      
      // If user role is "3" (HR), filter tests assigned to this HR
      if (userRole === "3" || userRole === 3) {
        const currentHRName = `${firstName} ${lastName}`;
        console.log("Current HR Name for filtering:", currentHRName);
        
        filteredTests = normalizedTests.filter(test => {
          // Check if hrname exists and contains the current HR's name
          if (test.hrname && Array.isArray(test.hrname)) {
            const isAssignedToHR = test.hrname.includes(currentHRName);
            console.log(`Test "${test.title}" - HR Names:`, test.hrname, "Assigned to current HR:", isAssignedToHR);
            return isAssignedToHR;
          }
          // If no hrname field, don't show the test for HR users
          console.log(`Test "${test.title}" - No hrname field, hiding from HR`);
          return false;
        });
        
        console.log(`Filtered ${filteredTests.length} tests for HR: ${currentHRName}`);
      } else {
        console.log("User is not HR (role 3), showing all tests");
      }

      setTests(filteredTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error(`${t("failedtoloadtest")}`);
      throw error; // Re-throw to handle in the combined function
    }
  };

  // Combined function to fetch all data with single loading state
  const fetchAllData = async () => {
    if (!token || !userId) return;

    setLoading(true);
    try {
      // Fetch both candidates and tests concurrently
      await Promise.all([fetchCandidates(), fetchTests()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Individual error messages are already shown in respective functions
    } finally {
      setLoading(false);
    }
  };

  // Load data when token is available
  useEffect(() => {
    if (token && userId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAllData();
    }

    // Reset ref if token/userId changes
    return () => {
      if (!token || !userId) {
        hasFetchedRef.current = false;
      }
    };
  }, [token, userId, userRole, firstName, lastName]); // Added userRole, firstName, lastName to dependencies

  // Reset form data when component mounts or when showAssessmentList changes
  useEffect(() => {
    if (!showAssessmentList) {
      // Only reset when coming back to create assessment mode
      resetAllFormData();
    }
  }, [showAssessmentList]);

  // Handle candidate selection (multiple)
  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Handle test selection (single) and set default duration
  const handleTestSelection = (testId) => {
    setSelectedTest(testId);

    const test = tests.find((t) => t.id === testId);
    console.log("Selected Test for Duration:", test);
    if (test) {
      setEditableDuration(test.duration.toString());
    }
  };

  // Handle multiple test selection for Tests → Select Candidates flow
  const toggleTestSelection = (testId) => {
    setSelectedTests((prev) => {
      const newSelection = prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId];

      // Update editable duration when tests change
      if (newSelection.length > 0) {
        const selectedTestsList = tests.filter((t) =>
          newSelection.includes(t.id)
        );
        const totalDuration = selectedTestsList.reduce(
          (sum, test) => sum + (test.duration || 0),
          0
        );
        setEditableDuration(totalDuration.toString());
      } else {
        setEditableDuration("");
      }

      return newSelection;
    });
  };

  // Create assessment
  const createAssessment = async () => {
    // Check validation - both flows now use multiple tests
    if (selectedTests.length === 0 || selectedCandidates.length === 0) {
      toast.error(`${t("pleaseselectbothtestandcandidates")}`);
      return;
    }

    // Show schedule modal before creating assessment
    setShowScheduleModal(true);
  };

  // Handle actual assessment creation after scheduling
  const handleCreateAssessment = async () => {
    if (!scheduledDate) {
      toast.error("Please schedule a date before creating the assessment!");
      return;
    }

    if (!expiryDate) {
      toast.error("Please select an expiry date for the assessment!");
      return;
    }

    setLoading(true);
    try {
      const today = new Date();
      const selectedCandidatesList = candidates.filter((c) =>
        selectedCandidates.includes(c.id)
      );

      // Both flows now use multiple tests
      const selectedTestsList = tests.filter((t) =>
        selectedTests.includes(t.id)
      );

      if (selectedTestsList.length === 0) {
        toast.error("Selected tests not found");
        return;
      }

      // Create assessment records for each candidate with all selected tests
      let totalCreatedAssessments = 0;

      for (const candidate of selectedCandidatesList) {
        // Check if candidate already exists by email and find the exact record
        const existingCandidateResponse = await fetch(
          `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&distinct_field=email&email=${encodeURIComponent(
            candidate.email
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              xxxid: uid,
            },
          }
        );

        let existingCandidate = null;
        if (existingCandidateResponse.ok) {
          const existingData = await existingCandidateResponse.json();
          if (existingData?.source && existingData.source.length > 0) {
            // Find the exact candidate by ID to ensure we're working with the right record
            const candidateData = existingData.source.find((item) => {
              const parsed = typeof item === "string" ? JSON.parse(item) : item;
              return (parsed._id?.$oid || parsed._id) === candidate.id;
            });

            if (candidateData) {
              existingCandidate =
                typeof candidateData === "string"
                  ? JSON.parse(candidateData)
                  : candidateData;
            }
          }
        }

        // Prepare all tests for this candidate
        const asnTArray = selectedTestsList.map((test) => ({
          tid: test.tid || test.id,
          title: test.title, // Store test name, not assessment name
          qnC: test.questions,
          dur: test.duration,
          qns: test.qs ? test.qs.map((q) => q.id) : [],
        }));

        if (
          existingCandidate &&
          existingCandidate.asnT &&
          Array.isArray(existingCandidate.asnT) &&
          existingCandidate.asnT.length > 0
        ) {
          // Candidate already has tests - create a new document instead of updating
          const newCandidatePayload = {
            // Copy all existing candidate data
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone || "",
            countryCode: candidate.countryCode || "",
            country: candidate.country || "",
            preferredLanguage: candidate.preferredLanguage || "",
            role: candidate.role,
            skills: candidate.skills || [],
            created: { $date: today.toISOString() },
            status: candidate.status || "Registered",
            completed: 0,
            assigned: selectedTestsList.length,
            score: "0%",
            userId: candidate.userId || { $oid: userId },
            sa: userId,
            // Assessment specific data
            assT: assessmentTitle, // Store assessment name separately
            asId: generateUniqueTestId(),
            TqnC: selectedTestsList.reduce(
              (acc, test) => acc + test.questions,
              0
            ),
            Tdur: editableDuration
              ? parseInt(editableDuration, 10)
              : selectedTestsList.reduce(
                  (acc, test) => acc + (test.duration || 0),
                  0
                ),
            scheduledDate: scheduledDate
              ? { $date: new Date(scheduledDate + "T00:00:00Z").toISOString() }
              : null,
            expiryDate: expiryDate
              ? { $date: new Date(expiryDate + "T23:59:59Z").toISOString() }
              : null,
            updatedAt: { $date: today.toISOString() },
            createdby: `${firstName} ${lastName}`,
            uniqueTestId: generateUniqueTestId(),
            asnT: asnTArray,
          };

          const response = await fetch(
            `${BaseUrl}/auth/eCreateCol?colname=${uid}_Candidates`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                xxxid: uid,
              },
              body: JSON.stringify(newCandidatePayload),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Failed to create new assessment for candidate ${
                candidate.name
              }: ${errorData.message || "Unknown error"}`
            );
          }
        } else {
          // Create new candidate record with all tests
          const assessmentPayload = {
            // Copy all existing candidate data
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone || "",
            countryCode: candidate.countryCode || "",
            country: candidate.country || "",
            preferredLanguage: candidate.preferredLanguage || "",
            role: candidate.role,
            skills: candidate.skills || [],
            created: candidate.created || { $date: today.toISOString() },
            status: candidate.status || "Registered",
            completed: 0,
            assigned: selectedTestsList.length,
            score: "0%",
            userId: candidate.userId || { $oid: userId },
            sa: userId,
            // Assessment specific data
            assT: assessmentTitle, // Store assessment name separately
            asId: generateUniqueTestId(),
            TqnC: selectedTestsList.reduce(
              (acc, test) => acc + test.questions,
              0
            ),
            Tdur: editableDuration
              ? parseInt(editableDuration, 10)
              : selectedTestsList.reduce(
                  (acc, test) => acc + (test.duration || 0),
                  0
                ),
            scheduledDate: scheduledDate
              ? { $date: new Date(scheduledDate + "T00:00:00Z").toISOString() }
              : null,
            expiryDate: expiryDate
              ? { $date: new Date(expiryDate + "T23:59:59Z").toISOString() }
              : null,
            updatedAt: { $date: today.toISOString() },
            createdby: `${firstName} ${lastName}`,
            uniqueTestId: generateUniqueTestId(),
            asnT: asnTArray,
          };

          // Create new candidate record using eCreateCol
          const response = await fetch(
            `${BaseUrl}/auth/eCreateCol?colname=${uid}_Candidates`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                xxxid: uid,
              },
              body: JSON.stringify(assessmentPayload),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Failed to create assessment for candidate ${candidate.name}: ${
                errorData.message || "Unknown error"
              }`
            );
          }
        }

        totalCreatedAssessments++;
      }

      toast.success(
        `${t("assessmentcreatedsucess")}! ${totalCreatedAssessments} ${
          totalCreatedAssessments > 1 ? "s" : ""
        } `
      );

      // Reset form
      setStep(1);
      setSelectedCandidates([]);
      setSelectedTest(null);
      setSelectedTests([]);
      setScheduledDate("");
      setExpiryDate("");
      setAssessmentTitle("");
      setShowScheduleModal(false);
      setEditableDuration("");
      // Redirect to Assessment List view
      setShowAssessmentList(true);
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast.error(`${t("failedtocreateassessment")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when changing flow
  const handleFlowChange = (flow) => {
    setSelectedFlow(flow);
    setStep(1);
    setSelectedCandidates([]);
    setSelectedTest(null);
    setSelectedTests([]);
    // Reset search and pagination
    setCandidateSearch("");
    setTestSearch("");
    setCandidatesPage(1);
    setTestsPage(1);
  };

  // Comprehensive reset function to clear all form data
  const resetAllFormData = () => {
    // Reset flow and step
    setSelectedFlow("candidates");
    setStep(1);

    // Reset selections
    setSelectedCandidates([]);
    setSelectedTest(null);
    setSelectedTests([]);

    // Reset search terms
    setCandidateSearch("");
    setTestSearch("");

    // Reset pagination
    setCandidatesPage(1);
    setTestsPage(1);

    // Reset schedule and modals
    setScheduledDate("");
    setAssessmentTitle("");
    setShowScheduleModal(false);
    setEditableDuration("");
    setShowQuestionsModal(false);
    setSelectedTestForQuestions(null);
  };

  // Filter and paginate candidates
  const getFilteredCandidates = () => {
    const filtered = candidates.filter(
      (candidate) =>
        candidate.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.role.toLowerCase().includes(candidateSearch.toLowerCase())
    );

    const startIndex = (candidatesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      items: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage),
    };
  };

  // Filter and paginate tests
  const getFilteredTests = () => {
    const filtered = tests.filter(
      (test) =>
        test.title.toLowerCase().includes(testSearch.toLowerCase()) ||
        test.description.toLowerCase().includes(testSearch.toLowerCase()) ||
        test.category.toLowerCase().includes(testSearch.toLowerCase()) ||
        test.difficulty.toLowerCase().includes(testSearch.toLowerCase())
    );

    // Reverse the order to show newest/last data first
    const reversedFiltered = [...filtered].reverse();

    const startIndex = (testsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      items: reversedFiltered.slice(startIndex, endIndex),
      total: reversedFiltered.length,
      totalPages: Math.ceil(reversedFiltered.length / itemsPerPage),
    };
  };

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Always show pagination, even if there's only 1 page or no data
    const displayTotalPages = totalPages || 1;
    const displayCurrentPage = currentPage || 1;

    return (
      <div className="flex items-center justify-center space-x-4 mt-6 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={() => onPageChange(displayCurrentPage - 1)}
          disabled={displayCurrentPage === 1 || displayTotalPages <= 1}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {t("previous")}
        </button>

        {/* Page info */}
        <span className="px-3 py-1 text-sm font-medium text-gray-700">
          {t("page", "Page")} {displayCurrentPage} {t("of", "of")}{" "}
          {displayTotalPages}
        </span>

        <button
          onClick={() => onPageChange(displayCurrentPage + 1)}
          disabled={
            displayCurrentPage === displayTotalPages || displayTotalPages <= 1
          }
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {t("next")}
        </button>
      </div>
    );
  };

  // Helper function to extract text from deeply nested objects
  const extractText = (obj) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    if (typeof obj !== "object") return String(obj);

    // If it has a text property, recursively extract from it
    if (obj.text) {
      return extractText(obj.text);
    }

    // If it's an object but no text property, try to stringify safely
    return "";
  };

  // Helper function to extract subtrait from deeply nested objects
  const extractSubtrait = (obj) => {
    if (!obj || typeof obj !== "object") return "";

    // If current level has subtrait, return it
    if (obj.subtrait) return obj.subtrait;

    // If it has a text property, recursively search in it
    if (obj.text && typeof obj.text === "object") {
      return extractSubtrait(obj.text);
    }

    return "";
  };

  const renderCandidatesList = () => {
    const {
      items: filteredCandidates,
      total,
      totalPages,
    } = getFilteredCandidates();

    return (
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex-1 max-w-md relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FaSearch className="text-sm" />
            </span>

            <input
              type="text"
              placeholder={t("searchcandidatesbynameemailorrole")}
              value={candidateSearch}
              onChange={(e) => {
                setCandidateSearch(e.target.value);
                setCandidatesPage(1); // Reset to first page on search
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-gray-600">
            {t("Showing")} {filteredCandidates.length} {t("of")} {total}{" "}
            {t("candidates")}
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-2">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`p-2.5 sm:p-3 border rounded-md cursor-pointer transition-all ${
                selectedCandidates.includes(candidate.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => toggleCandidateSelection(candidate.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded flex-shrink-0 ${
                      selectedCandidates.includes(candidate.id)
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    } flex items-center justify-center`}
                  >
                    {selectedCandidates.includes(candidate.id) && (
                      <FaCheck className="text-white text-xs" />
                    )}
                  </div>
                  <FaUser className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {candidate.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {candidate.email}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {candidate.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredCandidates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaUser className="mx-auto text-4xl mb-2" />
            <p className="text-lg">No candidates found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={candidatesPage}
          totalPages={totalPages}
          onPageChange={setCandidatesPage}
        />
      </div>
    );
  };

  const renderTestsList = () => {
    const { items: filteredTests, total, totalPages } = getFilteredTests();

    return (
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex-1 max-w-md relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FaSearch className="text-sm" />
            </span>

            <input
              type="text"
              placeholder={t("searchTestByTitledescription")}
              value={testSearch}
              onChange={(e) => {
                setTestSearch(e.target.value);
                setTestsPage(1); // Reset to first page on search
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-gray-600">
            {t("Showing")} {filteredTests.length} {t("of")} {total} {t("tests")}
          </div>
        </div>

        {/* Tests List */}
        <div className="space-y-2">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className={`p-2.5 sm:p-3 border rounded-md transition-all ${
                selectedTest === test.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-2 sm:space-x-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => handleTestSelection(test.id)}
                >
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded-full flex-shrink-0 ${
                      selectedTest === test.id
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    } flex items-center justify-center`}
                  >
                    {selectedTest === test.id && (
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <FaBookOpen className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {test.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {test.description}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-1">
                      <FaClock className="text-xs" />
                      <span>{test.duration}m</span>
                    </div>
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTestForQuestions(test);
                        setShowQuestionsModal(true);
                      }}
                      title="Click to view questions"
                    >
                      <FaQuestionCircle className="text-xs" />
                      <span className="underline">{test.questions}Q</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 block mt-1">
                    {test.difficulty}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredTests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaBookOpen className="mx-auto text-4xl mb-2" />
            <p className="text-lg">No tests found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={testsPage}
          totalPages={totalPages}
          onPageChange={setTestsPage}
        />
      </div>
    );
  };

  // Render tests list with multiple selection (for Tests → Select Candidates flow)
  const renderTestsListMultiple = () => {
    const { items: filteredTests, total, totalPages } = getFilteredTests();

    return (
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex-1 max-w-md relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <FaSearch className="text-sm" />
            </span>

            <input
              type="text"
              placeholder={t("searchTestByTitledescription")}
              value={testSearch}
              onChange={(e) => {
                setTestSearch(e.target.value);
                setTestsPage(1); // Reset to first page on search
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-gray-600">
            {t("Showing")} {filteredTests.length} {t("of")} {total} {t("tests")}
          </div>
        </div>

        {/* Tests List */}
        <div className="space-y-2">
          {[...filteredTests].map((test) => (
            <div
              key={test.id}
              className={`p-2.5 sm:p-3 border rounded-md cursor-pointer transition-all ${
                selectedTests.includes(test.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => toggleTestSelection(test.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded flex-shrink-0 ${
                      selectedTests.includes(test.id)
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300"
                    } flex items-center justify-center`}
                  >
                    {selectedTests.includes(test.id) && (
                      <FaCheck className="text-white text-xs" />
                    )}
                  </div>
                  <FaBookOpen className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {test.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {test.description}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-1">
                      <FaClock className="text-xs" />
                      <span>{test.duration}m</span>
                    </div>
                    <div
                      className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTestForQuestions(test);
                        setShowQuestionsModal(true);
                      }}
                      title="Click to view questions"
                    >
                      <FaQuestionCircle className="text-xs" />
                      <span className="underline">{test.questions}Q</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 block mt-1">
                    {test.difficulty}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredTests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaBookOpen className="mx-auto text-4xl mb-2" />
            <p className="text-lg">No tests found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={testsPage}
          totalPages={totalPages}
          onPageChange={setTestsPage}
        />
      </div>
    );
  };

  return (
    <div>
      <Toaster position="top-right" />

      {/* Conditional Rendering: Assessment List or Assessment Library */}
      {showAssessmentList ? (
        <AssessmentList
          onBack={() => {
            setShowAssessmentList(false);
            resetAllFormData(); // Reset all form data when going back to create assessment
          }}
          token={token}
          userId={userId}
          tests={tests}
        />
      ) : (
        <>
          <button
            onClick={setShowAssessmentList}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft />
            {t("backtoassessmentlib")}
          </button>
          <br />
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t("assessmentLibrary", "Assessment Library")}
                </h1>
                <p className="text-gray-600 mt-1">{t("Createassessments")}</p>
              </div>
            </div>
          </div>

          {/* Flow Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              {t("ChooseAssessmentFlow")}
            </h2>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="flow"
                  value="candidates"
                  checked={selectedFlow === "candidates"}
                  onChange={() => handleFlowChange("candidates")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <FaUsers className="text-blue-600" />
                  <span className="font-medium text-sm sm:text-base">
                    {" "}
                    {t("candidatesAsignTest")}{" "}
                  </span>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="flow"
                  value="tests"
                  checked={selectedFlow === "tests"}
                  onChange={() => handleFlowChange("tests")}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <FaBookOpen className="text-blue-600" />

                  <span className="font-medium text-sm sm:text-base">
                    {" "}
                    {t("testSelectCandidates")}{" "}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
            {selectedFlow === "candidates" ? (
              // Candidates → Assign Test Flow
              <div>
                {step === 1 ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        {t("selectcandidates")} ({selectedCandidates.length}{" "}
                        {t("selected")})
                      </h3>
                      <button
                        onClick={() => setStep(2)}
                        disabled={selectedCandidates.length === 0 || loading}
                        className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm ${
                          selectedCandidates.length === 0 || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <span>{t("assignTests")}</span>
                        <FaChevronRight className="text-xs" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">
                          {t("loadingcandidates")}
                        </p>
                      </div>
                    ) : (
                      renderCandidatesList()
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 space-y-2 lg:space-y-0">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                          {t("selectTestFor")} {selectedCandidates.length}{" "}
                          {t("candidates")} ({selectedTests.length} tests
                          selected)
                        </h3>
                        <p className="text-xs text-gray-600">
                          {t(
                            "choosemultipletests",
                            "Choose multiple tests to assign"
                          )}
                        </p>
                      </div>
                      <div className="flex flex-row space-x-2">
                        <button
                          onClick={() => setStep(1)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        >
                          {t("back")}
                        </button>
                        <button
                          onClick={createAssessment}
                          disabled={selectedTests.length === 0 || loading}
                          className={`px-3 py-1.5 rounded-md transition-colors text-sm ${
                            selectedTests.length === 0 || loading
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {loading ? t("creating") : t("scheduleandcreate")}
                        </button>
                      </div>
                    </div>
                    {renderTestsListMultiple()}
                  </div>
                )}
              </div>
            ) : (
              // Tests → Select Candidates Flow
              <div>
                {step === 1 ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        {t("selectTest")} ({selectedTests.length} selected)
                      </h3>
                      <button
                        onClick={() => setStep(2)}
                        disabled={selectedTests.length === 0 || loading}
                        className={`flex items-center justify-center space-x-1 px-3 py-1.5 rounded-md transition-colors text-sm ${
                          selectedTests.length === 0 || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <span>{t("selectcandidates")}</span>
                        <FaChevronRight className="text-xs" />
                      </button>
                    </div>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">
                          {t("loadingTests")}
                        </p>
                      </div>
                    ) : (
                      renderTestsListMultiple()
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 space-y-2 lg:space-y-0">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                          {t("selectcandidates")} ({selectedCandidates.length}{" "}
                          {t("selected")})
                        </h3>
                        <p className="text-xs text-gray-600">
                          {t("chooseCandidatesForTest")}
                        </p>
                      </div>
                      <div className="flex flex-row space-x-2">
                        <button
                          onClick={() => setStep(1)}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                        >
                          {t("back")}
                        </button>
                        <button
                          onClick={createAssessment}
                          disabled={selectedCandidates.length === 0 || loading}
                          className={`px-3 py-1.5 rounded-md transition-colors text-sm ${
                            selectedCandidates.length === 0 || loading
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {loading ? t("creating") : t("scheduleandcreate")}
                        </button>
                      </div>
                    </div>
                    {renderCandidatesList()}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              {t("scheduleassessment")}
            </h3>

            {/* Assessment Summary */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
                {t("assessmentdetails")}:
              </h4>
              <p className="text-xs sm:text-sm text-blue-700 mb-1">
                <strong>{t("tests")}:</strong> {selectedTests.length} selected
              </p>
              <div className="text-xs sm:text-sm text-blue-700 mb-2 max-h-20 overflow-y-auto">
                {tests
                  .filter((t) => selectedTests.includes(t.id))
                  .map((test) => (
                    <div key={test.id} className="mb-1">
                      • {test.title}
                    </div>
                  ))}
              </div>
              <p className="text-xs sm:text-sm text-blue-700 mb-2">
                <strong>{t("candidates")}:</strong> {selectedCandidates.length}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <p className="text-xs sm:text-sm text-blue-700">
                  <strong>{t("questions")}:</strong>{" "}
                  {tests
                    .filter((t) => selectedTests.includes(t.id))
                    .reduce((sum, test) => sum + test.questions, 0)}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs sm:text-sm text-blue-700">
                    <strong>{t("duration")}:</strong>
                  </p>
                  <input
                    type="number"
                    min="1"
                    value={editableDuration}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === "") {
                        setEditableDuration("");
                        return;
                      }
                      const num = parseInt(val, 10);
                      setEditableDuration(isNaN(num) ? "" : String(num));
                    }}
                    onWheel={(e) => e.target.blur()}
                    className="w-20 border border-blue-300 rounded px-2 py-1 text-xs sm:text-sm bg-white"
                    placeholder={tests
                      .filter((t) => selectedTests.includes(t.id))
                      .reduce((sum, test) => sum + (test.duration || 0), 0)
                      .toString()}
                  />
                  <span className="text-xs sm:text-sm text-blue-700">
                    {t("min")}
                  </span>
                </div>
              </div>
            </div>

            {/* Assessment Title */}
            <div className="mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Assessment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
                placeholder="Enter assessment title"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date Selection */}
            {/* Schedule and Expiry Date in one row */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:gap-4">
              {/* Schedule Date */}
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t("scheduleDate")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
              </div>

              {/* Expiry Date */}
              <div className="flex-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {t("expiryDate")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={scheduledDate || new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setScheduledDate("");
                  setExpiryDate("");
                  setAssessmentTitle("");
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleCreateAssessment}
                disabled={
                  !scheduledDate || !expiryDate || !assessmentTitle || loading
                }
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors text-sm ${
                  !scheduledDate || !expiryDate || !assessmentTitle || loading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {loading ? t("creating") : t("createassessment")}
              </button>
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
                {t("questionsfor")}: {selectedTestForQuestions.title}
              </h3>
              <div className="flex items-center gap-3">
                {/* <button
                  onClick={() => {
                    // Navigate to TestCreate with pre-selected questions
                    // Store objects with id, text and parentId (resource id)
                    const parentId =
                      selectedTestForQuestions?._id?.$oid ||
                      selectedTestForQuestions?._id ||
                      selectedTestForQuestions?.id ||
                      null;
                    const preSelected = (
                      selectedTestForQuestions?.qs || []
                    ).map((q) => ({
                      id: q.id,
                      text: q.q || q.text || "",
                      parentId,
                    }));
                    try {
                      sessionStorage.setItem(
                        "preSelectedQuestions",
                        JSON.stringify(preSelected)
                      );
                      console.log("preSelectedQuestions saved:", preSelected);
                    } catch (e) {
                      console.error("Failed to save preSelectedQuestions", e);
                    }
                    window.location.href = "/test-library";
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add Questions
                </button> */}
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
            </div>

            {/* Test Info */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    <strong>{t("description")}:</strong>{" "}
                    <span className="break-words">
                      {selectedTestForQuestions.description}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    <strong>{t("category")}:</strong>{" "}
                    {selectedTestForQuestions.category}
                  </p>
                </div>
                <div className="text-left lg:text-right flex-shrink-0">
                  <div className="flex flex-row lg:flex-col items-center lg:items-end space-x-4 lg:space-x-0 lg:space-y-1 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FaClock />
                      <span>{selectedTestForQuestions.duration}m</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaQuestionCircle />
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
              {selectedTestForQuestions.qs &&
              selectedTestForQuestions.qs.length > 0 ? (
                <div className="space-y-4">
                  {selectedTestForQuestions.qs.map((question, index) => (
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
                            {question.text ||
                              question.q ||
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
                          {question.answer && (
                            <div className="mt-2 p-2 bg-green-50 rounded">
                              <p className="text-xs sm:text-sm text-green-800">
                                <strong>{t("answer")}: </strong>
                                {typeof question.answer === "object" &&
                                question.answer !== null ? (
                                  <span className="break-words">
                                    {Object.entries(question.answer).map(
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
                                    {question.answer != null
                                      ? String(question.answer)
                                      : ""}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Time */}
                          {question.time && (
                            <p className="text-xs text-gray-500 mt-2">
                              <strong>{t("time")}:</strong> {question.time}{" "}
                              {t("seconds")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaQuestionCircle className="mx-auto text-2xl sm:text-4xl mb-2" />
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
    </div>
  );
};

export default AssessmentLibrary;

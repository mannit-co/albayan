import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { BaseUrl, uid } from "../../Api/Api";
import { toast } from "react-hot-toast";
import { FaClipboardList, FaUser, FaTimes, FaCheck, FaTrash } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { LuSend } from "react-icons/lu";
import { v4 as uuidv4 } from "uuid";

const AssessmentList = ({ onBack, token, userId, tests }) => {
    const { t } = useLanguage();
    const [assessmentList, setAssessmentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showCandidatesModal, setShowCandidatesModal] = useState(false);
    const [selectedAssessmentCandidates, setSelectedAssessmentCandidates] = useState([]);
    const [candidatesLoading, setCandidatesLoading] = useState(new Set()); // Updated to track by id_title
    const [inviteLoading, setInviteLoading] = useState(new Set()); // For tracking invite loading per assessment id_title
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [candidatesToInvite, setCandidatesToInvite] = useState([]);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [showTestNamesModal, setShowTestNamesModal] = useState(false);
    const [selectedTestNames, setSelectedTestNames] = useState([]);
    const [removingCandidateId, setRemovingCandidateId] = useState(null);
    const [customEmailBody, setCustomEmailBody] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [inviteStatusFilter, setInviteStatusFilter] = useState("all"); // all, pending, invited
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [candidateToDelete, setCandidateToDelete] = useState(null);

    // Format date for display
    const formatDate = (dateField) => {
        if (!dateField) return "N/A";

        try {
            // Handle MongoDB-style { "$date": "..." }
            if (typeof dateField === 'object' && dateField.$date) {
                dateField = dateField.$date;
            }

            const date = new Date(dateField);
            if (isNaN(date.getTime())) return "N/A";

            // Force DD/MM/YYYY format (not locale dependent)
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();

            return `${day}/${month}/${year}`; // ✅ shows 04/10/2025
        } catch (error) {
            return "N/A";
        }
    };

    // Fetch assessment list data
    const fetchAssessmentList = async () => {
        if (!token || !userId) return;

        setLoading(true);
        try {
            let allData = [];
            let page = 1;
            const limit = 100;

            while (true) {
                const response = await fetch(
                    `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
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

            // Process data to extract assessments
            const assessments = [];
            const assessmentMap = new Map();

            allData.forEach((item) => {
                try {
                    const parsed = typeof item === "string" ? JSON.parse(item) : item;
                    if (parsed.asnT && Array.isArray(parsed.asnT)) {
                        // Extract test names from asnT array and create a unique key based on test content
                        const testNames = parsed.asnT.map(test => test.title).sort().join(', ');
                        const assessmentTitle = parsed.assT || 'Untitled Assessment';

                        // Group by assessment title + test names (not by candidate document ID)
                        const assessmentKey = `${assessmentTitle}_${testNames}`;

                        if (assessmentMap.has(assessmentKey)) {
                            const existing = assessmentMap.get(assessmentKey);
                            existing.totalCandidates += 1;
                            // Store all candidate IDs for this grouped assessment
                            existing.candidateIds.push(parsed._id?.$oid || parsed._id);
                            if (parsed.status === 'completed' || parsed.testCompleted) {
                                existing.totalCompleted += 1;
                            }
                            // Update invite status - if any candidate is invited, mark as invited
                            if (parsed.inviteStatus === 'invited') {
                                existing.inviteStatus = 'invited';
                            }
                        } else {
                            assessmentMap.set(assessmentKey, {
                                id: assessmentKey, // Use the unique key as ID for grouped assessment
                                assessmentName: assessmentTitle, // Use assT as Assessment Name
                                testNames: testNames, // Show all test names
                                jobRole: "General", // You can customize this based on your needs
                                duration: parsed.Tdur || 0,
                                level: "Medium", // You can customize this based on your needs
                                totalScore: parsed.TqnC * 10 || 0, // Assuming 10 points per question
                                state: "Active",
                                totalCompleted: parsed.status === 'completed' || parsed.testCompleted ? 1 : 0,
                                totalCandidates: 1,
                                createdAt: parsed.updatedAt || parsed.updatedAt || new Date(),
                                // Store all candidate IDs that have this assessment
                                candidateIds: [parsed._id?.$oid || parsed._id],
                                // Track invite status
                                inviteStatus: parsed.inviteStatus || "pending",
                                // Store the original data for reference
                                originalData: parsed
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error processing candidate data:", error);
                }
            });

            // Sort assessments by creation date (newest first) before setting state
            const sortedAssessments = Array.from(assessmentMap.values()).sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateB - dateA; // Descending order (newest first)
            });

            setAssessmentList(sortedAssessments);
        } catch (error) {
            console.error("Error fetching assessment list:", error);
            toast.error("Failed to load assessment list");
        } finally {
            setLoading(false);
        }
    };

    // Filter and paginate assessments
    const getFilteredAssessments = () => {
        let filtered = assessmentList.filter(assessment =>
            assessment.assessmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.testNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
            //   assessment.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assessment.state.toLowerCase().includes(searchTerm.toLowerCase())
            // assessment.createdFrom.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply invite status filter
        if (inviteStatusFilter === "invited") {
            filtered = filtered.filter(assessment => assessment.inviteStatus === "invited");
        } else if (inviteStatusFilter === "pending") {
            filtered = filtered.filter(assessment => assessment.inviteStatus !== "invited");
        }
        // "all" shows everything, no additional filter needed

        // Ensure the filtered results maintain newest-first order
        const reversedFiltered = [...filtered].reverse();

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        return {
            items: reversedFiltered.slice(startIndex, endIndex),
            total: reversedFiltered.length,
            totalPages: Math.ceil(reversedFiltered.length / itemsPerPage)
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
                    {t("page", "Page")} {displayCurrentPage} {t("of", "of")} {displayTotalPages}
                </span>

                <button
                    onClick={() => onPageChange(displayCurrentPage + 1)}
                    disabled={displayCurrentPage === displayTotalPages || displayTotalPages <= 1}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {t("next")}
                </button>
            </div>
        );
    };

    // Fetch candidates for a specific assessment
    const fetchAssessmentCandidates = async (assessmentId, assessmentTitle, candidateIds) => {
        if (!token || !userId) return;

        const loadingKey = assessmentId;
        setCandidatesLoading(prev => new Set(prev).add(loadingKey));
        try {
            let allData = [];
            let page = 1;
            const limit = 100;

            while (true) {
                const response = await fetch(
                    `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
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

            // Filter candidates who have this specific assessment (match by candidate IDs)
            const candidatesWithAssessment = [];

            allData.forEach((item) => {
                try {
                    const parsed = typeof item === "string" ? JSON.parse(item) : item;
                    const candidateId = parsed._id?.$oid || parsed._id;

                    // Check if this candidate is in the list of candidates for this grouped assessment
                    if (candidateIds.includes(candidateId)) {
                        const candidateInfo = {
                            id: candidateId || "",
                            name: parsed.name || "Unknown",
                            email: parsed.email || "",
                            role: parsed.role || "N/A",
                            status: parsed.status || "N/A",
                            testCompleted: parsed.testCompleted || false,
                            assT: parsed.assT ,
                            completedAt: parsed.completedAt || null,
                            scheduledDate: parsed.scheduledDate || null,
                            expiryDate :parsed.expiryDate || null,
                            inviteStatus: parsed.inviteStatus || "pending",

                        };
                        candidatesWithAssessment.push(candidateInfo);
                    }
                } catch (error) {
                    console.error("Error processing candidate data:", error);
                }
            });

            setSelectedAssessmentCandidates(candidatesWithAssessment);
            setShowCandidatesModal(true);
        } catch (error) {
            console.error("Error fetching assessment candidates:", error);
            toast.error("Failed to load candidates");
        } finally {
            // Remove assessment from loading set
            setCandidatesLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(loadingKey);
                return newSet;
            });
        }
    };

    // Handle invite candidates for assessment
    const handleInviteForAssessment = async (assessmentId, assessmentTitle, candidateIds) => {
        if (!token || !userId) return;

        const loadingKey = assessmentId;
        setInviteLoading(prev => new Set(prev).add(loadingKey));
        try {
            // Fetch candidates for this assessment
            let allData = [];
            let page = 1;
            const limit = 100;

            while (true) {
                const response = await fetch(
                    `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&page=${page}&limit=${limit}`,
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

            // Filter candidates who have this specific assessment (match by candidate IDs)
            const candidatesWithAssessment = [];

            allData.forEach((item) => {
                try {
                    const parsed = typeof item === "string" ? JSON.parse(item) : item;
                    const candidateId = parsed._id?.$oid || parsed._id;

                    // Check if this candidate is in the list of candidates for this grouped assessment
                    if (candidateIds.includes(candidateId)) {
                        const candidateInfo = {
                            _id: candidateId || "",
                            id: candidateId || "",
                            name: parsed.name || "Unknown",
                            email: parsed.email || "",
                            role: parsed.role || "N/A",
                            status: parsed.status || "N/A",
                            assignedTests: parsed.asnT || [],
                            testCompleted: parsed.testCompleted || false,
                            completedAt: parsed.completedAt || null,
                            scheduledDate: parsed.scheduledDate || null,
                            expiryDate :parsed.expiryDate || null,
                            assT: parsed.assT ,
                        };
                        candidatesWithAssessment.push(candidateInfo);
                    }
                } catch (error) {
                    console.error("Error processing candidate data:", error);
                }
            });

            if (candidatesWithAssessment.length === 0) {
                toast.error("No candidates found for this assessment");
                return;
            }

            // Set candidates and assessment for invitation
            setCandidatesToInvite(candidatesWithAssessment);
            setSelectedAssessment({ id: assessmentId, title: assessmentTitle });
            setShowInviteModal(true);

        } catch (error) {
            console.error("Error fetching candidates for invitation:", error);
            toast.error("Failed to load candidates for invitation");
        } finally {
            setInviteLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(loadingKey);
                return newSet;
            });
        }
    };

    // Handle showing test names modal
    const handleShowTestNames = (testNames) => {
        const testNamesArray = testNames.split(', ').filter(name => name.trim() !== '');
        setSelectedTestNames(testNamesArray);
        setShowTestNamesModal(true);
    };

    // Handle remove candidate from assessment
    const handleRemoveCandidate = (candidateId, candidateName) => {
        setCandidateToDelete({ id: candidateId, name: candidateName });
        setShowDeleteConfirmModal(true);
    };

    // Confirm and execute delete
    const confirmDeleteCandidate = async () => {
        if (!token || !userId || !candidateToDelete) return;

        setRemovingCandidateId(candidateToDelete.id);
        try {
            // Use DELETE endpoint to remove the candidate document completely
            const response = await fetch(
                `${BaseUrl}/auth/eDeleteWCol?ColName=${uid}_Candidates&resourceId=${candidateToDelete.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        xxxid: uid,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to remove candidate");
            }

            toast.success(t("candidateRemovedSuccessfully"));

            // Remove candidate from the modal list immediately
            setSelectedAssessmentCandidates(prev =>
                prev.filter(c => c.id !== candidateToDelete.id)
            );

            // Refresh the assessment list to update counts
            fetchAssessmentList();
            
            // Close the confirmation modal
            setShowDeleteConfirmModal(false);
            setCandidateToDelete(null);
        } catch (error) {
            console.error("Error removing candidate:", error);
            toast.error(t("failedToRemoveCandidate"));
        } finally {
            setRemovingCandidateId(null);
        }
    };

    // Handle send invites (same logic as SendInvitationModal)
    const handleSendInvites = async () => {
        if (candidatesToInvite.length === 0) {
            toast.error("No candidates selected");
            return;
        }

        // Separate candidates with and without assigned tests
        const candidatesWithTest = candidatesToInvite.filter(
            (c) => c.assignedTests && c.assignedTests.length > 0
        );
        const candidatesWithoutTest = candidatesToInvite.filter(
            (c) => !c.assignedTests || c.assignedTests.length === 0
        );

        // Show toast for skipped candidates
        if (candidatesWithoutTest.length > 0) {
            const names = candidatesWithoutTest.map((c) => c.name).join(", ");
            toast.error(`No test assigned for: ${names}. They will be skipped.`);
        }

        // Update modal list to remove skipped candidates
        setCandidatesToInvite(candidatesWithTest);

        if (candidatesWithTest.length === 0) {
            return; // nothing to send
        }

        try {
            setInviteLoading(prev => new Set(prev).add('sending'));

            // Generate unique token (optional, per request not per candidate)
            const uniqueToken = uuidv4();
            const assessmentLink = `${BaseUrl}/invite`;

            // Send all candidates in one request with message and subject
            const requestPayload = {
                message: customEmailBody || "Hello,\n\nYou have been invited to complete your Al-Bayan assessment. Please read the instructions carefully.",
                subject: emailSubject || "Assessment Invitation",
                candidates: candidatesWithTest
            };

            const responseEmail = await fetch(assessmentLink, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    xxxid: uid,
                },
                body: JSON.stringify(requestPayload),
            });

            const resultEmail = await responseEmail.json();
            if (!(responseEmail.ok && resultEmail.statusCode === 200)) {
                toast.error(resultEmail.message || `Failed to send invites`);
                return;
            }

            // Update invite status for all candidates
            for (const candidate of candidatesWithTest) {
                try {
                    await fetch(
                        `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_Candidates&resourceId=${candidate.id}`,
                        {
                            method: "PUT",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                                xxxid: uid,
                            },
                            body: JSON.stringify({
                                inviteStatus: "invited",
                                invitedAt: { $date: new Date().toISOString() }
                            }),
                        }
                    );
                } catch (error) {
                    console.error("Error updating invite status:", error);
                }
            }

            toast.success("Invites sent successfully!");
            setShowInviteModal(false);
            setCandidatesToInvite([]);
            setSelectedAssessment(null);
            setCustomEmailBody(""); // Reset custom email body
            setEmailSubject(""); // Reset email subject

            // Refresh assessment list to update invite status
            fetchAssessmentList();

        } catch (error) {
            console.error("Error sending invites:", error);
            toast.error("Something went wrong");
        } finally {
            setInviteLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete('sending');
                return newSet;
            });
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchAssessmentList();
    }, [token, userId]);

    return (
        <>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col mb-6">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">{t("assessmentLibrary")}</h2>
                            <p className="text-sm text-gray-600 mt-1">{t("Viewallassessments")}</p>
                        </div>
                        <button
                            onClick={onBack}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <FaClipboardList />
                            <span>{t("createassessment", "Create Assessment")}</span>
                        </button>
                    </div>
                </div>


                {/* Search Bar */}
                {!loading && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            <div className="flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder={t("searchassessments")}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset to first page on search
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <select
                                    value={inviteStatusFilter}
                                    onChange={(e) => {
                                        setInviteStatusFilter(e.target.value);
                                        setCurrentPage(1); // Reset to first page on filter change
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">{t("allStatus", "All Status")}</option>
                                    <option value="pending">{t("invite", "Invite")}</option>
                                    <option value="invited">{t("invited", "Invited")}</option>
                                </select>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {(() => {
                                const { total } = getFilteredAssessments();
                                return `${t("Showing")} ${total} ${t("assessments")} ${total !== 1 ? '' : ''}`;
                            })()}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">{t("LoadingAssessments")}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-600">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("assessmenttitle")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("testcount")}
                                        </th>

                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("jobrole")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("duration")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("level")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("TotalScore")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("State")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("TotalCompleted")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("totalCandidates")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("createdAt")}
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-white uppercase ">
                                            {t("actions", "Actions")}
                                        </th>
                                        {/* <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-white uppercase ">
                                            {t("CreatedFrom")}
                                        </th> */}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(() => {
                                        const { items: filteredAssessments } = getFilteredAssessments();
                                        return filteredAssessments.length > 0 ? (
                                            filteredAssessments.map((assessment, index) => (
                                                <tr key={`${assessment.id}-${index}`} className="hover:bg-gray-50">
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                            {assessment.assessmentName}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleShowTestNames(assessment.testNames)}
                                                            className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                                            title="Click to view test names"
                                                        >
                                                            {assessment.testNames.split(', ').filter(name => name.trim() !== '').length}
                                                        </button>
                                                    </td>

                                                    {/* <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{assessment.createdBy}</div>
                        </td> */}
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{assessment.jobRole}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{assessment.duration}m</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{assessment.level}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{assessment.totalScore}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                            {assessment.state}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{assessment.totalCompleted}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => fetchAssessmentCandidates(assessment.id, assessment.assessmentName, assessment.candidateIds)}

                                                            disabled={candidatesLoading.has(assessment.id)}

                                                            className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Click to view candidates"
                                                        >
                                                            {candidatesLoading.has(assessment.id) ? `${t("loading")}` : assessment.totalCandidates}
                                                        </button>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{formatDate(assessment.createdAt)}</div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => handleInviteForAssessment(assessment.id, assessment.assessmentName, assessment.candidateIds)}
                                                            disabled={inviteLoading.has(assessment.id) || assessment.inviteStatus === 'invited'}
                                                            className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${assessment.inviteStatus === 'invited'
                                                                    ? 'text-green-700 bg-green-50 border border-green-200'
                                                                    : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:text-blue-700'
                                                                }`}
                                                            title={assessment.inviteStatus === 'invited' ? "Already invited" : "Send invitations to candidates"}
                                                        >
                                                            <LuSend className="mr-1" size={12} />
                                                            {inviteLoading.has(assessment.id)
                                                                ? t("loading", "Loading...")
                                                                : assessment.inviteStatus === 'invited'
                                                                    ? t("invited", "Invited")
                                                                    : t("invite", "Invite")}
                                                        </button>
                                                    </td>
                                                    {/* <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">{assessment.createdFrom}</div>
                                                    </td> */}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="12" className="px-6 py-8 text-center">
                                                    <div className="text-gray-500">
                                                        <FaClipboardList className="mx-auto text-4xl mb-2" />
                                                        <p className="text-lg">{searchTerm ? 'No matching assessments found' : 'No assessments found'}</p>
                                                        <p className="text-sm">{searchTerm ? 'Try adjusting your search criteria' : 'Create your first assessment to see it here'}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {(() => {
                            const { totalPages } = getFilteredAssessments();
                            return (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            );
                        })()}
                    </div>
                )}

                {/* Candidates Modal */}
                {showCandidatesModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    {t("CandidatesforAssessment")} ({selectedAssessmentCandidates.length} {t("total")})
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCandidatesModal(false);
                                        setSelectedAssessmentCandidates([]);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0 ml-2"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Candidates List */}
                            <div className="flex-1 overflow-y-auto">
                                {selectedAssessmentCandidates.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedAssessmentCandidates.map((candidate, index) => (
                                            <div key={`${candidate.id}-${index}`} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                                        <FaUser className="text-gray-400 flex-shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{candidate.name}</h4>
                                                            <p className="text-xs sm:text-sm text-gray-600 truncate">{candidate.email}</p>
                                                            <p className="text-xs sm:text-sm text-gray-500">{candidate.role}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="flex flex-col items-end space-y-1">
                                                                {/* <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${candidate.testCompleted
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-yellow-100 text-yellow-800"
                                                                    }`}>
                                                                    {candidate.testCompleted ? (
                                                                        <><FaCheck className="mr-1" /> Completed</>
                                                                    ) : (
                                                                        'Pending'
                                                                    )}
                                                                </span> */}
                                                                {candidate.scheduledDate && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {t("scheduled")}: {formatDate(candidate.scheduledDate)}
                                                                    </p>
                                                                )}
                                                                {candidate.completedAt && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {t("completed")}: {formatDate(candidate.completedAt)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {candidate.inviteStatus !== "invited" && (
                                                            <button
                                                                onClick={() => handleRemoveCandidate(candidate.id, candidate.name)}
                                                                disabled={removingCandidateId === candidate.id}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title={t("removeCandidate")}
                                                            >
                                                                <FaTrash size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FaUser className="mx-auto text-4xl mb-2" />
                                        <p className="text-lg">{t("Nocandidatesfound")}</p>
                                        <p className="text-sm">{t("noassignedcandidates")}</p>
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowCandidatesModal(false);
                                        setSelectedAssessmentCandidates([]);
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                >
                                    {t("close")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invitation Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("sendInvitations",)}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setCandidatesToInvite([]);
                                        setSelectedAssessment(null);
                                        setCustomEmailBody("");
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600 mb-2">
                                    {t("assessment")}: <span className="font-medium">{selectedAssessment?.title}</span>
                                </p>
                                <p className="text-gray-600 mb-4">
                                    {t("sendInvitationsTo")} {candidatesToInvite.length}{" "}
                                    {candidatesToInvite.length === 1 ? t("candidate", "candidate") : t("candidates", "candidates")}?
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto mb-4">
                                    {candidatesToInvite.map((candidate) => (
                                        <div key={candidate.email} className="text-sm text-gray-600">
                                            • {candidate.name} ({candidate.email})
                                        </div>
                                    ))}
                                </div>

                                {/* Email Subject */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("emailSubject", "Email Subject")} 
                                    </label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder={t("emailSubjectPlaceholder", "Enter email subject")}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>

                                {/* Custom Email Body */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t("customEmailBody", "Email Message")}
                                    </label>
                                    <textarea
                                        value={customEmailBody}
                                        onChange={(e) => setCustomEmailBody(e.target.value)}
                                        placeholder={t("emailBodyPlaceholder", "Enter your custom email message here...")}
                                        rows="6"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                                        style={{
                                            fontFamily: 'Arial, sans-serif',
                                            lineHeight: '1.6'
                                        }}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {t("emailBodyNote", "This message will be included in the invitation email sent to candidates.")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setCandidatesToInvite([]);
                                        setSelectedAssessment(null);
                                        setCustomEmailBody("");
                                    }}
                                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={inviteLoading.has('sending')}
                                >
                                    {t("cancel", "Cancel")}
                                </button>
                                <button
                                    onClick={handleSendInvites}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={inviteLoading.has('sending')}
                                >
                                    <LuSend size={16} />
                                    <span>
                                        {inviteLoading.has('sending') ? t("sending", "Sending...") : t("sendInvites", "Send Invites")}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Test Names Modal */}
                {showTestNamesModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                    Test Names ({selectedTestNames.length} {selectedTestNames.length === 1 ? 'test' : 'tests'})
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowTestNamesModal(false);
                                        setSelectedTestNames([]);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold flex-shrink-0 ml-2"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Test Names List */}
                            <div className="max-h-60 overflow-y-auto">
                                {selectedTestNames.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedTestNames.map((testName, index) => (
                                            <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-900">{testName}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <FaClipboardList className="mx-auto text-4xl mb-2" />
                                        <p className="text-lg">No test names found</p>
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowTestNamesModal(false);
                                        setSelectedTestNames([]);
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
                {showDeleteConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t("confirmDeletion")}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        setCandidateToDelete(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600">
                                    {t("areYouSureDelete")} <span className="font-semibold">{candidateToDelete?.name}</span> from this assessment?
                                </p>
                                {/* <p className="text-sm text-red-600 mt-2">
                                    {t("actionCannotBeUndone", "This action cannot be undone.")}
                                </p> */}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        setCandidateToDelete(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={removingCandidateId !== null}
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    onClick={confirmDeleteCandidate}
                                    disabled={removingCandidateId !== null}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {removingCandidateId !== null ? t("deleting", "Deleting...") : t("delete", "Delete")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

};

export default AssessmentList;

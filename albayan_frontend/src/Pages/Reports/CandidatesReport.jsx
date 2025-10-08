import React, { useState, useEffect } from "react";
import { FaFilter, FaEye, FaDownload } from "react-icons/fa";
import CandidatesViewModal from "./CandidatesViewModal";
import { uid, BaseUrl } from "../../Api/Api";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";

const CandidatesReport = () => {
  const { t } = useLanguage();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState("all");
  const [candidates, setCandidates] = useState([]);
  const [testHistory, setTestHistory] = useState([]);


  // Retrieve token from sessionStorage
  const getToken = () => {
    let token = null;
    const storedData = sessionStorage.getItem("loginResponse");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.source) {
        const sourceObj = JSON.parse(parsedData.source);
        token = sourceObj.token;
      }
    }
    if (!token) {
      console.error("Token not found");
    }
    return token;
  };
  useEffect(() => {
    const fetchAvailableTests = async () => {
      const token = getToken();
      if (!token) return;

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
            // data.source contains strings, so we need to parse them
            const parsed = data.source.map((item) => JSON.parse(item));
            allData = allData.concat(parsed);

            if (data.source.length < limit) break;
          } else break;

          page++;
        }

        // Normalize tests for dropdown
        const normalizedTests = allData.map((test) => ({
          id: test.tid,
          name: test.title || "Unnamed Test",
        }));

        setAvailableTests(normalizedTests);
      } catch (error) {
        console.error("Error fetching available tests:", error);
        toast.error("Failed to load tests");
        setAvailableTests([]);
      }
    };

    fetchAvailableTests();
  }, []);

  // ✅ Fetch candidates dynamically
  useEffect(() => {
    const fetchCandidates = async () => {
      const token = getToken();
      if (!token) return;

      try {
        let allData = [];

        let page = 1;
        const limit = 100;

        while (true) {
          const response = await fetch(
            `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Result&page=${page}&limit=${limit}`,
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
            const parsed = data.source.map((item) => JSON.parse(item));
            allData = allData.concat(parsed);

            if (data.source.length < limit) break;
          } else break;

          page++;
        }

        // ❌ console.log('data', data)  <-- remove this
        // ✅ instead:
        console.log("allData", allData);
        const normalizedCandidates = allData
          .filter(
            (c) =>
              (c.testHistory && c.testHistory.length > 0) ||
              c.performanceSummary
          )
        .map((c) => {
  const rootScore = c.score ?? c.performanceSummary?.overallScore ?? 0;
  const lastTestName =
    (c.testHistory && c.testHistory.length > 0
      ? c.testHistory[c.testHistory.length - 1].testName
      : "N/A") || "N/A";

  let lastActivity = "N/A";
  if (c.testHistory && c.testHistory.length > 0) {
    const lastTest = c.testHistory[c.testHistory.length - 1];
    const cleanDateStr = lastTest.date.replace("IST", "").trim();
    const dateObj = new Date(cleanDateStr);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      lastActivity = `${day}-${month}-${year}`;
    }
  }

  return {
    id: c._id?.$oid || c._id || null,
    name: c.name || c.personalInformation?.name || "Unknown",
    email: c.email || c.personalInformation?.email || "N/A",
    phone: c.phone || c.personalInformation?.phone || "N/A",
    testName: lastTestName,
    averageScore: `${rootScore}`,
    testHistory: c.testHistory || [], // ✅ ADD THIS LINE
    performance: {
      label:
        rootScore >= 90
          ? "Excellent"
          : rootScore >= 75
          ? "Good"
          : rootScore >= 50
          ? "Average"
          : "Poor",
      color:
        rootScore >= 90
          ? "text-green-600"
          : rootScore >= 75
          ? "text-blue-600"
          : rootScore >= 50
          ? "text-yellow-600"
          : "text-red-600",
    },
    lastActivity,
    status: {
      label: c.status || "Completed",
      color:
        c.status === "Active"
          ? "bg-green-100 text-green-800"
          : c.status === "Completed"
          ? "bg-blue-100 text-blue-800"
          : c.status === "In Progress"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-gray-100 text-gray-800",
    },
  };
});


        setCandidates(normalizedCandidates);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        toast.error("Failed to load candidates");
        setCandidates([]);
      }
    };

    fetchCandidates();
  }, []);

  // ✅ Filter candidates by status
  const filteredCandidates = candidates.filter((candidate) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "in-progress")
      return candidate.status.label === "In Progress";
    return (
      candidate.status.label ===
      statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
    );
  });

  // 🔽 Helper: Download Report (EN or AR)
  const handleDownloadReport = async (lang, candidateId) => {
    const token = getToken();
    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    if (!candidateId) {
      toast.error("Candidate ID not found");
      return;
    }

    try {
      const response = await fetch(
        `${BaseUrl}/auth/retrievecollection?ColName=${uid}_AIReports`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            xxxid: uid,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!data?.source || !Array.isArray(data.source)) {
        toast.error("No reports found");
        return;
      }

      // Parse reports
      const reports = data.source.map((item) => JSON.parse(item));

      // ✅ Find report matching the candidateID
      const report = reports.find((r) => r.candidateID === candidateId);
      console.log("Matched Report for candidateID:", candidateId, report);

      if (!report) {
        toast.error("No report found for this candidate");
        return;
      }

      // ✅ Select EN or AR PDF
      let base64Data =
        lang === "EN" ? report.englishReport : report.arabicReport;

      if (!base64Data) {
        toast.error(`No ${lang} report found in this record`);
        return;
      }

      // ✅ Remove prefix if exists
      if (base64Data.startsWith("data:")) {
        base64Data = base64Data.split(",")[1];
      }

      // ✅ Decode properly
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      // ✅ Create PDF Blob and download
      const blob = new Blob(byteArrays, { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Report_${lang}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${lang} report downloaded successfully`);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  // 1️⃣ Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 2️⃣ Paginated candidates
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 3️⃣ Total pages
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t("allCandidates")}</option>
              <option value="active">{t("active")}</option>
              <option value="completed">{t("completed")}</option>
              <option value="in-progress">{t("inProgress")}</option>
            </select>
          </div>

          {/* Dynamic Tests Dropdown */}
          <select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t("allTests")}</option>
            {availableTests.map((test) => (
              <option key={test.id} value={test.name}>
                {test.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("candidatePerformance")}
          </h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-600 ">
              <tr>
                {[
                  t("candidate"),
                  t("assessmenttitle"),
                  t("score"),
                  t("performance"),
                  t("lastActivity"),
                  t("status"),
                  t("actions"),
                ].map((head) => (
                  <th
                    key={head}
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCandidates.map((candidate, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {candidate.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {candidate.testName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {candidate.averageScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`flex items-center space-x-1 ${candidate.performance.color}`}
                    >
                      <span className="text-sm font-medium">
                        {candidate.performance.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {candidate.lastActivity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${candidate.status.color}`}
                    >
                      {candidate.status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <FaEye size={14} />
                        <span>{t("view")}</span>
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                        onClick={() => handleDownloadReport("EN", candidate.id)}
                      >
                        <FaDownload size={14} />
                        <span>EN</span>
                      </button>

                      <button
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                        onClick={() => handleDownloadReport("AR", candidate.id)}
                      >
                        <FaDownload size={14} />
                        <span>AR</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {t("previous") || "Previous"}
            </button>

            <span className="text-sm font-medium">
              {t("page") || "Page"} {currentPage} {t("of") || "of"} {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {t("next") || "Next"}
            </button>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredCandidates.map((candidate, idx) => (
            <div key={idx} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {candidate.name}
                  </p>
                  <p className="text-xs text-gray-500">{candidate.email}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${candidate.status.color}`}
                >
                  {candidate.status.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p>
                  <span className="font-medium">{t("tests")}: </span>
                  {candidate.testsCompleted}
                </p>
                <p>
                  <span className="font-medium">{t("avgScore")}: </span>
                  {candidate.averageScore}
                </p>
                <p className={`${candidate.performance.color}`}>
                  <span className="font-medium">{t("performance")}: </span>
                  {candidate.performance.label}
                </p>
                <p>
                  <span className="font-medium">{t("lastActivity")}: </span>
                  {candidate.lastActivity}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-3 flex space-x-3">
                <button
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <FaEye size={14} />
                  <span>{t("view")}</span>
                </button>
                <button
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                  onClick={() => handleDownloadReport("EN", candidate.id)}
                >
                  <FaDownload size={14} />
                  <span>EN</span>
                </button>
                <button
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                  onClick={() => handleDownloadReport("AR", candidate.id)}
                >
                  <FaDownload size={14} />
                  <span>AR</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedCandidate && (
        <CandidatesViewModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default CandidatesReport;

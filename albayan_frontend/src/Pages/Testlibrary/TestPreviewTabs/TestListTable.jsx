import React, { useState, useMemo, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { BaseUrl, uid } from "../../../Api/Api";
import { AiOutlineDelete } from "react-icons/ai";
import { useLanguage } from "../../../contexts/LanguageContext";
const TestListTable = ({ tests, loading, token, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useLanguage();
  const itemsPerPage = 10;

// Sort and filter tests — newest first
// Reverse and filter tests — show last added first
const filtered = useMemo(() => {
  if (!Array.isArray(tests)) return [];

const reversed = [...tests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


  const q = query.trim().toLowerCase();
  if (!q) return reversed;

  return reversed.filter((t) => {
    const title = String(t.title || "").toLowerCase();
    const category = String(t.category || "").toLowerCase();
    const difficulty = String(t.difficulty || "").toLowerCase();
    const skillsArr = Array.isArray(t.skill)
      ? t.skill
      : String(t.skill || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const skills = skillsArr.join(" ").toLowerCase();

    return (
      title.includes(q) ||
      category.includes(q) ||
      difficulty.includes(q) ||
      skills.includes(q)
    );
  });
}, [tests, query]);


const totalPages = useMemo(
  () => Math.max(1, Math.ceil((filtered.length || 0) / itemsPerPage)),
  [filtered]
);

const paginatedTests = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return filtered.slice(start, start + itemsPerPage);
}, [filtered, currentPage]);


  // Ensure we don't land on an out-of-range page and reset when list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tests, query]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <h3
          className="text-lg font-medium text-gray-800 cursor-pointer"
          onClick={toggleExpand}
        >
          {t("testList")}
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder={t("searchbytitle")}
            className="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm"
          />
          <button
            className="p-1.5 rounded border"
            onClick={toggleExpand}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("testname")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("questions")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("Durationmin")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("category")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("difficulty")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  {t("skills")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  {t("action")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {t("loadingTests")}
                  </td>
                </tr>
              ) : (filtered?.length || 0) === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {t("noTestsFound")}
                  </td>
                </tr>
              ) : (
                paginatedTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {test.title || "Untitled Test"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.questions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.duration || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.category || "General"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${
                                                  test.difficulty?.toLowerCase() ===
                                                  "easy"
                                                    ? "bg-green-100 text-green-800"
                                                    : test.difficulty?.toLowerCase() ===
                                                      "medium"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                      >
                        {test.difficulty || "Medium"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const skills = Array.isArray(test.skill)
                          ? test.skill
                          : String(test.skill || "")
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                        if (!skills.length)
                          return <span className="text-gray-400">—</span>;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {skills.map((s, idx) => (
                              <span
                                key={`${s}-${idx}`}
                                className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => onEdit(test)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit test"
                      >
                        <FaEdit className="inline" size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(test)}
                        className="text-red-600 hover:text-red-900 ml-2"
                        title="Delete test"
                      >
                        <AiOutlineDelete className="inline" size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-4 gap-2 p-3">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                {t("previous")}
              </button>
              <span className="px-3 py-1">
                {t("page")} {currentPage} {t("of")} {totalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestListTable;

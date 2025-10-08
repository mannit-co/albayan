import { FaThLarge, FaList, FaSearch, FaFile, FaEnvelope } from "react-icons/fa";
import { AiOutlineClockCircle } from "react-icons/ai";
import { FiMail, FiPhone, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { useLanguage } from "../../contexts/LanguageContext";
import { Toaster, toast } from "react-hot-toast";
import { usePagination } from "../../components/Pagination/usePagination";
import PaginationControls from "../../components/Pagination/PaginationControls";
const CandidateList = ({
    viewType,
    setViewType,
    filteredCandidates,
    selectedCandidates,
    toggleSelect,
    toggleSelectAll,
    allSelected,
    setViewCandidate,
    setShowViewModal,
    setEditCandidate,
    setShowEditForm,
    setCandidateToDelete,
    setShowDeleteModal,
    setSelectedCandidate,
    setAssignModalOpen,
    setInviteCandidate,
    setSendInvites
}) => {
    const { t } = useLanguage();
    // Initialize pagination with fixed 5 items per page
    const pagination = usePagination(filteredCandidates);

    return (
        <>
            {/* Candidate Section */}
            {viewType === "grid" ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {pagination.paginatedData.map((candidate, index) => (

                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                        >
                            {/* Header */}
                            <div className="p-3 sm:p-4 border-b border-gray-100 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedCandidates.includes(candidate.id)}
                                        onChange={() => toggleSelect(candidate.id)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {/* <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm sm:text-lg">
                                        {candidate.initials}
                                    </div> */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base break-words max-w-[120px] whitespace-normal">
                                            {candidate.name}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-gray-500">{candidate.role}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="p-3 sm:p-4 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                                    <FiMail size={14} />
                                    <span className="break-words max-w-[140px] whitespace-normal block">{candidate.email}</span>


                                </div>
                                <div className="flex items-center gap-2 text-gray-600 text-xs sm:text-sm">
                                    <FiPhone size={14} />
                                    <span>{candidate.phone}</span>
                                </div>
                            </div>


                            {/* Status */}
                            <div className="px-3 sm:px-4 pb-4 flex items-center gap-2">

                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${candidate.statusColor}`}
                                >
                                    {candidate.status}
                                </span>
                                {candidate.invite === "invited" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {t("invited")}
                                    </span>
                                )}
                            </div>
                            {/* Stats */}
                            {(candidate.assigned > 0 || candidate.completed > 0) && (
                                <div className="p-3 sm:p-4 border-t border-gray-100 grid grid-cols-3 text-center text-xs sm:text-sm">

                                    {/* Completed */}
                                    {candidate.completed > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-900">{candidate.completed}</p>
                                            <p className="text-gray-500 text-xs">{t("completed")}</p>
                                        </div>
                                    )}

                                    {/* Assigned */}
                                    {/* Assigned */}
                                    {candidate.assigned > 0 && (
                                        <div>
                                            <p className="text-gray-900 text-xs">
                                                {candidate.assigned} {t("assigned")}
                                                {candidate.scheduledDateStr && (
                                                    <div className="text-gray-400 text-xs">
                                                        {t("scheduled")}: {candidate.scheduledDateStr}
                                                    </div>
                                                )}
                                            </p>


                                        </div>
                                    )}


                                    {/* Avg Score */}
                                    {candidate.completed > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-900">{candidate.score}</p>
                                            <p className="text-gray-500 text-xs">{t("avgScore")}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Skills */}
                            <div className="p-3 sm:p-4 flex flex-wrap gap-2">
                                {candidate.skills && candidate.skills.length > 0 ? (
                                    candidate.skills.map((skill, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-xs">{t("noSkillsListed")}</span>
                                )}
                            </div>

                            {/* Date */}
                            <div className="px-3 sm:px-4 pb-4 text-xs text-gray-400">
                                {t("addedOn")} {candidate.date}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex flex-wrap justify-between items-center px-3 sm:px-4 py-3 border-t border-gray-100 gap-2">
                                <div className="flex gap-2">
                                    <button
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                                        onClick={() => {
                                            setViewCandidate(candidate);
                                            setShowViewModal(true);
                                        }}
                                    >
                                        <FiEye size={14} />
                                    </button>
                                    <button
                                        className="flex items-center gap-1 text-sm text-green-600 hover:bg-green-50 px-2 py-1 rounded"
                                        onClick={() => {
                                            setEditCandidate(candidate);
                                            setShowEditForm(true);
                                        }}
                                    >
                                        <FiEdit size={14} />
                                    </button>
                                </div>
                                <div className="flex gap-2 sm:gap-4">
                                    {/* <button
                                        className="flex items-center gap-1 text-sm text-purple-500 hover:bg-blue-50 px-2 py-1 rounded"
                                        onClick={() => {
                                            setSelectedCandidate(candidate);
                                            setAssignModalOpen(true);
                                        }}
                                    >
                                        <FaFile size={14} />
                                    </button> */}

                                    {/* <button
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                                        onClick={() => {
                                            if (!candidate.assigned || candidate.assigned === 0) {
                                                toast.error(t("noTestAssignedToSendInvites"));
                                                return;
                                            }
                                            setInviteCandidate(candidate);
                                            setSendInvites(true);
                                        }}
                                    >
                                        <FaEnvelope size={14} />
                                    </button> */}
                                    <button className="p-2 hover:bg-red-100 text-red-500 rounded"
                                        onClick={() => {
                                            setCandidateToDelete(candidate);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                    
                    {/* Pagination Controls for Grid View */}
                    <PaginationControls
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.goToPage}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                    />
                </>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="overflow-y-auto max-h-[500px]">
                        <table className="min-w-full">
                            <thead className="bg-gray-600">
                                <tr>
                                    <th className="px-4 sm:px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                        {t("candidateInformation")}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                        {t("contactDetails")}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                        {t("status")}
                                    </th>

                                    {/* Show Test Progress and Performance only if any candidate has assigned > 0 */}
                                    {filteredCandidates.some(c => c.assigned > 0) && (
                                        <>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                                {t("testProgress")}
                                            </th>
                                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                                {t("performance")}
                                            </th>
                                        </>
                                    )}

                                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                        {t("lastActivity")}
                                    </th>
                                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap">
                                        {t("actions")}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {pagination.paginatedData.map((candidate, index) => (

                                    <tr key={index} className="hover:bg-gray-50">
                                        {/* Checkbox */}
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedCandidates.includes(candidate.id)}
                                                onChange={() => toggleSelect(candidate.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </td>

                                        {/* Candidate Info */}
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                {/* <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-blue-600">{candidate.initials}</span>
                                                </div> */}
                                                <div className="text-sm sm:text-base">
                                                    <div className="text-gray-900 font-medium break-words max-w-[120px] whitespace-normal">
                                                        {candidate.name}
                                                    </div>

                                                    <div className="text-gray-500">{candidate.role}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                                            <div className="text-gray-900 break-words max-w-[180px] whitespace-normal">
                                                {candidate.email}
                                            </div>

                                            <div className="text-gray-500">{candidate.phone}</div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${candidate.statusColor}`}>
                                                {candidate.status}
                                            </span>
                                        </td>

                                        {/* Test Progress & Performance */}
                                        {/* Test Progress & Performance */}
                                        {filteredCandidates.some(c => c.assigned > 0) && (
                                            <>
                                                {/* Test Progress: Completed & Assigned */}
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    {(candidate.completed > 0 || candidate.assigned > 0) ? (
                                                        <div className="flex flex-col sm:flex-row sm:space-x-4">
                                                            {candidate.completed > 0 && (
                                                                <div className="text-center">
                                                                    <div className="font-medium text-gray-900">{candidate.completed}</div>
                                                                    <div className="text-gray-500 text-xs">{t("completed")}</div>
                                                                </div>
                                                            )}
                                                            {candidate.assigned > 0 && (
                                                                <div className="text-center">
                                                                    <div className="font-medium text-gray-900">{candidate.assigned}</div>
                                                                    <div className="text-gray-500 text-xs">{t("assigned")}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center font-medium">-</div>
                                                    )}
                                                </td>

                                                {/* Performance: Avg Score */}
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                                                    {candidate.completed > 0 ? (
                                                        <div className="text-center">
                                                            <div className="font-medium text-gray-900">{candidate.score}</div>
                                                            <div className="text-gray-500 text-xs">{t("avgScore")}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center font-medium">-</div>
                                                    )}
                                                </td>
                                            </>
                                        )}



                                        {/* Last Activity */}
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                                            <AiOutlineClockCircle size={16} />
                                            <span>{candidate.date}</span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                                            <div className="flex flex-wrap gap-1">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title={t("viewDetails")}
                                                    onClick={() => {
                                                        setViewCandidate(candidate);
                                                        setShowViewModal(true);
                                                    }}
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    className="text-green-600 hover:text-green-900"
                                                    title={t("editCandidate")}
                                                    onClick={() => {
                                                        setEditCandidate(candidate);
                                                        setShowEditForm(true);
                                                    }}
                                                >
                                                    <FiEdit size={16} />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900"
                                                    title={t("deleteCandidate")}
                                                    onClick={() => {
                                                        setCandidateToDelete(candidate);
                                                        setShowDeleteModal(true);
                                                    }}
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls for List View */}
                    <PaginationControls
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.goToPage}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                    />
                </div>
            )}
        </>
    );
};

export default CandidateList;

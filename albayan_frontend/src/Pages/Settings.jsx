import React, { useState, useMemo, useEffect } from "react";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { uid, BaseUrl } from "../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import { FaPlus, FaTrash, FaCheck, FaUsers, FaMinus } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useLanguage } from "../contexts/LanguageContext";

const Settings = () => {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  // HR Modal state
  const [hrList, setHrList] = useState([]);
  const [selectedHRs, setSelectedHRs] = useState([]);
  const [modalRow, setModalRow] = useState(null);
  const [showHrModal, setShowHrModal] = useState(false);

  // Assigned HR Names popup
  const [showAssignedHrPopup, setShowAssignedHrPopup] = useState(false);
  const [popupHrNames, setPopupHrNames] = useState([]);

  // Remove HR Modal state
  const [showRemoveHrModal, setShowRemoveHrModal] = useState(false);
  const [removeModalRow, setRemoveModalRow] = useState(null);
  const [selectedRemoveHRs, setSelectedRemoveHRs] = useState([]);

  const getAuthData = () => {
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
    return { token, userId };
  };

  const fetchAvailableTests = async () => {
    setLoading(true);
    try {
      const { token } = getAuthData();
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
          if (data.source.length < limit) break;
        } else break;

        page++;
      }

      const normalized = allData.map((item, index) => {
        let parsed = {};
        try {
          parsed = JSON.parse(item);
        } catch (e) {
          console.error("Failed to parse item:", item, e);
        }

        let createdDate = "N/A";
        if (parsed.created) {
          try {
            createdDate = new Date(parsed.created).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            });
          } catch (err) {
            createdDate = parsed.created;
          }
        }
        return {
          id: index + 1,
          created: createdDate,
          testName: parsed.title || "Untitled Test",
          diff: parsed.diff || "",
          resourceId: parsed._id?.$oid || parsed._id,
          added: parsed.testDisplay === true,
          hrname: parsed.hrname || [],
        };
      });

      setData(normalized.reverse());
    } catch (error) {
      console.error("Error fetching tests:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHRs = async () => {
    try {
      const { token } = getAuthData();
      let allData = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await fetch(
          `${BaseUrl}/auth/retrievecollection?ColName=${uid}_res&page=${page}&limit=${limit}`,
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
        } else break;

        page++;
      }

      const parsed = allData
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch (e) {
            return null;
          }
        })
        .filter((p) => p && p.role === "3");

      setHrList(parsed);
    } catch (error) {
      console.error("Error fetching HRs:", error);
      setHrList([]);
    }
  };

  const openHrModal = async (row) => {
    setModalRow(row);
    setSelectedHRs([]);
    await fetchHRs();
    setShowHrModal(true);
  };

  const openRemoveHrModal = (row) => {
    setRemoveModalRow(row);
    setSelectedRemoveHRs([]); // Start with no HRs selected
    setShowRemoveHrModal(true);
  };

  const confirmHrSelection = async () => {
    if (!modalRow) return;
    try {
      setProcessing(true);
      const { token } = getAuthData();

      // Merge new selections with existing HRs
      const existingHRs = modalRow.hrname || [];
      const mergedHRs = [...new Set([...existingHRs, ...selectedHRs])];

      const payload = {
        testDisplay: mergedHRs.length > 0,
        hrname: mergedHRs,
      };

      const response = await fetch(
        `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_TestLibrary&resourceId=${modalRow.resourceId}`,
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
      console.log("Add API Response:", result);

      toast.success(
        `Test "${modalRow.testName}" assigned to ${selectedHRs.join(", ")}`
      );

      setData((prev) =>
        prev.map((item) =>
          item.id === modalRow.id
            ? { ...item, added: mergedHRs.length > 0, hrname: mergedHRs }
            : item
        )
      );
    } catch (error) {
      console.error("Error assigning HR:", error);
      toast.error(`Failed to assign HRs`);
    } finally {
      setProcessing(false);
      setShowHrModal(false);
      setModalRow(null);
    }
  };

  const confirmHrRemoval = async () => {
    if (!removeModalRow) return;
    try {
      setProcessing(true);
      const { token } = getAuthData();

      // Get remaining HRs (those not selected for removal)
      const remainingHRs = removeModalRow.hrname.filter(
        (hr) => !selectedRemoveHRs.includes(hr)
      );

      const payload = {
        testDisplay: remainingHRs.length > 0,
        hrname: remainingHRs,
      };

      const response = await fetch(
        `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_TestLibrary&resourceId=${removeModalRow.resourceId}`,
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
      console.log("Remove API Response:", result);

      toast.success(
        selectedRemoveHRs.length === removeModalRow.hrname.length
          ? `Test "${removeModalRow.testName}" removed from all HRs`
          : `Removed ${selectedRemoveHRs.length} HR(s) from test "${removeModalRow.testName}"`
      );

      setData((prev) =>
        prev.map((item) =>
          item.id === removeModalRow.id
            ? { ...item, added: remainingHRs.length > 0, hrname: remainingHRs }
            : item
        )
      );
    } catch (error) {
      console.error("Error removing HRs:", error);
      toast.error(`Failed to remove HRs`);
    } finally {
      setProcessing(false);
      setShowRemoveHrModal(false);
      setRemoveModalRow(null);
    }
  };

  // This function is now replaced by openRemoveHrModal for selective removal

  useEffect(() => {
    fetchAvailableTests();
  }, []);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      // columnHelper.accessor("id", { header: t("serialNumber") }),
      columnHelper.accessor("testName", { header: t("testName") }),
      columnHelper.accessor("created", { header: t("createdOn") }),
      // ✅ Difficulty with background colors
    columnHelper.display({
      header: t("difficulty").toUpperCase(),
      cell: (cell) => {
        const value = cell.row.original.diff?.toLowerCase();
        let style =
          "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800";

        if (value === "easy") {
          style =
            "px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800";
        } else if (value === "medium") {
          style =
            "px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800";
        } else if (value === "hard") {
          style =
            "px-2 py-1 rounded-full text-xs font-medium  bg-blue-100 text-blue-800";
        }

        return <span className={style}>{t(value) || cell.row.original.diff}</span>;
      },
    }),
    
      // ✅ Assigned HR column with count & popup
      columnHelper.display({
        header: t("assigned"),
        cell: (cell) => {
          const count = cell.row.original.hrname?.length || 0;
          if (count === 0) return "—";
          return (
            <button
              className="text-blue-600 font-medium underline text-sm"
              onClick={() => {
                setPopupHrNames(cell.row.original.hrname);
                setShowAssignedHrPopup(true);
              }}
            >
              {count}
              {/* HR{count > 1 ? "s" : ""} */}
            </button>
          );
        },
      }),
      columnHelper.display({
        header: t("action"),
        cell: (cell) => (
          <div className="flex space-x-4">
            <button
              onClick={() => openHrModal(cell.row.original)}
              disabled={
                hrList.length > 0 &&
                cell.row.original.hrname.length === hrList.length // disable only if ALL HRs assigned
              }
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                hrList.length > 0 &&
                cell.row.original.hrname.length === hrList.length
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md"
              }`}
              title={
                hrList.length > 0 &&
                cell.row.original.hrname.length === hrList.length
                  ? t("allHRsAssigned")
                  : t("assignMoreHRs")
              }
            >
              <FaPlus className="h-3 w-3 mr-1" />
              {t("assign")}
            </button>

            <button
              onClick={() => openRemoveHrModal(cell.row.original)}
              disabled={
                !cell.row.original.added ||
                cell.row.original.hrname.length === 0
              }
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                !cell.row.original.added ||
                cell.row.original.hrname.length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md"
              }`}
              title={
                !cell.row.original.added ||
                cell.row.original.hrname.length === 0
                  ? t("noHRsToRemove")
                  : t("removeFromHRs")
              }
            >
              <FaMinus className="h-3 w-3 mr-1" />
              {t("remove")}
            </button>

            {cell.row.original.added && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <FaCheck className="h-3 w-3 mr-1" />
                {t("assigned")}
              </span>
            )}
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue("testName");
      return value.toLowerCase().includes(filterValue.toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

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

  return (
    <div className="min-h-screen ">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900"></h2>
            </div>
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t("searchTests")}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Test List</h3>
          </div> */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-600">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                      >
                        {typeof header.column.columnDef.header === "function"
                          ? header.column.columnDef.header()
                          : header.column.columnDef.header}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {/* Check if no rows exist and display "No Test Available" */}
        {table.getRowModel().rows.length === 0 ? (
          <tr>
            <td
              colSpan={table.getHeaderGroups()[0].headers.length} // Span across all columns
              className="px-6 py-4 text-center text-sm text-gray-500"
            >
              No Test Available
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={`transition-all duration-200 hover:bg-blue-50 ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {cell.column.columnDef.cell
                    ? cell.column.columnDef.cell(cell)
                    : cell.getValue()}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 p-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {t("previous")}
              </button>

              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-700">{t("page")}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-lg">
                  {table.getState().pagination.pageIndex + 1}
                </span>
                <span className="text-sm text-gray-700">
                  {t("of")} {table.getPageCount()}
                </span>
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {t("next")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HR Assignment Modal */}
      {showHrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gray-600 px-6 py-4 flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FaUsers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {t("assignHRPersonnel")}
                </h3>
                <p className="text-blue-100 text-sm">
                  {t("selectHRsToAssign")}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Test:{" "}
                  <span className="font-semibold text-gray-900">
                    {modalRow?.testName}
                  </span>
                </p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {hrList
                  .map((hr) => {
                    const name = `${hr.firstName} ${hr.lastName}`;
                    const checked = selectedHRs.includes(name);
                    const alreadyAssigned = modalRow?.hrname?.includes(name);

                    // Skip already assigned HRs
                    if (alreadyAssigned) return null;

                    return (
                      <label
                        key={hr._id.$oid || hr._id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedHRs((prev) =>
                              checked
                                ? prev.filter((n) => n !== name)
                                : [...prev, name]
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {name}
                          </span>
                        </div>
                        {checked && (
                          <FaCheck className="h-4 w-4 text-green-500" />
                        )}
                      </label>
                    );
                  })
                  .filter(Boolean)}

                {hrList.every((hr) =>
                  modalRow?.hrname?.includes(`${hr.firstName} ${hr.lastName}`)
                ) && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    All HRs are already assigned to this test.
                  </p>
                )}
              </div>

              {selectedHRs.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">{selectedHRs.length}</span>{" "}
                    HR(s) selected: {selectedHRs.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowHrModal(false);
                  setModalRow(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmHrSelection}
                disabled={selectedHRs.length === 0 || processing}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedHRs.length === 0 || processing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Assign Test"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned HR Names Popup */}
      {/* Assigned HR Names Popup (styled like HR Assignment Modal) */}
      {showAssignedHrPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-600 px-6 py-4 flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FaUsers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Assigned HR Personnel
                </h3>
                <p className="text-blue-100 text-sm">
                  View HR(s) assigned to this test
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {popupHrNames.length === 0 ? (
                  <p className="text-gray-500 text-sm">No HR assigned.</p>
                ) : (
                  popupHrNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {name}
                      </span>
                      <FaCheck className="h-4 w-4 text-green-500" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowAssignedHrPopup(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove HR Modal */}
      {showRemoveHrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FaMinus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Remove HR Personnel
                </h3>
                <p className="text-red-100 text-sm">
                  Select HR(s) to remove from this test
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Test:{" "}
                  <span className="font-semibold text-gray-900">
                    {removeModalRow?.testName}
                  </span>
                </p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {removeModalRow?.hrname?.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No HRs assigned to this test.
                  </p>
                ) : (
                  removeModalRow?.hrname?.map((name, index) => {
                    const checked = selectedRemoveHRs.includes(name);
                    return (
                      <label
                        key={index}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedRemoveHRs((prev) =>
                              checked
                                ? prev.filter((n) => n !== name)
                                : [...prev, name]
                            )
                          }
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {name}
                          </span>
                        </div>
                        {checked && (
                          <FaMinus className="h-4 w-4 text-red-500" />
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {selectedRemoveHRs.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">
                      {selectedRemoveHRs.length}
                    </span>{" "}
                    HR(s) selected for removal: {selectedRemoveHRs.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRemoveHrModal(false);
                  setRemoveModalRow(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmHrRemoval}
                disabled={selectedRemoveHRs.length === 0 || processing}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedRemoveHRs.length === 0 || processing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {processing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Remove Selected"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

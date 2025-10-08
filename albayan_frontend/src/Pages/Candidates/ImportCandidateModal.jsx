import { FiX, FiUpload } from "react-icons/fi";
import { useState } from "react";
import * as XLSX from "xlsx";
import { uid, BaseUrl, SuperAdminID } from "../../Api/Api";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";

export const ImportCandidatesModal = ({ show, onClose, onImportSuccess, existingCandidate }) => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  // Define required headers for candidates (English)
  const REQUIRED_HEADERS_EN = [
    "Name *",
    "Email *",
    "Country",
    "Code",
    "Phone",
    "Language",
    "Role",
    "Skills"
  ];


  // Define required headers for candidates (Arabic)
  const REQUIRED_HEADERS_AR = [
    "الاسم *",
    "البريد الإلكتروني *",
    "الدولة",
    "الرمز",
    "الهاتف",   // remove the leading space!
    "اللغة",
    "الدور",
    "المهارات"
  ];

  // Validate headers based on current language
  const validateHeaders = (headers) => {
    const expectedHeaders = currentLanguage === 'ar' ? REQUIRED_HEADERS_AR : REQUIRED_HEADERS_EN;

    if (headers.length !== expectedHeaders.length) {
      return false;
    }

    return expectedHeaders.every((header, idx) =>
      headers[idx]?.trim() === header
    );
  };

  // Check if file is in correct language
  const isCorrectLanguage = (headers) => {
    if (currentLanguage === 'ar') {
      // When Arabic is selected, check if headers are Arabic
      return REQUIRED_HEADERS_AR.every((header, idx) =>
        headers[idx]?.trim() === header
      );
    } else {
      // When English is selected, check if headers are English
      return REQUIRED_HEADERS_EN.every((header, idx) =>
        headers[idx]?.trim() === header
      );
    }
  };

  console.log('existingCanddate', existingCandidate)
  const normalizeKeys = (data, userId) => {
    const today = new Date();

    return data.map((row) => {
      // Handle both English and Arabic headers
      const getName = () => {
        return row["Name *"] || row["الاسم *"] || "";
      };

      const getEmail = () => {
        return row["Email *"] || row["البريد الإلكتروني *"] || "";
      };

      const getPhone = () => {
        return row["Phone"] || row["الهاتف"] || "";
      };

      const getCode = () => {
        return row["Code"] || row["الرمز"] || "";
      };

      const getCountry = () => {
        return row["Country"] || row["الدولة"] || "";
      };

      const getLanguage = () => {
        return row["Language"] || row["اللغة"] || "";
      };

      const getRole = () => {
        return row["Role"] || row["الدور"] || "";
      };

      const getSkills = () => {
        return row["Skills"] || row["المهارات"] || "";
      };


      const rawPhone = String(getPhone()).trim();
      const rawCode = String(getCode()).replace("+", "").trim(); // clean up

      // Always store separately like manual add
      const countryCode = rawCode ? `+${rawCode}` : "";

      // ✅ Keep full number in phone field (without + sign)
      let phoneOnly = rawPhone;
      if (rawCode && !rawPhone.startsWith(rawCode)) {
        phoneOnly = rawCode + rawPhone; // prepend code if not already included
      }

      const skillsArray = getSkills()
        ? getSkills().split(/[;,]/).map((s) => s.trim())
        : [];

      return {
        name: getName(),
        email: getEmail(),
        country: getCountry(),
        countryCode,             // ✅ same as manual add
        phone: phoneOnly,        // ✅ now stores 918098388674
        preferredLanguage: getLanguage(),
        role: getRole(),
        skills: skillsArray,
        created: { $date: today.toISOString() },
        status: "Registered",
        completed: 0,
        assigned: 0,
        score: "0%",
        userId: { $oid: userId },
      };
    });
  };


  // const handleFileUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   console.log('existing', existingCandidate)

  //   setLoading(true);

  //   try {
  //     //  Extract token from sessionStorage
  //     // Extract token and userId
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

  //     // Read Excel
  //     const data = await file.arrayBuffer();
  //     const workbook = XLSX.read(data);
  //     const sheetName = workbook.SheetNames[0];
  //     const sheet = workbook.Sheets[sheetName];
  //     const jsonData = XLSX.utils.sheet_to_json(sheet);

  //     // Normalize and map payload
  //     const normalizedData = normalizeKeys(jsonData, userId);

  //     // Send API requests
  //     for (const payload of normalizedData) {
  //       const finalPayload = {
  //         ...payload,
  //         sa: SuperAdminID, // 👈 include SuperAdminID
  //       };

  //       await fetch(`${BaseUrl}/auth/eCreateCol?colname=${uid}_Candidates`, {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //           xxxid: uid,
  //         },
  //         body: JSON.stringify(payload),
  //       });
  //     }

  //     toast.success(
  //       `${normalizedData.length} candidates imported successfully`
  //     );
  //     onClose();
  //     if (onImportSuccess) onImportSuccess();
  //   } catch (error) {
  //     console.error(error);
  //     toast.error(error.message || "Failed to import candidates");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      // Extract token and userId
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

      // Read Excel and validate headers
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length === 0) {
        toast.error(t("Excel file is empty!"));
        return;
      }

      const headers = jsonData[0] || [];

      // Validate headers format
      if (!validateHeaders(headers)) {
        toast.error(t("invalidExcelFormat"));
        return;
      }

      // Check if file language matches selected language
      if (!isCorrectLanguage(headers)) {
        toast.error(t("invalidExcelLanguage"));
        return;
      }

      // Convert to JSON format for processing
      const jsonCandidates = XLSX.utils.sheet_to_json(sheet);

      // Normalize
      const normalizedData = normalizeKeys(jsonCandidates, userId);

      let addedCount = 0;
      let duplicateNames = []; // collect duplicate candidate names

      for (const payload of normalizedData) {
        const exists = existingCandidate.some((c) => {
          const sameEmail = c.email?.toLowerCase() === payload.email?.toLowerCase();
          // const sameRole = c.role?.toLowerCase() === payload.role?.toLowerCase();
          const sameSkills =
            (c.skills || []).sort().join(",") === (payload.skills || []).sort().join(",");

          return sameEmail && sameSkills;
        });

        if (exists) {
          duplicateNames.push(payload.name || payload.email); // store duplicate name/email
          continue; // skip API call
        }

        // ✅ save new candidate
        const finalPayload = { ...payload, sa: SuperAdminID };
        await fetch(`${BaseUrl}/auth/eCreateCol?colname=${uid}_Candidates`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            xxxid: uid,
          },
          body: JSON.stringify(finalPayload),
        });
        addedCount++;
      }

   // 🔔 Show duplicate error (if any)
if (duplicateNames.length > 0) {
  toast.error(
    `${t("Thesecandidatesarealreadyregisteredforthisroleandskills")}: ${duplicateNames.join(", ")}`,
    { duration: 2000 }
  );
}

      // ✅ Show success toast immediately after error
      if (addedCount > 0) {
        setTimeout(() => {
          toast.success(`${addedCount} ${t("candidatesImportedSuccessfully")}`);
          if (onImportSuccess) onImportSuccess();
        }, duplicateNames.length > 0 ? 2000 : 0); // wait for error toast to finish
      }

      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || t("failedToImportCandidates"));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("importCandidates")}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              {t("excelFormatRequired")}
            </h4>
            <div className="text-sm text-blue-800 font-mono bg-blue-100 p-2 rounded">
              {currentLanguage === 'ar'
                ? REQUIRED_HEADERS_AR.join(" | ")
                : REQUIRED_HEADERS_EN.join(" | ")
              }
            </div>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                <strong>{t("example")}:</strong>
              </p>
              <div className="font-mono text-xs bg-blue-100 p-2 rounded mt-1">
                {currentLanguage === 'ar'
                  ? "يحيى أحمد,yaya@email.com,+966123456789,966,السعودية,العربية,مطور,JavaScript;برمجة;تصميم"
                  : "John Doe,john@email.com,+1-555-0123,1,United States,English,Developer,JavaScript;React;Node.js"
                }
              </div>
            </div>
          </div>

          {/* Drop Zone */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center border-gray-300 hover:border-gray-400 cursor-pointer">
            <FiUpload size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {t("dropExcelFile")}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {t("onlyExcelSupported")}
            </p>
            <label className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <FiUpload />
              <span>{loading ? t("uploading") : t("chooseExcelFile")}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

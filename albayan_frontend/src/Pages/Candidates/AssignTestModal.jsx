// import { FiX, FiUpload, FiFileText } from "react-icons/fi";
// import { FaExclamationTriangle } from "react-icons/fa";
// import { LuSend } from "react-icons/lu";
// import { useState, useEffect } from "react";
// import { uid, BaseUrl } from "../../Api/Api";
// import { Toaster, toast } from "react-hot-toast";
// import { useLanguage } from "../../contexts/LanguageContext";

// export const AssignTestsModal = ({ show, onClose, candidate, tests, onAssign, onSaveSuccess, }) => {
//   const { t } = useLanguage();
//   const [selectedTests, setSelectedTests] = useState([]);
//   const [scheduledDate, setScheduledDate] = useState("");
//   const [loading, setLoading] = useState(false);  // 🔹 new state
//   const totalQuestions = selectedTests?.reduce((sum, t) => sum + (t.questionCount || 0), 0);
//   const totalDuration = selectedTests?.reduce((sum, t) => sum + (t.dur || 0), 0);

//   // 🔹 Extract user info & role
//   const storedData = sessionStorage.getItem("loginResponse");
//   const parsedData = storedData ? JSON.parse(storedData) : null;
//   const userInfoSession = parsedData?.source ? JSON.parse(parsedData.source) : null;
//   const role = userInfoSession?.role || "3";
//   const hrFullName = `${userInfoSession?.firstName || ""} ${userInfoSession?.lastName || ""}`.trim();
//   console.log('hrFullName', hrFullName, role, tests)

//   const [searchQuery, setSearchQuery] = useState("");
//   let matchedTests = [];

//   if (role === "3") {
//     // 🔹 HR role → only tests assigned to this HR
//     matchedTests = tests.filter(test =>
//       Array.isArray(test.hrname) && test.hrname.includes(hrFullName)
//     );
//   } else if (tests.length > 0 && candidate?.skills?.length > 0) {
//     // 🔹 Other roles → skill-based matching
//     matchedTests = tests.filter(test =>
//       candidate.skills.some(skill =>
//         test.title.toLowerCase().includes(skill.toLowerCase())
//       )
//     );
//   }

//   const searchedTests = searchQuery
//     ? (role === "3"
//       ? matchedTests.filter((test) =>
//         test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         test.qs.some(q =>
//           (q.text || q.q || "").toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       )
//       : tests.filter((test) =>
//         test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         test.qs.some(q =>
//           (q.text || q.q || "").toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       )
//     )
//     : [];



//   const mergeUniqueTests = (arr1, arr2) => {

//     const map = new Map();
//     [...arr1, ...arr2].forEach((test) => {
//       map.set(test.id, test); // overwrites duplicates by id
//     });
//     return Array.from(map.values());
//   };

//   const finalTests = searchQuery
//     ? mergeUniqueTests(searchedTests, selectedTests)
//     : mergeUniqueTests(matchedTests, selectedTests);


//   useEffect(() => {
//     if (candidate && tests.length > 0) {
//       let matchedTests = [];

//       if (role === "3") {
//         // 🔹 HR role → show only HR-created tests
//         matchedTests = tests.filter(
//           test => Array.isArray(test.hrname) && test.hrname.includes(hrFullName)
//         );

//         // 🔹 Preselect only if it ALSO matches candidate skills
//         const preselected = matchedTests
//           .filter(test =>
//             candidate.skills?.some(skill =>
//               test.title.toLowerCase().includes(skill.toLowerCase())
//             )
//           )
//           .map(test => ({
//             ...test,
//             questionCount: test.qs.length,
//             qns: test.qs.map(q => q.id),
//             dur: Math.ceil(
//               test.qs.reduce((sum, q) => sum + (q.time || 0), 0) / 60
//             ),
//           }));

//         setSelectedTests(preselected);
//       } else if (candidate.skills && candidate.skills.length > 0) {
//         // 🔹 Other roles → preselect skill-based matches
//         matchedTests = tests.filter(test =>
//           candidate.skills.some(skill =>
//             test.title.toLowerCase().includes(skill.toLowerCase())
//           )
//         );

//         const initialTests = matchedTests.map(test => ({
//           ...test,
//           questionCount: test.qs.length,
//           qns: test.qs.map(q => q.id),
//           dur: Math.ceil(
//             test.qs.reduce((sum, q) => sum + (q.time || 0), 0) / 60
//           ),
//         }));

//         setSelectedTests(initialTests);
//       }
//     }
//   }, [candidate, tests]);



//   const toggleTest = (test) => {
//     setSelectedTests((prev) => {
//       const exists = prev.find((t) => t.id === test.id);
//       if (exists) {
//         return prev.filter((t) => t.id !== test.id);
//       } else {
//         return [...prev, {
//           ...test,
//           questionCount: test.qs.length,
//           qns: test.qs.map(q => q.id), // ✅ include all question IDs
//           dur: Math.ceil(test.qs.reduce((sum, q) => sum + (q.time || 0), 0) / 60) // optional: calculate duration
//         }];
//       }
//     });
//   };

//   const handleClose = () => {
//     setScheduledDate("");      // Reset date
//     onClose();                 // Call parent close
//   };

//   const toggleQuestion = (testId, question) => {
//     setSelectedTests((prev) =>
//       prev.map((t) => {
//         if (t.id === testId) {
//           const exists = t.qns.includes(question.id);
//           let updatedQns;
//           if (exists) {
//             updatedQns = t.qns.filter((q) => q !== question.id);
//           } else {
//             updatedQns = [...t.qns, question.id];
//           }
//           const selectedQuestions = t.qs.filter((q) =>
//             updatedQns.includes(q.id)
//           );
//           const newDuration = Math.ceil(
//             selectedQuestions.reduce((sum, q) => sum + (q.time || 0), 0) / 60
//           );
//           return {
//             ...t,
//             qns: updatedQns,
//             questionCount: updatedQns.length,
//             dur: newDuration,
//           };
//         }
//         return t;
//       })
//     );
//   };

//   const handleAssignTests = async () => {
//     if (selectedTests.length === 0) {
//       toast.error(t("pleaseSelectAtLeastOneTest"));
//       return;
//     }
//     if (!scheduledDate) {
//       toast.error(t("pleaseScheduleDate"));
//       return;
//     }
//     try {
//       setLoading(true);
//       const today = new Date();

//       const payload = {
//         asnT: selectedTests.map((t) => ({
//           tid: t.tid,
//           title: t.title,
//           qnC: t.questionCount,
//           dur: t.dur || 0,
//           qns: t.qns || []
//         })),
//         TqnC: selectedTests.reduce((acc, t) => acc + t.questionCount, 0),
//         assigned: 1,
//         scheduledDate: scheduledDate
//           ? { $date: new Date(scheduledDate + "T00:00:00Z").toISOString() }
//           : null,
//         updatedAt: { $date: today.toISOString() }
//       };

//       const resourceId = candidate.id;
//       const storedData = sessionStorage.getItem("loginResponse");
//       let token = null;
//       if (storedData) {
//         const parsedData = JSON.parse(storedData);
//         if (parsedData.source) {
//           const sourceObj = JSON.parse(parsedData.source);
//           token = sourceObj.token;
//         }
//       }

//       if (!token) {
//         throw new Error("Token not found");
//       }

//       const response = await fetch(
//         `${BaseUrl}/auth/eUpdateColl?ColName=${uid}_Candidates&resourceId=${resourceId}`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             xxxid: uid,
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to update candidate data");
//       }

//       toast.success(t("testsAssignedSuccessfully"));
//       if (onSaveSuccess) onSaveSuccess();
//       onAssign({
//         ...candidate,
//         ...payload
//       });
//       onClose();
//     } catch (error) {
//       console.error("Error assigning tests:", error);
//       toast.error(t("failedToAssignTests"));
//     }
//     finally {
//       setLoading(false);
//     }
//   };


//   if (!show || !candidate) return null;



//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">

//         {/* Header */}
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-lg font-semibold text-gray-900">
//             {t("assignTestsTo")} {candidate.name}
//           </h3>
//           <button className="text-gray-400 hover:text-gray-600" onClick={handleClose}>
//             <FiX size={20} />
//           </button>
//         </div>

//         {/* Candidate Info */}
//         <div className="bg-blue-50 rounded-lg p-4 mb-6">
//           <div className="flex items-center space-x-3">
//             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
//               <span className="text-blue-600 font-medium text-sm">{candidate.initials}</span>
//             </div>
//             <div>
//               <h4 className="font-medium text-blue-900">{candidate.name}</h4>
//               <p className="text-sm text-blue-700">{candidate.email} • {candidate.role}</p>
//             </div>
//           </div>
//         </div>

//         {/* Selected Summary */}
//         <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
//           <span className="text-sm text-green-800">
//             {selectedTests.length} {t("testsSelected")}
//           </span>
//           <div className="flex space-x-4 text-sm text-green-900 font-medium">
//             <span>{t("totalQns")}: {selectedTests.reduce((acc, t) => acc + (t.questionCount || 0), 0)}</span>
//             <span>{t("totalDuration")}: {selectedTests.reduce((acc, t) => acc + (t.dur || 0), 0)} min</span>
//           </div>
//         </div>

//         {/* Search Bar */}
//         <div className="mb-4 flex items-center border border-gray-300 rounded-lg px-3 py-2">
//           <input
//             type="text"
//             placeholder={t("searchTestByTitle")}
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="flex-1 text-sm outline-none"
//           />
//           <FiFileText className="text-gray-400" />
//         </div>


//         {/* Test List */}
//         <div className="flex-1 overflow-y-auto space-y-3 mb-6">
//           {finalTests.length > 0 ? (
//             finalTests.map((test) => {
//               const isSelected = selectedTests.some((t) => t.id === test.id);
//               const selectedTest = selectedTests.find((t) => t.id === test.id);

//               return (
//                 <div
//                   key={test.id}
//                   className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-3">
//                       <input
//                         type="checkbox"
//                         checked={isSelected}
//                         onChange={() => toggleTest(test)}
//                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                       />
//                       <h4 className="font-medium text-gray-900">{test.title}</h4>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <span
//                         className={`text-xs px-2 py-1 rounded-full ${test.diff === "Easy"
//                           ? "bg-green-100 text-green-800"
//                           : test.diff === "Medium"
//                             ? "bg-yellow-100 text-yellow-800"
//                             : "bg-red-100 text-red-800"
//                           }`}
//                       >
//                         {test.diff || "Medium"}
//                       </span>
//                       <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
//                         {selectedTest ? selectedTest.dur : test.dur}min
//                       </span>
//                     </div>
//                   </div>

//                   {isSelected && (
//                     <div className="mt-3 space-y-2">
//                       <label className="text-sm text-gray-600">{t("selectQuestions")}:</label>
//                       {test.qs.map((q) => (
//                         <div key={q.id} className="flex items-center space-x-2 pl-4">
//                           <input
//                             type="checkbox"
//                             checked={selectedTest?.qns.includes(q.id) || false}
//                             onChange={() => toggleQuestion(test.id, q)}
//                             className="w-4 h-4 text-blue-600 border-gray-300 rounded"
//                           />
//                           <span className="text-sm text-gray-800">{q.text || `${q.q}`}</span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })
//           ) : (
//             <div className="p-4 text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg">
//               {role === "3"
//                 ? searchQuery
//                   ? t("thisTestNotAssignedToYou")
//                   : t("noTestsAssignedToYou")
//                 : t("noTestsFoundForSkills")}
//             </div>
//           )}
//         </div>


//         {/* Footer */}
//         <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">

//           <div className="flex items-center space-x-2">
//             <label className="text-sm font-medium text-gray-700 ">
//               {t("scheduleDate")}:<span className="text-red-500 text-base font-bold">*</span>
//             </label>
//             <input
//               type="date"
//               value={scheduledDate}
//               onChange={(e) => setScheduledDate(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
//             />
//           </div>


//           <button
//             className={`px-4 py-2 rounded-lg transition-colors ${loading
//               ? "bg-gray-400 cursor-not-allowed text-white"
//               : "bg-blue-600 text-white hover:bg-blue-700"
//               }`}
//             onClick={handleAssignTests}
//             disabled={loading}
//           >
//             {loading ? t("assigning") : `${t("assignTests")} (${selectedTests.length})`}
//           </button>

//           <button
//             className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//             onClick={handleClose}
//           >
//             {t("cancel")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };




import { FiX, FiUpload, FiFileText } from "react-icons/fi";
import { FaExclamationTriangle } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { useState, useEffect } from "react";
import { uid, BaseUrl } from "../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";


export const AssignTestsModal = ({ show, onClose, candidate, tests, onAssign, onSaveSuccess, }) => {
  const { t } = useLanguage();

  const [selectedTests, setSelectedTests] = useState([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);  // 🔹 new state
  const totalQuestions = selectedTests?.reduce((sum, t) => sum + (t.questionCount || 0), 0);
  const totalDuration = selectedTests?.reduce((sum, t) => sum + (t.dur || 0), 0);
  const [editableDuration, setEditableDuration] = useState(totalDuration.toString());
  // 🔹 Extract user info & role
  const storedData = sessionStorage.getItem("loginResponse");
  const parsedData = storedData ? JSON.parse(storedData) : null;
  const userInfoSession = parsedData?.source ? JSON.parse(parsedData.source) : null;
  const role = userInfoSession?.role || "3";
  const hrFullName = `${userInfoSession?.firstName || ""} ${userInfoSession?.lastName || ""}`.trim();
  console.log('hrFullName', hrFullName, role, tests)

  const [searchQuery, setSearchQuery] = useState("");

  // update when totalDuration changes
  useEffect(() => {
    setEditableDuration(totalDuration.toString());
  }, [totalDuration]);


  let matchedTests = [];

  if (role === "3") {
    // 🔹 HR role → only tests assigned to this HR
    matchedTests = tests.filter(test =>
      Array.isArray(test.hrname) && test.hrname.includes(hrFullName)
    );
  } else if (tests.length > 0 && candidate?.skills?.length > 0) {
    // 🔹 Other roles → skill-based matching
    matchedTests = tests.filter(test =>
      candidate.skills.some(skill =>
        test.title.toLowerCase().includes(skill.toLowerCase())
      )
    );
  }
  const searchedTests = searchQuery
    ? (role === "3"
      ? matchedTests.filter((test) =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.qs.some(q =>
          (q.text || q.q || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      : tests.filter((test) =>
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.qs.some(q =>
          (q.text || q.q || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    )
    : [];

  const mergeUniqueTests = (arr1, arr2) => {

    const map = new Map();
    [...arr1, ...arr2].forEach((test) => {
      map.set(test.id, test); // overwrites duplicates by id
    });
    return Array.from(map.values());
  };

  // const finalTests = searchQuery
  //   ? mergeUniqueTests(searchedTests, selectedTests)
  //   : mergeUniqueTests(matchedTests, selectedTests);
  const finalTests = searchQuery
    ? mergeUniqueTests(searchedTests, selectedTests)
    : role === "3"
      ? selectedTests // 🔹 Only show preselected tests for HR
      : mergeUniqueTests(matchedTests, selectedTests);


  useEffect(() => {
    if (candidate && tests.length > 0) {
      let matchedTests = [];

      if (role === "3") {
        // 🔹 HR role → show only HR-created tests
        matchedTests = tests.filter(
          test => Array.isArray(test.hrname) && test.hrname.includes(hrFullName)
        );

        // 🔹 Preselect only if it ALSO matches candidate skills
        const preselected = matchedTests
          .filter(test =>
            candidate.skills?.some(skill =>
              test.title.toLowerCase().includes(skill.toLowerCase())
            )
          )
          .map(test => ({
            ...test,
            questionCount: test.qs.length,
            qns: test.qs.map(q => q.id),
            dur: Math.ceil(
              test.qs.reduce((sum, q) => sum + (q.time || 0), 0) / 60
            ),
          }));

        setSelectedTests(preselected);
      } else if (candidate.skills && candidate.skills.length > 0) {
        // 🔹 Other roles → preselect skill-based matches
        matchedTests = tests.filter(test =>
          candidate.skills.some(skill =>
            test.title.toLowerCase().includes(skill.toLowerCase())
          )
        );

        const initialTests = matchedTests.map(test => ({
          ...test,
          questionCount: test.qs.length,
          qns: test.qs.map(q => q.id),
          dur: Math.ceil(
            test.qs.reduce((sum, q) => sum + (q.time || 0), 0) / 60
          ),
        }));

        setSelectedTests(initialTests);
      }
    }
  }, [candidate, tests]);



  const toggleTest = (test) => {
    setSelectedTests((prev) => {
      const exists = prev.find((t) => t.id === test.id);
      if (exists) {
        return prev.filter((t) => t.id !== test.id);
      } else {
        return [...prev, {
          ...test,
          questionCount: test.qs.length,
          qns: test.qs.map(q => q.id), // ✅ include all question IDs
          dur: Math.ceil(test.qs.reduce((sum, q) => sum + (q.time || 0), 0) / 60) // optional: calculate duration
        }];
      }
    });
  };

  const handleClose = () => {
    setScheduledDate("");      // Reset date
    setExpiryDate("");         // Reset expiry date
    onClose();                 // Call parent close
  };

  const toggleQuestion = (testId, question) => {
    setSelectedTests((prev) =>
      prev.map((t) => {
        if (t.id === testId) {
          const exists = t.qns.includes(question.id);
          let updatedQns;
          if (exists) {
            updatedQns = t.qns.filter((q) => q !== question.id);
          } else {
            updatedQns = [...t.qns, question.id];
          }
          const selectedQuestions = t.qs.filter((q) =>
            updatedQns.includes(q.id)
          );
          const newDuration = Math.ceil(
            selectedQuestions.reduce((sum, q) => sum + (q.time || 0), 0) / 60
          );
          return {
            ...t,
            qns: updatedQns,
            questionCount: updatedQns.length,
            dur: newDuration,
          };
        }
        return t;
      })
    );
  };

  const handleAssignTests = async () => {
    if (selectedTests.length === 0) {
      toast.error("Please select at least one test!");
      return;
    }
    if (!scheduledDate) {
      toast.error("Please schedule a date before assigning the test!");
      return;
    }
    try {
      setLoading(true);
      const today = new Date();

      // First, fetch the current candidate data to check if they already exist
      const resourceId = candidate.id;
      const storedData = sessionStorage.getItem("loginResponse");
      let token = null;
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.source) {
          const sourceObj = JSON.parse(parsedData.source);
          token = sourceObj.token;
        }
      }

      if (!token) {
        throw new Error("Token not found");
      }

      // Fetch current candidate data using the existing API
      const getResponse = await fetch(
        `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&distinct_field=email&email=${encodeURIComponent(candidate.email)}`,
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
      if (getResponse.ok) {
        const currentCandidateData = await getResponse.json();
        if (currentCandidateData?.source && currentCandidateData.source.length > 0) {
          // Find the exact candidate by ID to ensure we're working with the right record
          const candidateData = currentCandidateData.source.find(item => {
            const parsed = typeof item === "string" ? JSON.parse(item) : item;
            return (parsed._id?.$oid || parsed._id) === candidate.id;
          });
          
          if (candidateData) {
            existingCandidate = typeof candidateData === 'string' ? 
              JSON.parse(candidateData) : candidateData;
          }
        }
      }

      // Prepare new tests to add
      const newTests = selectedTests.map((t) => ({
        tid: t.tid,
        title: t.title, // This will store the test name
        qnC: t.questionCount,
        dur: t.dur || 0,
        qns: t.qns || []
      }));

      // Extract user info for creating new records
      const storedDataForUser = sessionStorage.getItem("loginResponse");
      const parsedDataForUser = storedDataForUser ? JSON.parse(storedDataForUser) : null;
      const userInfoSession = parsedDataForUser?.source ? JSON.parse(parsedDataForUser.source) : null;
      const firstName = userInfoSession?.firstName || "";
      const lastName = userInfoSession?.lastName || "";
      const userId = userInfoSession?._id?.$oid || userInfoSession?._id || null;

      // Function to generate unique test ID
      const generateUniqueTestId = () => {
        return Math.random().toString(36).substr(2, 12);
      };

      // Check if candidate already has tests assigned
      if (existingCandidate && existingCandidate.asnT && Array.isArray(existingCandidate.asnT) && existingCandidate.asnT.length > 0) {
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
          assigned: selectedTests.length,
          score: "0%",
          userId: candidate.userId || { $oid: userId },
          sa: userId,
          // New assessment data
          TqnC: selectedTests.reduce((acc, t) => acc + t.questionCount, 0),
          Tdur: editableDuration === "" ? 0 : parseInt(editableDuration, 10),
          scheduledDate: scheduledDate
            ? { $date: new Date(scheduledDate + "T00:00:00Z").toISOString() }
            : null,
          expiryDate: expiryDate
            ? { $date: new Date(expiryDate + "T23:59:59Z").toISOString() }
            : null,
          updatedAt: { $date: today.toISOString() },
          createdby: `${firstName} ${lastName}`,
          uniqueTestId: generateUniqueTestId(),
          asnT: newTests,
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
          throw new Error("Failed to create new candidate record");
        }
      } else {
        // First time assigning tests or candidate has no tests - update existing document
        const payload = {
          asnT: newTests,
          TqnC: selectedTests.reduce((acc, t) => acc + t.questionCount, 0),
          Tdur: editableDuration === "" ? 0 : parseInt(editableDuration, 10),
          assigned: selectedTests.length,
          scheduledDate: scheduledDate
            ? { $date: new Date(scheduledDate + "T00:00:00Z").toISOString() }
            : null,
          expiryDate: expiryDate
            ? { $date: new Date(expiryDate + "T23:59:59Z").toISOString() }
            : null,
          updatedAt: { $date: today.toISOString() }
        };

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

        if (!response.ok) {
          throw new Error("Failed to update candidate data");
        }
      }

      toast.success(t("testassignSuccess"));
      if (onSaveSuccess) onSaveSuccess();
      onAssign({
        ...candidate,
        ...payload
      });
      onClose();
    } catch (error) {
      console.error("Error assigning tests:", error);
      toast.error("❌ Failed to assign tests. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };


  if (!show || !candidate) return null;



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("assignTestsTo")}  {candidate.name}
          </h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={handleClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Candidate Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            {/* <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">{candidate.initials}</span>
            </div> */}
            <div>
              <h4 className="font-medium text-blue-900">{candidate.name}</h4>
              <p className="text-sm text-blue-700">{candidate.email} • {candidate.role}</p>
            </div>
          </div>
        </div>

        {/* Selected Summary */}
        {/* <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <span className="text-sm text-green-800">
                {selectedTests.length} tests selected
              </span>
              <div className="flex space-x-4 text-sm text-green-900 font-medium">
                <span>Total Qns: {selectedTests.reduce((acc, t) => acc + (t.questionCount || 0), 0)}</span>
                <span>Total Duration: {selectedTests.reduce((acc, t) => acc + (t.dur || 0), 0)} min</span>
              </div>
            </div> */}

        {/* Selected Summary */}
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <span className="text-sm text-green-800">
            {selectedTests.length} {t("testsSelected")}
          </span>

          <div className="flex items-center space-x-6 text-sm font-medium text-green-900">
            {/* Total Questions */}
            <span>
              {t("totalQns")}: {selectedTests.reduce((acc, t) => acc + (t.questionCount || 0), 0)}
            </span>

            {/* Editable Duration */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-green-900">{t("totalDuration")}:</label>
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
                onWheel={(e) => e.target.blur()}  // ✅ disables scroll changing
                className="w-20 border border-green-300 rounded px-2 py-1 text-sm"
              />

              <span className="text-green-900">min</span>
            </div>
          </div>
        </div>


        {/* Search Bar */}
        <div className="mb-4 flex items-center border border-gray-300 rounded-lg px-3 py-2">
          <input
            type="text"
            placeholder={t("searchTestByTitle")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm outline-none"
          />
          <FiFileText className="text-gray-400" />
        </div>


        {/* Test List */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {finalTests.length > 0 ? (
            finalTests.map((test) => {
              const isSelected = selectedTests.some((t) => t.id === test.id);
              const selectedTest = selectedTests.find((t) => t.id === test.id);

              return (
                <div
                  key={test.id}
                  className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTest(test)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <h4 className="font-medium text-gray-900">{test.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${test.diff === "Easy"
                          ? "bg-green-100 text-green-800"
                          : test.diff === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {test.diff || "Medium"}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {selectedTest ? selectedTest.dur : test.dur}min
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 space-y-2">
                      <label className="text-sm text-gray-600">{t("selectQuestions")}:</label>
                      {test.qs.map((q) => (
                        <div key={q.id} className="flex items-center space-x-2 pl-4">
                          <input
                            type="checkbox"
                            checked={selectedTest?.qns.includes(q.id) || false}
                            onChange={() => toggleQuestion(test.id, q)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-800">{q.text || `${q.q}`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // <div className="p-4 text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg">
            //   {role === "3"
            //     ? searchQuery
            //       ? "❌ This test is not assigned to you.For further info please contact Admin."
            //       : "⚠️ No tests assigned to you yet. For further info please contact Admin."
            //     : "⚠️ No tests found for your skills. You can search from the Test Library above."}
            // </div>
            <div className="p-4 text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg">
              {role === "3" ? (
                selectedTests.length === 0 && !searchQuery ? (
                  // 🔹 HR + No preselected (skill match) tests
                  "⚠️ No tests found for your skills. You can search from the Test Library above."
                ) : searchQuery ? (
                  "❌ This test is not assigned to you. For further info please contact Admin."
                ) : (
                  "⚠️ No tests assigned to you yet. For further info please contact Admin."
                )
              ) : (
                "⚠️ No tests found for your skills. You can search from the Test Library above."
              )}
            </div>

          )}
        </div>


        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 ">
              {t("scheduleDate")}:<span className="text-red-500 text-base font-bold">*</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}   // ✅ disable past dates
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 ">
              {t("expiryDate")}:
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={scheduledDate || new Date().toISOString().split("T")[0]}   // ✅ expiry must be after schedule date
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
          </div>


          <button
            className={`px-4 py-2 rounded-lg transition-colors ${loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            onClick={handleAssignTests}
            disabled={loading}
          >
            {loading ? t("assigning") : `${t("assignTests")} (${selectedTests.length})`}            </button>

          <button
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={handleClose}
          >
            {t("cancel")}

          </button>
        </div>
      </div>
    </div>
  );
};

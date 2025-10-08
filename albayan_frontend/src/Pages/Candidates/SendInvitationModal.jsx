import { FiX } from "react-icons/fi";
import { LuSend } from "react-icons/lu";
import { useState, useEffect } from "react";
import { uid, BaseUrl } from "../../Api/Api";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid"; // 👈 install with: npm install uuid
import { useLanguage } from "../../contexts/LanguageContext";

export const SendInvitesModal = ({
  show,
  onClose,
  selectedCandidates,
  candidates,
  inviteCandidate,
  clearSelectedCandidates,
  setCandidates,   // 👈 added

}) => {
  const { t } = useLanguage();
  if (!show) return null;

  // State to manage candidates in the modal
  const [candidatesToShow, setCandidatesToShow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customEmailBody, setCustomEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  // Initialize candidatesToShow when modal opens
  useEffect(() => {
    if (inviteCandidate) {
      setCandidatesToShow([inviteCandidate]);
    } else if (selectedCandidates && candidates) {
      const filtered = selectedCandidates
        .map((id) => candidates.find((c) => c.id === id))
        .filter((c) => c); // remove undefined
      setCandidatesToShow(filtered);
    }
  }, [inviteCandidate, selectedCandidates, candidates]);
  const handleSendInvites = async () => {
    if (candidatesToShow.length === 0) {
      toast.error("No candidates selected");
      return;
    }

    // Separate candidates with and without assigned tests
    const candidatesWithTest = candidatesToShow.filter(
      (c) => c.assignedTests && c.assignedTests.length > 0
    );
    const candidatesWithoutTest = candidatesToShow.filter(
      (c) => !c.assignedTests || c.assignedTests.length === 0
    );

    // Show toast for skipped candidates
    if (candidatesWithoutTest.length > 0) {
      const names = candidatesWithoutTest.map((c) => c.name).join(", ");
      toast.error(`No test assigned for: ${names}. They will be skipped.`);
    }

    if (candidatesWithTest.length === 0) {
      return; // nothing to send
    }

    try {
      setLoading(true);

      // Fetch complete candidate data from database for each candidate
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const fullCandidatesData = [];

      for (const candidate of candidatesWithTest) {
        try {
          const response = await fetch(
            `${BaseUrl}/auth/retrievecollection?ColName=${uid}_Candidates&resourceId=${candidate.id}`,
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
          if (data?.source && data.source.length > 0) {
            const candidateData = typeof data.source[0] === "string" 
              ? JSON.parse(data.source[0]) 
              : data.source[0];
            fullCandidatesData.push(candidateData);
          }
        } catch (error) {
          console.error(`Error fetching candidate ${candidate.id}:`, error);
        }
      }

      if (fullCandidatesData.length === 0) {
        toast.error("Failed to fetch candidate data");
        setLoading(false);
        return;
      }

    const normalizedCandidatesWithTest = fullCandidatesData.map((c) => {
      // Use all data from database
      const payload = { ...c };
      
      // Ensure _id is correctly formatted
      if (c._id?.$oid) {
        payload._id = c._id.$oid;
      } else if (c._id) {
        payload._id = c._id;
      }

      return payload;
    });
    console.log('Normalized Candidates with Full Data:', normalizedCandidatesWithTest)

      // 1️⃣ Generate unique token (optional, per request not per candidate)
      const uniqueToken = uuidv4();
      const assessmentLink = `${BaseUrl}/invite`;

      // 2️⃣ Send all candidates in one request with message and subject
      const requestPayload = {
        message: customEmailBody || "Hello,\n\nYou have been invited to complete your Al-Bayan assessment. Please read the instructions carefully.",
        subject: emailSubject || "Assessment Invitation",
        candidates: normalizedCandidatesWithTest
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

      toast.success("Invites sent successfully!");

      clearSelectedCandidates();
      onClose();
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{t("sendInvitations")}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            {t("sendInvitationsTo")} {candidatesToShow.length}{" "}
            {candidatesToShow.length === 1 ? t("candidate") : t("candidates")}?
          </p>
          <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto mb-4">
            {candidatesToShow.map((candidate) => (
              <div key={candidate.email} className="text-sm text-gray-600">
                • {candidate.name} ({candidate.email})
              </div>
            ))}
          </div>

          {/* Email Subject */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("emailSubject")} ({t("optional")})
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder={t("emailSubjectPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Custom Email Body */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("customEmailBody")} ({t("optional", "Optional")})
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
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSendInvites}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <LuSend size={16} />
            <span>{loading ? t("sending") : t("sendInvites")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

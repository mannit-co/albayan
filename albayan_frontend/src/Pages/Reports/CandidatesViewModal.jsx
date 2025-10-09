import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { FaTimes } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { BaseUrl, uid } from "../../Api/Api";
import { toast } from "react-hot-toast";

const CandidatesViewModal = ({ candidate, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!candidate) return null;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteType, setInviteType] = useState("");
  const [candidatesToShow, setCandidatesToShow] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [customEmailBody, setCustomEmailBody] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Parse candidate safely (handles multiple formats)
  let candidateObj;

  try {
    if (typeof candidate === "string") {
      candidateObj = JSON.parse(candidate);
    } else if (candidate?.source && Array.isArray(candidate.source)) {
      // Sometimes the actual data is inside candidate.source[0]
      const parsedSource = JSON.parse(candidate.source[0]);
      candidateObj = { ...candidate, ...parsedSource };
    } else {
      candidateObj = candidate;
    }
  } catch (err) {
    console.error("Error parsing candidate:", err);
    candidateObj = {};
  }

  // ✅ Safely parse test history
  let parsedTestHistory = [];
  try {
    if (Array.isArray(candidateObj?.testHistory)) {
      parsedTestHistory = candidateObj.testHistory;
    } else if (typeof candidateObj?.testHistory === "string") {
      parsedTestHistory = JSON.parse(candidateObj.testHistory);
    } else if (candidateObj?.testhistory) {
      // Some APIs send lowercase keys
      parsedTestHistory = Array.isArray(candidateObj.testhistory)
        ? candidateObj.testhistory
        : JSON.parse(candidateObj.testhistory);
    }
  } catch (err) {
    console.error("Error parsing test history:", err);
    parsedTestHistory = [];
  }

  console.log("✅ Parsed Candidate:", candidateObj);
  console.log("✅ Parsed Test History:", parsedTestHistory);

  // ✅ Handle invite modal text defaults
  useEffect(() => {
    if (showInviteModal) {
      setCandidatesToShow([candidate]);
      setEmailSubject(
        inviteType === "interview"
          ? "Interview Invitation"
          : "Assessment Invitation"
      );
      setCustomEmailBody(
        inviteType === "interview"
          ? "Hello,\n\nYou have been invited to a scheduled interview. Please check the details."
          : "Hello,\n\n"
      );
    }
  }, [showInviteModal, candidate, inviteType]);

  // ✅ Send message handler
  const handleSendInvites = async () => {
    if (candidatesToShow.length === 0) {
      toast.error("No candidate selected");
      return;
    }

    const payload = {
      msg: customEmailBody,
      toEmail: candidatesToShow.map((c) => c.email),
      fromEmail: "contact@mannit.co",
      subject: emailSubject,
    };

    try {
      setLoading(true);
      const response = await fetch(`${BaseUrl}/sendEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          xxxid: uid,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to send email");
        return;
      }

      toast.success(
        `${
          inviteType === "interview" ? "Interview" : "Message"
        } sent successfully!`
      );
      setShowInviteModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {t("candidatedetails")}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Candidate Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {t("personalinfo")}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">{t("name")}:</span>
                <span className="ml-2 font-medium">{candidateObj.name}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t("Email")}:</span>
                <span className="ml-2 font-medium">{candidateObj.email}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">{t("phone")}:</span>
                <span className="ml-2 font-medium">
                  {candidateObj.phone || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Test History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {t("testhistory")}
            </h4>

            {parsedTestHistory.length > 0 ? (
              <div
                className={`space-y-3 ${
                  parsedTestHistory.length > 3
                    ? "max-h-[250px] overflow-y-auto pr-1 custom-scrollbar"
                    : ""
                }`}
              >
                {parsedTestHistory.slice(0, 3).map((test, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-white rounded border border-gray-100 shadow-sm"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {test.testName || "Untitled Test"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {test.date || "N/A"}
                      </div>
                    </div>
                    <div
                      className={`font-bold text-sm ${
                        parseInt(test.score) >= 85
                          ? "text-green-600"
                          : parseInt(test.score) >= 50
                          ? "text-yellow-600"
                          : "text-orange-600"
                      }`}
                    >
                      {test.score || "0%"}
                    </div>
                  </div>
                ))}

                {/* If more than 3, show rest inside scroll */}
                {parsedTestHistory.length > 3 && (
                  <div className="space-y-3 mt-2">
                    {parsedTestHistory.slice(3).map((test, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-white rounded border border-gray-100 shadow-sm"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {test.testName || "Untitled Test"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {test.date || "N/A"}
                          </div>
                        </div>
                        <div
                          className={`font-bold text-sm ${
                            parseInt(test.score) >= 85
                              ? "text-green-600"
                              : parseInt(test.score) >= 50
                              ? "text-yellow-600"
                              : "text-orange-600"
                          }`}
                        >
                          {test.score || "0%"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {t("notestsavailable")}
              </div>
            )}
          </div>

          {/* Performance Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              {t("performancesummary")}
            </h4>
            <div className="space-y-4 text-center">
              <div className="text-sm text-gray-600 mb-1">
                {t("overallscore")}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {candidateObj.averageScore || "0%"}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: candidateObj.averageScore || "0%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            {t("quickactions")}
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setInviteType("message");
                setShowInviteModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("sendmsg")}
            </button>

            <button
              onClick={() => {
                setInviteType("interview");
                setShowInviteModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {t("schduleinterview")}
            </button>

            <button
              onClick={() => navigate("/test-library")}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t("assignnewtest")}
            </button>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[999]">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {inviteType === "interview"
                    ? t("scheduleinterview")
                    : t("sendmessage")}
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  {t("sendmessageto")} {candidatesToShow.length}{" "}
                  {candidatesToShow.length === 1
                    ? t("candidate")
                    : t("candidates")}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto mb-4">
                  {candidatesToShow.map((c) => (
                    <div key={c.email} className="text-sm text-gray-600">
                      • {c.name} ({c.email})
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("emailSubject")}
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("customEmailBody")}
                  </label>
                  <textarea
                    value={customEmailBody}
                    onChange={(e) => setCustomEmailBody(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  />
                </div>
              </div>

        <div className="flex justify-end space-x-3">
  <button
    onClick={() => setShowInviteModal(false)}
    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
    disabled={loading}
  >
    {t("cancel")}
  </button>

  <button
    onClick={handleSendInvites}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors ${
      emailSubject.trim() && customEmailBody.trim()
        ? "bg-blue-600 hover:bg-blue-700"
        : "bg-gray-400 cursor-not-allowed"
    }`}
    disabled={
      loading || !emailSubject.trim() || !customEmailBody.trim()
    }
  >
    <LuSend size={16} />
    <span>{loading ? t("sending") : t("sendInvites")}</span>
  </button>
</div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatesViewModal;

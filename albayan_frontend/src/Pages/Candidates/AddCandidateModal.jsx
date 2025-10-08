import { FiX, FiUpload, FiFileText } from "react-icons/fi";
import { FaExclamationTriangle } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { useState, useEffect } from "react";
import { uid, BaseUrl, SuperAdminID } from "../../Api/Api";
import { Toaster, toast } from "react-hot-toast";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; // default styling
import ReactCountryFlag from "react-country-flag";
import { useLanguage } from "../../contexts/LanguageContext";

export const AddCandidateModal = ({
  show,
  onClose,
  existingCandidate,
  newCandidate,
  handleInputChange,
  languages,
  onSaveSuccess,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    dialCode: "",
    name: "",
    iso2: "",
  });
  useEffect(() => {
    if (show) {
      handleInputChange({ target: { name: "name", value: "" } });
      handleInputChange({ target: { name: "email", value: "" } });
      handleInputChange({ target: { name: "phone", value: "" } });
      handleInputChange({ target: { name: "preferredLanguage", value: "" } });
      handleInputChange({ target: { name: "role", value: "" } });
      handleInputChange({ target: { name: "skills", value: "" } });
      setSelectedCountry({ dialCode: "", name: "", iso2: "" });
    }
  }, [show]);

  if (!show) return null;

  // const handleSaveCandidate = async () => {
  //   setLoading(true);
  // console.log('existingCandidate', existingCandidate)

  //   try {
  //     const today = new Date();

  //     let skillsArray = [];
  //     if (typeof newCandidate.skills === "string") {
  //       skillsArray = newCandidate.skills
  //         .split(",")
  //         .map((s) => s.trim())
  //         .filter((s) => s);
  //     } else if (Array.isArray(newCandidate.skills)) {
  //       skillsArray = newCandidate.skills;
  //     }

  //     //  Extract token
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
  //     const payload = {
  //       name: newCandidate.name,
  //       email: newCandidate.email,
  //       phone: newCandidate.phone,
  //       countryCode: selectedCountry.dialCode
  //         ? `+${selectedCountry.dialCode}`
  //         : "",
  //       country: selectedCountry.name || "",
  //       preferredLanguage: newCandidate.preferredLanguage,
  //       role: newCandidate.role,
  //       skills: skillsArray,
  //       created: { $date: today.toISOString() },
  //       status: "Registered",
  //       completed: 0,
  //       assigned: 0,
  //       score: "0%",
  //       userId: { $oid: userId },
  //       sa: SuperAdminID
  //     };

  //     const response = await fetch(
  //       `${BaseUrl}/auth/eCreateCol?colname=${uid}_Candidates`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //           xxxid: uid,
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     const data = await response.json();

  //     if (response.ok) {
  //       //  Close modal immediately
  //       handleClose();

  //       //  Show toast after closing modal
  //       toast.success("Candidate added successfully!");

  //       //  Call parent callback
  //       if (onSaveSuccess) onSaveSuccess();
  //     } else {
  //       toast.error(
  //         data.message || "Failed to add candidate. Please try again."
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error:", error);
  //     toast.error("Something went wrong. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const handleSaveCandidate = async () => {
    setLoading(true);
    try {
      // 🔍 Check for existing candidate before save
      const duplicate = existingCandidate.find(
        (c) =>
          c.email?.toLowerCase() === newCandidate.email?.toLowerCase() &&
          c.role?.toLowerCase() === newCandidate.role?.toLowerCase()
      );

      // Optional: check for duplicate skills as well
      let skillsArray = [];
      if (typeof newCandidate.skills === "string") {
        skillsArray = newCandidate.skills
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s);
      } else if (Array.isArray(newCandidate.skills)) {
        skillsArray = newCandidate.skills.map((s) => s.toLowerCase());
      }

      const skillDuplicate =
        duplicate &&
        duplicate.skills?.some((s) => skillsArray.includes(s.toLowerCase()));

      if (duplicate && skillDuplicate) {
        toast.error(t("candidateAlreadyRegistered"));
        handleClose(); // ✅ Close the modal immediately
        setLoading(false);
        return; // 🚫 Stop here
      }

      // ---- proceed with your existing save logic ----
      const today = new Date();

      //  Extract token
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

      const payload = {
        name: newCandidate.name,
        email: newCandidate.email,
        phone: newCandidate.phone,
        countryCode: selectedCountry.dialCode
          ? `+${selectedCountry.dialCode}`
          : "",
        country: selectedCountry.name || "",
        preferredLanguage: newCandidate.preferredLanguage,
        role: newCandidate.role,
        skills: skillsArray,
        created: { $date: today.toISOString() },
        status: "Registered",
        completed: 0,
        assigned: 0,
        score: "0%",
        userId: { $oid: userId },
        sa: SuperAdminID,
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
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        handleClose();
        toast.success(t("candidateAddedSuccessfully"));
        if (onSaveSuccess) onSaveSuccess();
      } else {
        toast.error(
          data.message || t("failedToAddCandidate")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleClose = () => {
    // Reset candidate form values

    handleInputChange({ target: { name: "name", value: "" } });
    handleInputChange({ target: { name: "email", value: "" } });
    handleInputChange({ target: { name: "phone", value: "" } });
    handleInputChange({ target: { name: "preferredLanguage", value: "" } });
    handleInputChange({ target: { name: "role", value: "" } });
    handleInputChange({ target: { name: "skills", value: "" } });
    setSelectedCountry({ dialCode: "", name: "", iso2: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("addNewCandidate")}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("name")} <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={newCandidate.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("enterFullName", "Enter full name")}
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("email")} <span className="text-red-500 text-base font-bold">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={newCandidate.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("enterEmailAddress")}
            />
            {!isValidEmail(newCandidate.email) && newCandidate.email && (
              <p className="text-red-500 text-sm mt-1">
                {t("pleaseEnterValidEmail", "Please enter a valid email address")}
              </p>
            )}
          </div>
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("phoneNumber")}
            </label>
            <PhoneInput
              country={"in"} // default country
              value={newCandidate.phone}
              onChange={(phone, countryData) => {
                handleInputChange({
                  target: { name: "phone", value: phone },
                });

                setSelectedCountry({
                  dialCode: countryData.dialCode,
                  name: countryData.name,
                  iso2: countryData.iso2,
                });
              }}
              inputClass="!w-full !pl-14 !pr-3 !py-2 !border !border-gray-200 !rounded-lg focus:!ring-2 focus:!ring-blue-500 focus:!border-transparent"
              buttonClass="!border-gray-200 !bg-white"
              dropdownClass="!bg-white"
              enableSearch={true}
              countryCodeEditable={false}
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("assessmentTakenOn", "Assessment Taken On")}
            </label>
            <select
              name="preferredLanguage"
              value={newCandidate.preferredLanguage}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="" disabled>
                {t("selectLanguage", "Select Language")}
              </option>
              {languages.map((lang, index) => (
                <option key={index} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("candidateRole", "Candidate Role")}
            </label>
            <input
              type="text"
              name="role"
              value={newCandidate.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("enterRole")}
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("skills")}
            </label>
            <input
              type="text"
              name="skills"
              value={newCandidate.skills}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("enterSkills")}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={handleClose}
            disabled={loading}
          >
            {t("cancel")}
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSaveCandidate}
            disabled={
              !newCandidate.name ||
              !newCandidate.email ||
              !isValidEmail(newCandidate.email) || //  Check email format
              loading
            }
          >
            {loading ? t("saving", "Saving...") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { userInfo } from "../Api/Api";
import { useLanguage } from "../contexts/LanguageContext";

const Profile = () => {
  const { t } = useLanguage();
  
  if (!userInfo) {
    return (
      <div className="p-6 text-center text-gray-500">
        {t('noUserInformation')}
      </div>
    );
  }

  const initials = `${userInfo.firstName?.charAt(0) || ""}${userInfo.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-2xl p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {userInfo.firstName} {userInfo.lastName}
              </h2>
              <p className="text-gray-500 text-sm">{userInfo.email}</p>
              <p className="text-gray-400 text-xs">{t('administrator')}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div>
            <p className="text-gray-500 text-sm">{t('username')}</p>
            <p className="text-gray-900 font-medium">{userInfo.username}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('company')}</p>
            <p className="text-gray-900 font-medium">{userInfo.company}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('mobile')}</p>
            <p className="text-gray-900 font-medium">{userInfo.mobileno}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('createdAt')}</p>
            <p className="text-gray-900 font-medium">{userInfo.creationdate}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">{t('updatedAt')}</p>
            <p className="text-gray-900 font-medium">{userInfo.updated_at}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

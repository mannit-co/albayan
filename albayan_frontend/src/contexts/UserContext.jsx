import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);

  const updateUserInfo = () => {
    const storedData = sessionStorage.getItem("loginResponse");
    const parsedData = storedData ? JSON.parse(storedData) : null;
    const info = parsedData?.source ? JSON.parse(parsedData.source) : null;
    setUserInfo(info);
  };

  useEffect(() => {
    // Initialize userInfo on mount
    updateUserInfo();

    // Listen for storage changes (in case of login/logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'loginResponse') {
        updateUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, updateUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};
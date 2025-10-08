import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  // Return without JSX to keep .js valid
  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage } },
    children
  );
};

export const useLanguage = () => useContext(LanguageContext);
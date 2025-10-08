import React, { createContext, useContext, useState, useEffect } from "react";
import { getTranslation } from "../translations";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [selectedLang, setSelectedLang] = useState(() => {
    // Check if there's a saved language in localStorage
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
      try {
        return JSON.parse(savedLang);
      } catch (e) {
        // If parsing fails, return default language
        return {
          flag: "🇺🇸",
          name: "English",
          code: "en",
          dir: "ltr"
        };
      }
    }
    // Default language
    return {
      flag: "🇺🇸",
      name: "English",
      code: "en",
      dir: "ltr"
    };
  });

  const languages = [
    { flag: "🇺🇸", name: "English", code: "en", dir: "ltr" },
    { flag: "🇸🇦", name: "العربية", code: "ar", dir: "rtl" },
    { flag: "🇪🇸", name: "Español", code: "es", dir: "ltr" },
    { flag: "🇫🇷", name: "Français", code: "fr", dir: "ltr" },
  ];
  
  // Get translations for the selected language
  const [translations, setTranslations] = useState(getTranslation(selectedLang.code));

  const selectLanguage = (lang) => {
    setSelectedLang(lang);
    // Save to localStorage
    localStorage.setItem('selectedLanguage', JSON.stringify(lang));
    // Update the document direction
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
    // Update translations
    setTranslations(getTranslation(lang.code));
  };

  // Apply direction and update translations when component mounts
  useEffect(() => {
    document.documentElement.dir = selectedLang.dir;
    document.documentElement.lang = selectedLang.code;
    setTranslations(getTranslation(selectedLang.code));
  }, [selectedLang]);

  const value = {
    selectedLang,
    languages,
    selectLanguage,
    setSelectedLang,
    translations,
    currentLanguage: selectedLang.code, // Add current language code
    t: (key) => translations[key] || key // Translation helper function
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
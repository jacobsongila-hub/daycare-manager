import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    dashboard: 'Dashboard',
    attendance: 'Attendance',
    families: 'Families',
    staff: 'Staff',
    timeTracking: 'Time Tracking',
    calendar: 'Calendar',
    settings: 'Settings',
    notes: 'Daily Notes',
    myshifts: 'My Shifts',
    mydocs: 'My Docs',
    photos: 'Photos',
    profile: 'Profile',
    shiftrequests: 'Shift Requests',
    staffschedule: 'Staff Schedule',
    announcements: 'Announcements',
    logout: 'Logout',
    // We can add more specific keys here later
  },
  he: {
    dashboard: 'לוח בקרה',
    attendance: 'נוכחות',
    families: 'משפחות',
    staff: 'צוות',
    timeTracking: 'מעקב שעות',
    calendar: 'יומן',
    settings: 'הגדרות',
    notes: 'הערות יומיות',
    myshifts: 'המשמרות שלי',
    mydocs: 'המסמכים שלי',
    photos: 'תמונות',
    profile: 'פרופיל',
    shiftrequests: 'בקשות משמרת',
    staffschedule: 'לוח זמנים לצוות',
    announcements: 'הודעות',
    logout: 'התנתק',
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'en');

  useEffect(() => {
    localStorage.setItem('appLang', lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "../locales/en.json";
import hi from "../locales/hi.json";

// Initialize i18n instance
const i18nInstance = i18n.use(initReactI18next);

// Use language detector only in browser
if (typeof window !== 'undefined') {
    i18nInstance.use(LanguageDetector);
}

i18nInstance.init({
    resources: {
        en: { translation: en },
        hi: { translation: hi }
    },
    fallbackLng: "en",
    interpolation: {
        escapeValue: false // React already escapes values
    }
});

export default i18n;

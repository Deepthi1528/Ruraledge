import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import axios from "axios";

const GOOGLE_API_KEY = "YOUR_GOOGLE_TRANSLATE_API_KEY"; // Get from Google Cloud

const fetchTranslation = async (text, targetLang) => {
  try {
    const res = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
      {
        q: text,
        target: targetLang,
        format: "text",
      }
    );
    return res.data.data.translations[0].translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: {} }, kn: { translation: {} } },
    lng: localStorage.getItem("lang") || "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

i18n.on("languageChanged", async (lang) => {
  const elements = document.querySelectorAll("[data-translate]");
  for (const el of elements) {
    const originalText = el.getAttribute("data-translate");
    if (lang === "en") {
      el.innerText = originalText;
    } else {
      el.innerText = await fetchTranslation(originalText, lang);
    }
  }
});

export default i18n;

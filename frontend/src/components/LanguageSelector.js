import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (
    <div style={{ position: "absolute", top: 10, right: 20 }}>
      <select
        onChange={handleChange}
        value={i18n.language}
        style={{
          padding: "6px 10px",
          borderRadius: "5px",
          fontSize: "14px",
          cursor: "pointer",
        }}
      >
        <option value="en">🇬🇧 English</option>
        <option value="kn">🇮🇳 ಕನ್ನಡ</option>
      </select>
    </div>
  );
};

export default LanguageSelector;

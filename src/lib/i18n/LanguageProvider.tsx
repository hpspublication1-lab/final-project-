'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'np';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (_key: string, defaultText: string) => defaultText,
});

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    subjective_practice: 'SEE Written Subjective Practice',
    evaluate_answer: 'Evaluate My Answer with AI',
    upload_handwritten: 'Upload Handwritten Answer',
    model_solution: 'Model Solution & Marking Scheme',
    obtained_marks: 'Obtained Marks',
    step_feedback: 'Step-by-Step AI Evaluation',
  },
  np: {
    subjective_practice: 'एस.ई.ई. विषयगत उत्तर अभ्यास',
    evaluate_answer: 'एआई द्वारा मेरो उत्तर जाँच गर्नुहोस्',
    upload_handwritten: 'हस्तलेखित उत्तर फोटो अपलोड गर्नुहोस्',
    model_solution: 'नमूना उत्तर तथा अङ्क विभाजन',
    obtained_marks: 'प्राप्त अङ्क',
    step_feedback: 'चरणबद्ध एआई मूल्यांकन र सुझावहरू',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('samyak_lang') as Language;
    if (saved && (saved === 'en' || saved === 'np')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('samyak_lang', lang);
  };

  const t = (key: string, defaultText: string): string => {
    return DICTIONARY[language]?.[key] || defaultText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

import { useState } from 'react';
import { FaGlobe, FaTimes } from 'react-icons/fa';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

export default function LanguageSelector({ onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  const handleLanguageSelect = (langCode) => {
    setCurrentLanguage(langCode);
    setIsOpen(false);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
  };
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-20 z-30 bg-wikitok-gray p-2 rounded-full"
      >
        <FaGlobe className="text-white text-xl" />
      </button>
      
      {isOpen && (
        <div className="fixed top-16 left-4 z-40 bg-gray-800 text-white rounded-lg shadow-lg w-52">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <h3 className="font-medium">Select Language</h3>
            <button onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>
          
          <ul className="max-h-60 overflow-y-auto py-1">
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${
                    currentLanguage === lang.code ? 'bg-gray-700' : ''
                  }`}
                >
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 
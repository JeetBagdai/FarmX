import React, { useState, useEffect, useRef } from 'react';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  id: string;
  required?: boolean;
  placeholder?: string;
  t: (key: string) => string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, id, required, placeholder, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition placeholder-gray-500"
        required={required}
        autoComplete="off"
      />
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option}
                onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-500">{t('No regions found. You can still enter a custom region.')}</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default React.memo(SearchableDropdown);
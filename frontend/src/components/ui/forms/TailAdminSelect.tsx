import React from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  value?: string;
  error?: string;
  label?: string;
  helpText?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

const TailAdminSelect: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  value = "",
  error,
  label,
  helpText,
  name,
  id,
  required = false,
  disabled = false,
}) => {
  const selectId =
    id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  let selectClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 ${className}`;

  // Add background arrow icon using CSS
  selectClasses += ` bg-no-repeat bg-right bg-[length:16px_16px] bg-[position:right_12px_center]`;
  selectClasses += ` bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")]`;

  if (disabled) {
    selectClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    selectClasses += ` text-gray-800 border-red-500 focus:border-red-300 focus:ring-red-500/10 dark:border-red-500 dark:bg-gray-900 dark:text-white/90 dark:focus:border-red-800`;
  } else {
    selectClasses += ` ${
      value
        ? "text-gray-800 dark:text-white/90"
        : "text-gray-400 dark:text-gray-400"
    } border-gray-300 focus:border-blue-300 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-blue-800`;
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-400"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          name={name}
          className={selectClasses}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option
              value=""
              disabled
              className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
            >
              {placeholder}
            </option>
          )}

          {/* Map over options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default TailAdminSelect;

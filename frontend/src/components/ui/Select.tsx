import React, { forwardRef } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, options, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            bg-white focus:outline-none focus:ring-blue-500 
            focus:border-blue-500 sm:text-sm text-gray-900
            dark:bg-gray-800 dark:border-gray-600 dark:text-white 
            dark:focus:ring-blue-400 dark:focus:border-blue-400
            ${
              error
                ? "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600 dark:focus:ring-red-400 dark:focus:border-red-400"
                : ""
            }
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

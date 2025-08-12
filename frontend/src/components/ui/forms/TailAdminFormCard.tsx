import React from "react";

interface TailAdminFormCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const TailAdminFormCard: React.FC<TailAdminFormCardProps> = ({
  children,
  title,
  description,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {(title || description) && (
        <div className="px-6 py-5">
          {title && (
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={`${
          title || description
            ? "p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6"
            : "p-4 sm:p-6"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  subtitle,
  action,
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </div>
      )}
      <div
        className={`${
          title || subtitle || action
            ? "p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6"
            : "p-4 sm:p-6"
        }`}
      >
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

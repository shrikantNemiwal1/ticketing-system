import React, { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  onClick?: () => void; // Optional click handler
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
}

// Table Component
const TailAdminTable: React.FC<TableProps> = ({ children, className = "" }) => {
  return <table className={`min-w-full ${className}`}>{children}</table>;
};

// TableHeader Component
const TailAdminTableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = "",
}) => {
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TailAdminTableBody: React.FC<TableBodyProps> = ({
  children,
  className = "",
}) => {
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TailAdminTableRow: React.FC<TableRowProps> = ({
  children,
  className = "",
  onClick,
}) => {
  return (
    <tr className={className} onClick={onClick}>
      {children}
    </tr>
  );
};

// TableCell Component
const TailAdminTableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
}) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={className}>{children}</CellTag>;
};

// Table Container Component
interface TableContainerProps {
  children: ReactNode;
  className?: string;
}

const TailAdminTableContainer: React.FC<TableContainerProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] ${className}`}
    >
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-full">{children}</div>
      </div>
    </div>
  );
};

export {
  TailAdminTable,
  TailAdminTableHeader,
  TailAdminTableBody,
  TailAdminTableRow,
  TailAdminTableCell,
  TailAdminTableContainer,
};

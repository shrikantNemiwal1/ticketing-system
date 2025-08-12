import React from "react";
import Link from "next/link";

interface DropdownItemProps {
  children: React.ReactNode;
  onItemClick?: () => void;
  tag?: "button" | "a";
  href?: string;
  className?: string;
  onClick?: () => void;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onItemClick,
  tag = "button",
  href,
  className = "",
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) onClick();
    if (onItemClick) onItemClick();
  };

  if (tag === "a" && href) {
    return (
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

const ActionButton = ({ children, className = "", ...props }: Props) => {
  return (
    <button
      type="button"
      className={`flex items-center justify-center w-8 h-8 rounded-md text-disabled transition-colors hover:bg-selection hover:text-heading ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;

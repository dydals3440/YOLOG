import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

const ActionButton = ({ children, className = "", ...props }: Props) => {
  return (
    <button
      type="button"
      className={`flex items-center justify-center w-8 h-8 rounded-md text-third transition-colors hover:bg-hover hover:text-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;

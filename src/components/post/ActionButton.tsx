import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

const ActionButton = ({ children, className = "", ...props }: Props) => {
  return (
    <button
      type="button"
      className={`flex h-8 w-8 items-center justify-center rounded-md text-disabled transition-colors hover:bg-selection hover:text-heading ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;

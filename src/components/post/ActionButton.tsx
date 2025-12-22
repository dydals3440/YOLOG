import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
}

const ActionButton = ({ children, ...props }: Props) => {
  return (
    <button
      className="flex items-center justify-center w-8 h-8 rounded-md text-third transition-colors hover:bg-hover hover:text-primary"
      {...props}
    >
      {children}
    </button>
  );
};

export default ActionButton;

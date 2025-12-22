interface ShareButtonProps {
  onClick: () => void;
  title: string;
  ariaLabel: string;
  disabled?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ShareButton = ({
  onClick,
  title,
  ariaLabel,
  disabled = false,
  isActive = false,
  children,
  className = "",
}: ShareButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg text-third hover:text-primary hover:bg-hover transition-colors duration-200 disabled:opacity-50 ${
        isActive ? "text-green-500" : ""
      } ${className}`}
      title={title}
      aria-label={ariaLabel}
    >
      <span className="block w-4 h-4">{children}</span>
    </button>
  );
};

export default ShareButton;

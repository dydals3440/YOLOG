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
      className={`rounded-lg p-2 text-third transition-colors duration-200 hover:bg-hover hover:text-primary disabled:opacity-50 ${
        isActive ? "text-green-500" : ""
      } ${className}`}
      title={title}
      aria-label={ariaLabel}
    >
      <span className="block h-4 w-4">{children}</span>
    </button>
  );
};

export default ShareButton;

import { Button } from "@/components/ui/button";

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
		<Button
			variant="ghost"
			size="icon"
			onClick={onClick}
			disabled={disabled}
			className={`relative w-10 h-10 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200 group ${className}`}
			title={title}
			aria-label={ariaLabel}
		>
			<span
				className={`transition-all duration-300 ${
					isActive
						? "text-green-400 dark:text-green-400 scale-110"
						: "text-gray-300 dark:text-gray-400 group-hover:text-white dark:group-hover:text-gray-200"
				}`}
			>
				{children}
			</span>
		</Button>
	);
};

export default ShareButton;
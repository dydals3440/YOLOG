interface ShareContainerProps {
	children: React.ReactNode;
}

const ShareContainer = ({ children }: ShareContainerProps) => {
	return (
		<div className="relative inline-flex items-center gap-1 p-2.5 bg-white/5 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/10 dark:border-gray-800/50">
			<div className="relative flex items-center gap-1">{children}</div>
		</div>
	);
};

export const ShareDivider = () => (
	<div className="h-5 w-px bg-white/10 dark:bg-gray-700/50" />
);

export default ShareContainer;
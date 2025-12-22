interface ShareContainerProps {
  children: React.ReactNode;
}

const ShareContainer = ({ children }: ShareContainerProps) => {
  return <div className="inline-flex items-center gap-1">{children}</div>;
};

export const ShareDivider = () => <div className="h-4 w-px bg-border mx-1" />;

export default ShareContainer;

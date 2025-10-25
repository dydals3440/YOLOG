import { useCallback, useMemo, useState } from "react";
import {
	FacebookIcon,
	LinkedinIcon,
	LinkIcon,
	TwitterXIcon,
} from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import {
	copyToClipboard,
	createShareUrls,
	openShareWindow,
	type SharePlatform,
	shareNative,
} from "@/utils/share";
import ShareButton from "./ShareButton";
import ShareContainer, { ShareDivider } from "./ShareContainer";
import { CheckIcon, ShareIcon } from "./ShareIcons";

interface SocialShareProps {
	title: string;
	url: string;
}

interface ShareOption {
	platform: Exclude<SharePlatform, "native">;
	icon: React.ReactNode;
	label: string;
}

// 링크 복사 성공 시 아이콘 복원 시간 (ms)
const COPY_ICON_RESTORE_DELAY = 2000;

const SHARE_OPTIONS: ShareOption[] = [
	{
		platform: "twitter",
		icon: <TwitterXIcon className="w-5 h-5" />,
		label: "Twitter에 공유",
	},
	{
		platform: "facebook",
		icon: <FacebookIcon className="w-5 h-5" />,
		label: "Facebook에 공유",
	},
	{
		platform: "linkedin",
		icon: <LinkedinIcon className="w-5 h-5" />,
		label: "LinkedIn에 공유",
	},
];

const SocialShare = ({ title, url }: SocialShareProps) => {
	const { toast } = useToast();
	const [isSharing, setIsSharing] = useState(false);
	const [isCopied, setIsCopied] = useState(false);

	const shareUrls = useMemo(() => createShareUrls(title, url), [title, url]);

	const handleNativeShare = useCallback(async () => {
		try {
			await shareNative(title, url);
		} catch (error) {
			// 에러는 shareNative 함수 내에서 처리됨
		}
	}, [title, url]);

	const handleShare = useCallback(
		async (platform: SharePlatform) => {
			if (platform === "native") {
				return handleNativeShare();
			}
			openShareWindow(shareUrls[platform]);
		},
		[handleNativeShare, shareUrls],
	);

	const handleCopyLink = useCallback(async () => {
		setIsSharing(true);
		try {
			await copyToClipboard(url);
			setIsCopied(true);
			toast({
				title: "링크가 복사되었습니다",
				description: "클립보드에 저장되었습니다",
			});

			// 아이콘 복원
			setTimeout(() => {
				setIsCopied(false);
			}, COPY_ICON_RESTORE_DELAY);
		} catch (err) {
			toast({
				title: "복사 실패",
				description: "링크 복사에 실패했습니다",
				variant: "destructive",
			});
		} finally {
			setIsSharing(false);
		}
	}, [url, toast]);

	const isNativeShareSupported =
		typeof navigator !== "undefined" && "share" in navigator;

	return (
		<ShareContainer>
			{/* 네이티브 공유 버튼 */}
			{isNativeShareSupported && (
				<>
					<ShareButton
						onClick={() => handleShare("native")}
						title="공유하기"
						ariaLabel="네이티브 공유"
					>
						<ShareIcon />
					</ShareButton>
					<ShareDivider />
				</>
			)}

			{/* SNS 공유 버튼들 */}
			<div className="flex items-center gap-1 px-0.5">
				{SHARE_OPTIONS.map(({ platform, icon, label }) => (
					<ShareButton
						key={platform}
						onClick={() => handleShare(platform)}
						title={label}
						ariaLabel={label}
					>
						{icon}
					</ShareButton>
				))}
			</div>

			<ShareDivider />

			{/* 링크 복사 버튼 */}
			<ShareButton
				onClick={handleCopyLink}
				disabled={isSharing}
				isActive={isCopied}
				title={isCopied ? "복사됨!" : "링크 복사"}
				ariaLabel={isCopied ? "복사됨" : "링크 복사"}
			>
				{isCopied ? <CheckIcon /> : <LinkIcon className="w-5 h-5" />}
			</ShareButton>
		</ShareContainer>
	);
};

export default SocialShare;

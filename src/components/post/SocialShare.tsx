import { useMemo, useState } from "react";
import {
  CopyCheckIcon,
  FacebookIcon,
  LinkedinIcon,
  LinkIcon,
  ShareIcon,
  TwitterXIcon,
} from "@/components/ui/Icons";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { useToast } from "@/hooks/use-toast";
import {
  copyToClipboard,
  createShareUrls,
  openShareWindow,
  type SharePlatform,
  shareNative,
} from "@/lib/utils/share";
import ShareButton from "./ShareButton";
import ShareContainer, { ShareDivider } from "./ShareContainer";

interface SocialShareProps {
  title: string;
  url: string;
}

interface ShareOption {
  platform: Exclude<SharePlatform, "native">;
  icon: React.ReactNode;
  label: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    platform: "twitter",
    icon: <TwitterXIcon />,
    label: "Twitter에 공유",
  },
  {
    platform: "facebook",
    icon: <FacebookIcon />,
    label: "Facebook에 공유",
  },
  {
    platform: "linkedin",
    icon: <LinkedinIcon />,
    label: "LinkedIn에 공유",
  },
];

const SocialShare = ({ title, url }: SocialShareProps) => {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const { isCopied, setIsCopied } = useCopyFeedback();

  const shareUrls = useMemo(() => createShareUrls(title, url), [title, url]);

  const handleCopyLink = async () => {
    setIsSharing(true);
    try {
      await copyToClipboard(url);
      setIsCopied(true);
      toast({
        title: "링크가 복사되었습니다",
        description: "클립보드에 저장되었습니다",
      });
    } catch {
      toast({
        title: "복사 실패",
        description: "링크 복사에 실패했습니다",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const isNativeShareSupported = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <ShareContainer>
      {/* 네이티브 공유 버튼 */}
      {isNativeShareSupported && (
        <>
          <ShareButton
            onClick={() => shareNative(title, url)}
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
            onClick={() => openShareWindow(shareUrls[platform])}
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
        {isCopied ? <CopyCheckIcon /> : <LinkIcon />}
      </ShareButton>
    </ShareContainer>
  );
};

export default SocialShare;

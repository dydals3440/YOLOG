import { useCallback } from "react";

import { LinkIcon, CheckIcon } from "@/components/ui/Icons";
import { copyToClipboard } from "@/lib/utils/share";
import { useToast } from "@/hooks/use-toast";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { DELAYS } from "@/lib/config";
import ActionButton from "./ActionButton";

const CopyLinkButton = () => {
  const { toast } = useToast();
  const { isCopied, setIsCopied } = useCopyFeedback({
    delayMs: DELAYS.COPY_LINK_ICON_RESTORE_MS,
  });

  const handleCopyLink = useCallback(async () => {
    try {
      await copyToClipboard(window.location.href);
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
    }
  }, [toast, setIsCopied]);

  return (
    <ActionButton onClick={handleCopyLink}>
      {isCopied ? <CheckIcon /> : <LinkIcon />}
      <span className="sr-only">링크 복사</span>
    </ActionButton>
  );
};

export default CopyLinkButton;

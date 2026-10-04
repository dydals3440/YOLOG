import { useCallback } from "react";
import { trackShare } from "@/lib/analytics";

import { Check, Link2 } from "lucide-react";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { useToast } from "@/hooks/use-toast";
import { DELAYS } from "@/lib/config";
import { copyToClipboard } from "@/lib/utils/share";
import ActionButton from "./ActionButton";

const CopyLinkButton = () => {
  const { toast } = useToast();
  const { isCopied, setIsCopied } = useCopyFeedback({
    delayMs: DELAYS.COPY_LINK_ICON_RESTORE_MS,
  });

  const handleCopyLink = useCallback(async () => {
    try {
      const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
      await copyToClipboard(canonical ?? window.location.href);
      trackShare("copy_link");
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
      {isCopied ? <Check size={18} strokeWidth={1.75} /> : <Link2 size={18} strokeWidth={1.75} />}
      <span className="sr-only">링크 복사</span>
    </ActionButton>
  );
};

export default CopyLinkButton;

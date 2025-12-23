import { useEffect, useState, useCallback } from "react";

import { LinkIcon, CheckIcon } from "@/components/ui/icons";
import { copyToClipboard } from "@/lib/utils/share";
import { useToast } from "@/hooks/use-toast";
import { COPY_LINK_ICON_RESTORE_DELAY } from "@/lib/constants";
import ActionButton from "./ActionButton";

const CopyLinkButton = () => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, COPY_LINK_ICON_RESTORE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

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
  }, [toast]);

  return (
    <ActionButton onClick={handleCopyLink}>
      {isCopied ? <CheckIcon /> : <LinkIcon />}
      <span className="sr-only">링크 복사</span>
    </ActionButton>
  );
};

export default CopyLinkButton;

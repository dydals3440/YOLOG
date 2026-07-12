import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import { Check, Copy, Mail, Send } from "lucide-react";
import IconLink from "@/components/ui/IconLink";
import { EmailIcon } from "@/components/ui/Icons";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
import { useToast } from "@/hooks/use-toast";
import { CONTACT, TOAST } from "@/lib/config";
import { copyToClipboard } from "@/lib/utils/share";

const ITEM_CLASS =
  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-second transition-colors hover:bg-selection hover:text-body";

/**
 * 이메일 아이콘 클릭 시 보내는 방법을 고르는 메뉴를 연다.
 *
 * mailto만 쓰면 기본 메일 클라이언트가 없는 환경에서 클릭해도 아무 일이 일어나지 않는다.
 * Gmail 웹, 기본 메일 앱, 주소 복사를 함께 제공해 어떤 환경에서든 연락할 수 있게 한다.
 * JS가 없거나 하이드레이션 전이면 평범한 mailto 링크로 동작한다.
 */
const EmailLink = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const { toast } = useToast();
  const { isCopied, setIsCopied } = useCopyFeedback();

  useEffect(() => {
    if (!isOpen) return;

    firstItemRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    // 새 탭으로 열기 같은 브라우저 기본 동작은 그대로 둔다
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    setIsOpen((prev) => !prev);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(CONTACT.EMAIL);
      setIsCopied(true);
      toast({ title: TOAST.MESSAGES.EMAIL_COPIED, description: CONTACT.EMAIL });
    } catch {
      toast({ title: TOAST.MESSAGES.EMAIL_COPY_FAILED, variant: "destructive" });
    }
  }, [toast, setIsCopied]);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <IconLink
        href={CONTACT.MAILTO_URL}
        target="_self"
        aria-label="이메일"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
      >
        <EmailIcon width="1rem" height="1rem" />
      </IconLink>

      {isOpen && (
        <div
          role="menu"
          aria-label="이메일 보내기"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded-md border border-gray-200 bg-gray-75 p-1 text-left shadow-lg"
        >
          <p className="px-2 py-1 text-xs text-third">{CONTACT.EMAIL}</p>

          <a
            ref={firstItemRef}
            role="menuitem"
            href={CONTACT.GMAIL_COMPOSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={ITEM_CLASS}
            onClick={() => setIsOpen(false)}
          >
            <Send size={14} strokeWidth={1.75} />
            Gmail로 보내기
          </a>

          <a
            role="menuitem"
            href={CONTACT.MAILTO_URL}
            className={ITEM_CLASS}
            onClick={() => setIsOpen(false)}
          >
            <Mail size={14} strokeWidth={1.75} />
            메일 앱으로 보내기
          </a>

          <button type="button" role="menuitem" className={ITEM_CLASS} onClick={handleCopy}>
            {isCopied ? (
              <Check size={14} strokeWidth={1.75} />
            ) : (
              <Copy size={14} strokeWidth={1.75} />
            )}
            주소 복사
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailLink;

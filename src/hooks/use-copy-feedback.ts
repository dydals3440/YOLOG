import { useState, useEffect, useCallback } from "react";
import { DELAYS } from "@/lib/config";

interface UseCopyFeedbackOptions {
  /** 복사 완료 아이콘 복원 딜레이 (ms) */
  delayMs?: number;
  /** 복사 완료 시 콜백 */
  onCopy?: () => void;
}

/**
 * 복사 피드백 로직을 관리하는 훅
 * - 복사 상태 관리
 * - 자동 상태 복원 (타이머 cleanup 포함)
 */
export function useCopyFeedback({
  delayMs = DELAYS.COPY_ICON_RESTORE_MS,
  onCopy,
}: UseCopyFeedbackOptions = {}) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const timer = setTimeout(() => setIsCopied(false), delayMs);
    return () => clearTimeout(timer);
  }, [isCopied, delayMs]);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        onCopy?.();
        return true;
      } catch (error) {
        console.error("Failed to copy:", error);
        return false;
      }
    },
    [onCopy],
  );

  return { isCopied, copy, setIsCopied };
}

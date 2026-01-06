import { useState, useEffect } from "react";

interface ArticleProgressResult {
  progress: number;
  isVisible: boolean;
}

interface UseArticleProgressOptions {
  /** 아티클 요소의 CSS 선택자 */
  selector?: string;
  /** 가시성 오프셋 (뷰포트 높이 비율) */
  visibilityOffset?: number;
  /** 읽기 완료 오프셋 (뷰포트 높이 비율) */
  readableOffset?: number;
}

export function useArticleProgress({
  selector = "article.mdx",
  visibilityOffset = 0.5,
  readableOffset = 0.3,
}: UseArticleProgressOptions = {}): ArticleProgressResult {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // SSR 환경에서는 document가 없으므로 early return
    if (typeof document === "undefined") return;

    const article = document.querySelector(selector);
    if (!article) return;

    const calculateProgress = () => {
      const articleRect = article.getBoundingClientRect();
      const articleTop = articleRect.top + window.scrollY;
      const articleHeight = articleRect.height;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // 아티클 시작 전이면 0%
      if (scrollY < articleTop) {
        setProgress(0);
        setIsVisible(false);
        return;
      }

      // 아티클 끝을 지나면 100%
      const readableHeight = articleHeight - windowHeight * readableOffset;
      const scrolled = scrollY - articleTop;
      const percentage = Math.min(
        Math.max((scrolled / readableHeight) * 100, 0),
        100,
      );

      setProgress(percentage);
      setIsVisible(scrollY > articleTop - windowHeight * visibilityOffset);
    };

    calculateProgress();
    window.addEventListener("scroll", calculateProgress, { passive: true });
    window.addEventListener("resize", calculateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", calculateProgress);
      window.removeEventListener("resize", calculateProgress);
    };
  }, [selector, visibilityOffset, readableOffset]);

  return { progress, isVisible };
}

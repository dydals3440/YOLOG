import { useEffect, useState } from "react";

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const article = document.querySelector("article.mdx");
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
      const readableHeight = articleHeight - windowHeight * 0.3;
      const scrolled = scrollY - articleTop;
      const percentage = Math.min(
        Math.max((scrolled / readableHeight) * 100, 0),
        100,
      );

      setProgress(percentage);
      setIsVisible(scrollY > articleTop - windowHeight * 0.5);
    };

    calculateProgress();
    window.addEventListener("scroll", calculateProgress, { passive: true });
    window.addEventListener("resize", calculateProgress, { passive: true });

    return () => {
      window.removeEventListener("scroll", calculateProgress);
      window.removeEventListener("resize", calculateProgress);
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 h-1 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="읽기 진행률"
    >
      <div
        className="h-full transition-[width] duration-100 ease-out"
        style={{
          width: `${progress}%`,
          backgroundColor: "var(--progress-bar-color, #3b82f6)",
        }}
      />
    </div>
  );
}

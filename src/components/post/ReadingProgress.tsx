import { useArticleProgress } from "@/hooks/use-article-progress";

export default function ReadingProgress() {
  const { progress, isVisible } = useArticleProgress();

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

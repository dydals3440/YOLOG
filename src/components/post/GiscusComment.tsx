import { useEffect } from "react";

import { giscusThemes, type GiscusTheme } from "@/lib/utils/giscus";

// 환경 변수에서 Giscus 설정 가져오기
const GISCUS_CONFIG = {
  repo: import.meta.env.PUBLIC_GISCUS_REPO,
  repoId: import.meta.env.PUBLIC_GISCUS_REPO_ID,
  category: import.meta.env.PUBLIC_GISCUS_CATEGORY,
  categoryId: import.meta.env.PUBLIC_GISCUS_CATEGORY_ID,
} as const;

const GiscusComment = (props: React.HTMLAttributes<HTMLElement>) => {
  useEffect(() => {
    // Giscus 설정 검증
    if (!GISCUS_CONFIG.repo || !GISCUS_CONFIG.repoId) {
      console.error(
        "Giscus configuration is missing. Please check environment variables.",
      );
      return;
    }

    const theme: GiscusTheme = document.documentElement.classList.contains(
      "dark",
    )
      ? "dark"
      : "light";

    const giscusAttributes = {
      src: "https://giscus.app/client.js",
      "data-repo": GISCUS_CONFIG.repo,
      "data-repo-id": GISCUS_CONFIG.repoId,
      "data-category": GISCUS_CONFIG.category,
      "data-category-id": GISCUS_CONFIG.categoryId,
      "data-mapping": "pathname",
      "data-strict": "0",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "bottom",
      "data-lang": "ko",
      "data-theme": giscusThemes[theme],
      crossorigin: "anonymous",
      async: "",
    };

    const giscusScript = document.createElement("script");
    Object.entries(giscusAttributes).forEach(([key, value]) =>
      giscusScript.setAttribute(key, value),
    );

    // 스크립트 로드 에러 처리
    giscusScript.onerror = () => {
      console.error("Failed to load Giscus script");
    };

    const container = document.querySelector("#giscus");
    if (container && !container.hasChildNodes()) {
      container.appendChild(giscusScript);
    }
  }, []);

  return (
    <section {...props} style={{ minHeight: "372px" }} id="giscus"></section>
  );
};

export default GiscusComment;

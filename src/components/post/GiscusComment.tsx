import {
  PUBLIC_GISCUS_CATEGORY,
  PUBLIC_GISCUS_CATEGORY_ID,
  PUBLIC_GISCUS_REPO,
  PUBLIC_GISCUS_REPO_ID,
} from "astro:env/client";
import { useEffect } from "react";

import { type GiscusTheme, giscusThemes } from "@/lib/utils/giscus";

const GiscusComment = (props: React.HTMLAttributes<HTMLElement>) => {
  useEffect(() => {
    if (
      !PUBLIC_GISCUS_REPO ||
      !PUBLIC_GISCUS_REPO_ID ||
      !PUBLIC_GISCUS_CATEGORY ||
      !PUBLIC_GISCUS_CATEGORY_ID
    ) {
      console.error("Giscus configuration is missing. Please check environment variables.");
      return;
    }

    const theme: GiscusTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

    const giscusAttributes = {
      src: "https://giscus.app/client.js",
      "data-repo": PUBLIC_GISCUS_REPO,
      "data-repo-id": PUBLIC_GISCUS_REPO_ID,
      "data-category": PUBLIC_GISCUS_CATEGORY,
      "data-category-id": PUBLIC_GISCUS_CATEGORY_ID,
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
    Object.entries(giscusAttributes).forEach(([key, value]) => {
      giscusScript.setAttribute(key, value);
    });

    // 스크립트 로드 에러 처리
    giscusScript.onerror = () => {
      console.error("Failed to load Giscus script");
    };

    const container = document.querySelector("#giscus");
    if (container && !container.hasChildNodes()) {
      container.appendChild(giscusScript);
    }
  }, []);

  return <section {...props} style={{ minHeight: "372px" }} id="giscus"></section>;
};

export default GiscusComment;

import Giscus from "@giscus/react";
import {
  PUBLIC_GISCUS_CATEGORY,
  PUBLIC_GISCUS_CATEGORY_ID,
  PUBLIC_GISCUS_REPO,
  PUBLIC_GISCUS_REPO_ID,
} from "astro:env/client";

import { useIsDark } from "@/hooks/use-is-dark";

type GiscusRepo = `${string}/${string}`;

const GiscusComment = (props: React.HTMLAttributes<HTMLElement>) => {
  const isDark = useIsDark();

  return (
    <section {...props} style={{ minHeight: "372px" }} id="giscus">
      {PUBLIC_GISCUS_REPO && PUBLIC_GISCUS_REPO_ID && (
        <Giscus
          repo={PUBLIC_GISCUS_REPO as GiscusRepo}
          repoId={PUBLIC_GISCUS_REPO_ID}
          category={PUBLIC_GISCUS_CATEGORY}
          categoryId={PUBLIC_GISCUS_CATEGORY_ID}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="bottom"
          lang="ko"
          theme={isDark ? "transparent_dark" : "light"}
          loading="lazy"
        />
      )}
    </section>
  );
};

export default GiscusComment;

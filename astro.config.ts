import { readFile } from "node:fs/promises";

import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import mermaid from "astro-mermaid";
import { defineConfig, envField, fontProviders } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeCallouts from "rehype-callouts";
import rehypeExternalLinks from "rehype-external-links";
import remarkBreaks from "remark-breaks";

import { remarkPrioritizeFirstImage } from "./plugins/remark-prioritize-first-image";
import { SITE } from "./src/constants/site";

const outDir = "./dist/";
const outDirUrl = new URL(outDir, import.meta.url);
const MODIFIED_TIME_PATTERN = /<meta property="article:modified_time" content="([^"]+)"/;

// 값이 없는 빌드도 허용한다. Preview와 로컬에서는 분석과 댓글이 꺼진다.
const publicEnv = () => envField.string({ context: "client", access: "public", optional: true });

export default defineConfig({
  output: "static",
  outDir,
  trailingSlash: "never",
  site: SITE.url,
  env: {
    schema: {
      VERCEL_ENV: envField.enum({
        context: "server",
        access: "public",
        values: ["production", "preview", "development"],
        optional: true,
      }),
      PUBLIC_GA_ID: publicEnv(),
      PUBLIC_GISCUS_REPO: publicEnv(),
      PUBLIC_GISCUS_REPO_ID: publicEnv(),
      PUBLIC_GISCUS_CATEGORY: publicEnv(),
      PUBLIC_GISCUS_CATEGORY_ID: publicEnv(),
    },
  },
  fonts: [
    {
      name: "Pretendard Variable",
      cssVariable: "--font-sans",
      // 2MB 전체 파일 대신 페이지에 필요한 한글 조각만 받는다.
      provider: fontProviders.npm(),
      options: {
        package: "pretendard",
        version: "1.3.9",
        file: "dist/web/variable/pretendardvariable-dynamic-subset.css",
      },
      weights: ["45 920"],
      fallbacks: ["-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "sans-serif"],
      // 분할 글꼴의 첫 조각(전각 기호)으로 계산한 보정값(size-adjust 224%)이 영문을 키워
      // 글꼴이 바뀔 때 본문이 크게 밀렸다. 보정 없이 시스템 한글 글꼴로 대체한다.
      optimizedFallbacks: false,
    },
    {
      name: "Source Code Pro",
      cssVariable: "--font-mono",
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
  ],
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkBreaks, remarkPrioritizeFirstImage],
      rehypePlugins: [
        [
          rehypeCallouts,
          {
            theme: "github",
            callouts: {
              note: { title: "참고" },
              tip: { title: "팁" },
              warning: { title: "주의" },
              caution: { title: "위험" },
            },
          },
        ],
        rehypeHeadingIds,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
            properties: {
              className: ["anchor"],
            },
          },
        ],
        [
          rehypeExternalLinks,
          {
            properties: {
              class: "external-link",
            },
            target: "_blank",
            rel: ["noopener noreferrer"],
          },
        ],
      ],
    }),
  },
  integrations: [
    mermaid({
      autoTheme: true,
      enableLog: false,
      mermaidConfig: { layout: "dagre", look: "classic" },
    }),
    expressiveCode({
      themes: ["catppuccin-latte", "tokyo-night"],
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      useDarkModeMediaQuery: false,
      shiki: { langAlias: { gitignore: "bash" } },
      frames: { extractFileNameFromCode: false },
      styleOverrides: {
        borderRadius: "10px",
        codeFontFamily: "var(--font-mono)",
        uiFontFamily: "var(--font-sans)",
        codeFontSize: "14px",
        codeLineHeight: "1.5",
        codePaddingBlock: "20px",
        codePaddingInline: "24px",
        frames: {
          frameBoxShadowCssValue: "0 1px 2px rgb(0 0 0 / 6%), 0 4px 12px rgb(0 0 0 / 4%)",
        },
      },
    }),
    mdx(),
    react(),
    sitemap({
      async serialize(item) {
        const pathname = new URL(item.url).pathname;
        if (!pathname.startsWith("/post/")) return item;
        // 이미 생성된 SEO 메타데이터를 재사용해 lastmod의 출처를 하나로 유지한다.
        const html = await readFile(new URL(`.${pathname}/index.html`, outDirUrl), "utf8");
        const modified = html.match(MODIFIED_TIME_PATTERN)?.[1];
        return modified ? { ...item, lastmod: modified } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // 기준을 넘는 청크는 Mermaid가 필요할 때만 불러오는 ELK 배치 엔진(약 1,456kB)과 Langium 파서뿐이다.
      chunkSizeWarningLimit: 1500,
      rolldownOptions: {
        onLog(level, log, handler) {
          // Astro는 이 지시문을 더 읽지 않아 rolldown이 버려도 결과가 같다(withastro/astro#18087).
          if (
            log.code === "MODULE_LEVEL_DIRECTIVE" &&
            log.message.includes("use astro:head-inject")
          ) {
            return;
          }
          handler(level, log);
        },
      },
    },
  },
});

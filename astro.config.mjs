import { readFile } from "node:fs/promises";
import { load } from "cheerio";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";

import { unified } from "@astrojs/markdown-remark";
import { defineConfig, envField, fontProviders } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";

import { SITE_URL } from "./src/lib/config/app";

import { remarkPrioritizeFirstImage } from "./plugins/remark-prioritize-first-image";
import { transformerFragment } from "./plugins/transformer-fragment";
import { customCallout } from "./src/lib/directives";

const outDir = new URL("./dist/", import.meta.url);

// 값이 없는 빌드도 허용한다. Preview와 로컬에서는 분석과 댓글이 꺼진다.
const publicEnv = () => envField.string({ context: "client", access: "public", optional: true });

export default defineConfig({
  output: "static",
  trailingSlash: "never",
  // Astro 7의 compressHTML 기본값이 'jsx'로 바뀌어 인라인 요소 공백 처리가 달라진다.
  // 기존 v6 동작(true)을 유지하기 위해 명시적으로 고정한다.
  compressHTML: true,
  site: SITE_URL,
  env: {
    schema: {
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
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  markdown: {
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] },
    shikiConfig: {
      themes: {
        light: "catppuccin-latte",
        dark: "tokyo-night",
      },
      langAlias: {
        gitignore: "bash",
      },
      transformers: [
        transformerNotationHighlight(),
        transformerNotationDiff(),
        transformerNotationFocus(),
        transformerNotationErrorLevel(),
        transformerMetaHighlight(),
        transformerMetaWordHighlight(),
        transformerFragment(),
      ],
    },
    processor: unified({
      remarkPlugins: [remarkBreaks, remarkDirective, customCallout, remarkPrioritizeFirstImage],
      rehypePlugins: [
        rehypeSlug,
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
    mdx(),
    react(),
    sitemap({
      async serialize(item) {
        const pathname = new URL(item.url).pathname;
        if (!pathname.startsWith("/post/")) return item;
        // 이미 생성된 SEO 메타데이터를 재사용해 lastmod의 출처를 하나로 유지한다.
        const html = await readFile(new URL(`.${pathname}/index.html`, outDir), "utf8");
        const modified = load(html)('meta[property="article:modified_time"]').attr("content");
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

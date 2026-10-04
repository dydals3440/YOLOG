import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
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
import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";

import { SITE_URL } from "./src/lib/config/app";

import { transformerFragment } from "./plugins/transformer-fragment";
import { customCallout, remarkMermaid } from "./src/lib/directives";

const outDir = new URL("./dist/", import.meta.url);

export default defineConfig({
  outDir: fileURLToPath(outDir),
  redirects: { "/sitemap.xml": "/sitemap-index.xml" },
  output: "static",
  trailingSlash: "never",
  // Astro 7의 compressHTML 기본값이 'jsx'로 바뀌어 인라인 요소 공백 처리가 달라진다.
  // 기존 v6 동작(true)을 유지하기 위해 명시적으로 고정한다.
  compressHTML: true,
  adapter: vercel({
    isr: true,
  }),
  site: SITE_URL,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  markdown: {
    syntaxHighlight: "shiki",
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
      remarkPlugins: [remarkBreaks, remarkDirective, customCallout, remarkMermaid],
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
  },
});

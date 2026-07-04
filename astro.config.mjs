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

import { transformerFragment } from "./plugins/transformer-fragment";
import { customCallout, remarkMermaid } from "./src/lib/directives";

export default defineConfig({
  output: "static",
  // Astro 7의 compressHTML 기본값이 'jsx'로 바뀌어 인라인 요소 공백 처리가 달라진다.
  // 기존 v6 동작(true)을 유지하기 위해 명시적으로 고정한다.
  compressHTML: true,
  adapter: vercel({
    isr: true,
  }),
  site: "https://www.yolog.co.kr",
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
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});

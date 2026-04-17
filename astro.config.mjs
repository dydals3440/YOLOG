import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
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

import { defineConfig } from "astro/config";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";
import remarkBreaks from "remark-breaks";
import remarkDirective from "remark-directive";

import { transformerFragment } from "./plugins/transformer-fragment";
import { customCallout } from "./src/lib/directives";

export default defineConfig({
  output: "static",
  adapter: vercel({
    isr: true,
  }),
  site: "https://www.yolog.co.kr",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    mdx({
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
      remarkPlugins: [remarkBreaks, remarkDirective, customCallout],
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
    sitemap(),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

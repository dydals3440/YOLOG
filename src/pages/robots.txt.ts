import type { APIRoute } from "astro";

import { SITE } from "@/constants/site";

// 검색·AI 답변에 인용되도록 주요 AI 크롤러를 명시적으로 허용한다(2026-11 기준 user-agent).
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
] as const;

export const GET = (() => {
  const body = [
    ...AI_CRAWLERS.map((agent) => `User-agent: ${agent}`),
    "Allow: /",
    "",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", SITE.url).href}`,
  ].join("\n");

  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}) satisfies APIRoute;

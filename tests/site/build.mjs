import assert from "node:assert/strict";
import { glob, readFile } from "node:fs/promises";
import { load } from "cheerio";

export { SITE_URL } from "../../src/lib/config/app.ts";

// Vercel에 실제 업로드되는 결과를 검사한다.
const staticDir = new URL("../../.vercel/output/static/", import.meta.url);

export function readArtifact(file) {
  return readFile(new URL(file, staticDir), "utf8");
}

export async function loadPages() {
  const files = await Array.fromAsync(
    glob("**/*.html", { cwd: staticDir, exclude: ["naver*.html"] }),
  );
  assert(files.includes("index.html"), "Build output missing. Run bun run build first.");
  return Promise.all(
    files.sort().map(async (file) => ({ file, $: load(await readArtifact(file)) })),
  );
}

import { fileURLToPath } from "node:url";

import { SITE } from "../../src/constants/site";

const DIST_DIRECTORY = new URL("../../dist/", import.meta.url);

export const SITE_URL = SITE.url;

export interface ElementSnapshot {
  attributes: Map<string, string>;
  text: string;
}

export interface BuiltPage {
  file: string;
  html: string;
}

export function readArtifact(file: string) {
  return Bun.file(new URL(file, DIST_DIRECTORY)).text();
}

export async function readXmlArtifact(file: string): Promise<unknown> {
  return Bun.XML.parse(await readArtifact(file));
}

/** 빌드된 모든 파일 경로. 대소문자를 구분하지 않는 파일 시스템(macOS)에서도 운영과 같게 비교하려고 목록으로 돌려준다. */
export async function listArtifacts() {
  const glob = new Bun.Glob("**/*");
  return new Set(await Array.fromAsync(glob.scan({ cwd: fileURLToPath(DIST_DIRECTORY) })));
}

export async function loadPages(): Promise<BuiltPage[]> {
  const glob = new Bun.Glob("**/*.html");
  const files = (await Array.fromAsync(glob.scan({ cwd: fileURLToPath(DIST_DIRECTORY) })))
    .filter((file) => !file.startsWith("naver"))
    .toSorted();

  if (!files.includes("index.html")) {
    throw new Error("빌드 결과가 없습니다. 먼저 bun run build를 실행하세요.");
  }

  return Promise.all(files.map(async (file) => ({ file, html: await readArtifact(file) })));
}

export function queryAll(html: string, selector: string): ElementSnapshot[] {
  const elements: ElementSnapshot[] = [];

  new HTMLRewriter()
    .on(selector, {
      element(element) {
        elements.push({ attributes: new Map(element.attributes), text: "" });
      },
      text(chunk) {
        const current = elements.at(-1);
        if (current) {
          current.text += chunk.text;
        }
      },
    })
    .transform(html);

  return elements;
}

function queryAttribute(html: string, selector: string, attribute: string) {
  return queryAll(html, selector).at(0)?.attributes.get(attribute);
}

export function readMeta(html: string, key: string) {
  return queryAttribute(html, `meta[name="${key}"], meta[property="${key}"]`, "content");
}

export function readCanonical(html: string) {
  return queryAttribute(html, 'link[rel="canonical"]', "href");
}

export function readJsonLd(html: string): Record<string, unknown>[] {
  return queryAll(html, 'script[type="application/ld+json"]').map(({ text }) => {
    const schema: unknown = JSON.parse(text);
    if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
      throw new Error("JSON-LD는 객체여야 합니다");
    }
    return Object.fromEntries(Object.entries(schema));
  });
}

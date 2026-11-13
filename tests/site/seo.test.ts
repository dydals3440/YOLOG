import { beforeAll, describe, expect, it } from "bun:test";

import { z } from "zod";

import {
  type BuiltPage,
  loadPages,
  queryAll,
  readCanonical,
  readJsonLd,
  readArtifact,
  readMeta,
  readXmlArtifact,
  SITE_URL,
} from "./build-output";

const LocationSchema = z.object({ loc: z.string(), lastmod: z.string().optional() });
const oneOrMany = <T extends z.ZodType>(schema: T) =>
  z.union([schema, z.array(schema)]).transform((value) => (Array.isArray(value) ? value : [value]));

const SitemapIndexSchema = z.object({
  sitemapindex: z.object({ sitemap: oneOrMany(LocationSchema) }),
});
const SitemapSchema = z.object({ urlset: z.object({ url: oneOrMany(LocationSchema) }) });
const RssSchema = z.object({
  rss: z.object({ channel: z.object({ item: oneOrMany(z.object({ link: z.string() })) }) }),
});

const BlogPostingSchema = z.object({
  "@type": z.literal("BlogPosting"),
  datePublished: z.string(),
  dateModified: z.string(),
  mainEntityOfPage: z.object({ "@id": z.string() }),
});

function toArtifactPath(pathname: string) {
  const path = decodeURIComponent(pathname).replace(/^\//, "");
  if (path === "") return "index.html";
  return /\.[a-z]+$/.test(path) ? path : `${path}/index.html`;
}

function findSchema(page: BuiltPage, type: string) {
  return readJsonLd(page.html).find((schema) => schema["@type"] === type);
}

describe("배포된 페이지의 SEO", () => {
  let pages: BuiltPage[] = [];
  let indexablePages: BuiltPage[] = [];
  let articlePages: BuiltPage[] = [];

  beforeAll(async () => {
    pages = await loadPages();
    indexablePages = pages.filter(({ file }) => file !== "404.html");
    articlePages = pages.filter(({ file }) => file.startsWith("post/"));
  });

  it("대표 URL은 운영 도메인을 사용하고 쿼리·해시·불필요한 슬래시를 포함하지 않는다", () => {
    for (const { file, html } of pages) {
      // When
      const links = queryAll(html, 'link[rel="canonical"]');
      const canonical = new URL(readCanonical(html) ?? "");

      // Then
      expect(links.length, `${file}: canonical은 하나여야 합니다`).toBe(1);
      expect<string>(canonical.origin, `${file}: 대표 도메인이 다릅니다`).toBe(SITE_URL);
      expect(canonical.search + canonical.hash, `${file}: 쿼리나 해시가 포함되었습니다`).toBe("");
      expect(
        canonical.pathname === "/" || !canonical.pathname.endsWith("/"),
        `${file}: 마지막 슬래시가 포함되었습니다`,
      ).toBeTrue();
    }
  });

  it("Open Graph 주소는 대표 URL과 일치한다", () => {
    for (const { file, html } of pages) {
      expect<string | undefined>(
        readMeta(html, "og:url"),
        `${file}: OG와 canonical 주소가 다릅니다`,
      ).toBe(readCanonical(html));
    }
  });

  it("모든 페이지에 검색 제목과 설명이 있다", () => {
    for (const { file, html } of pages) {
      // When
      const title = queryAll(html, "title").at(0)?.text.trim();
      const description = readMeta(html, "description")?.trim();

      // Then
      expect(title, `${file}: 검색 제목이 없습니다`).toBeTruthy();
      expect(description, `${file}: 검색 설명이 없습니다`).toBeTruthy();
    }
  });

  it("404 페이지만 noindex로 색인에서 제외한다", () => {
    expect(pages.some(({ file }) => file === "404.html")).toBeTrue();

    for (const { file, html } of pages) {
      // Given
      const shouldExclude = file === "404.html";

      // When
      const excluded = readMeta(html, "robots")?.includes("noindex") ?? false;

      // Then
      expect(excluded, `${file}: 색인 제외 정책이 다릅니다`).toBe(shouldExclude);
    }
  });

  it("모든 페이지에 WebSite 구조화 데이터가 있다", () => {
    for (const page of pages) {
      expect(
        findSchema(page, "WebSite"),
        `${page.file}: WebSite 구조화 데이터가 없습니다`,
      ).toBeDefined();
    }
  });

  it("발행 글의 구조화 데이터는 대표 URL과 실제 작성·수정일을 나타낸다", () => {
    expect(articlePages.length, "발행된 글이 없습니다").toBeGreaterThan(0);

    for (const page of articlePages) {
      // When
      const article = BlogPostingSchema.parse(findSchema(page, "BlogPosting"));

      // Then
      expect<string | undefined>(
        article.mainEntityOfPage["@id"],
        `${page.file}: 글의 대표 URL이 다릅니다`,
      ).toBe(readCanonical(page.html));
      expect(
        new Date(article.dateModified) >= new Date(article.datePublished),
        `${page.file}: 작성·수정일이 올바르지 않습니다`,
      ).toBeTrue();
      expect<string | undefined>(
        article.dateModified,
        `${page.file}: 수정일 메타데이터가 다릅니다`,
      ).toBe(readMeta(page.html, "article:modified_time"));
    }
  });

  it("발행 글에 탐색경로 구조화 데이터가 있다", () => {
    for (const page of articlePages) {
      expect(
        findSchema(page, "BreadcrumbList"),
        `${page.file}: 탐색경로 구조화 데이터가 없습니다`,
      ).toBeDefined();
    }
  });

  describe("공식 사이트맵", () => {
    let references: URL[] = [];
    let entries: z.infer<typeof LocationSchema>[] = [];

    beforeAll(async () => {
      const index = SitemapIndexSchema.parse(await readXmlArtifact("sitemap-index.xml"));
      references = index.sitemapindex.sitemap.map(({ loc }) => new URL(loc));

      const sitemaps = await Promise.all(
        references.map(async ({ pathname }) =>
          SitemapSchema.parse(await readXmlArtifact(pathname.slice(1))),
        ),
      );
      entries = sitemaps.flatMap(({ urlset }) => urlset.url);
    });

    it("인덱스는 운영 도메인의 사이트맵 파일을 참조한다", () => {
      expect(references.length, "사이트맵 인덱스에 파일이 없습니다").toBeGreaterThan(0);

      for (const { origin } of references) {
        expect<string>(origin, "사이트맵 파일의 도메인이 다릅니다").toBe(SITE_URL);
      }
    });

    it("색인 가능한 모든 페이지를 중복 없이 포함한다", () => {
      // Given
      const canonicals = indexablePages.map(({ html }) => readCanonical(html));

      // When
      const locations = entries.map(({ loc }) => loc);

      // Then
      expect(new Set(canonicals).size, "페이지의 canonical 주소가 중복되었습니다").toBe(
        canonicals.length,
      );
      expect(new Set(locations).size, "사이트맵 주소가 중복되었습니다").toBe(locations.length);
      expect<Set<string | undefined>>(
        new Set(locations),
        "사이트맵과 공개 페이지 목록이 다릅니다",
      ).toEqual(new Set(canonicals));
    });

    it("글의 lastmod는 실제 수정일 메타데이터와 일치한다", () => {
      // Given
      const lastmodByUrl = new Map(entries.map(({ loc, lastmod }) => [loc, lastmod]));

      for (const { file, html } of articlePages) {
        // When
        const lastmod = lastmodByUrl.get(readCanonical(html) ?? "");

        // Then
        expect(lastmod, `${file}: 사이트맵 수정일이 없습니다`).toBeDefined();
        expect(new Date(lastmod ?? "").valueOf(), `${file}: 사이트맵 수정일이 다릅니다`).toBe(
          new Date(readMeta(html, "article:modified_time") ?? "").valueOf(),
        );
      }
    });
  });

  it("RSS는 모든 발행 글의 대표 URL을 중복 없이 포함한다", async () => {
    // Given
    const canonicals = articlePages.map(({ html }) => readCanonical(html));

    // When
    const rss = RssSchema.parse(await readXmlArtifact("rss.xml"));
    const links = rss.rss.channel.item.map(({ link }) => link);

    // Then
    expect(new Set(links).size, "RSS 주소가 중복되었습니다").toBe(links.length);
    expect<Set<string | undefined>>(new Set(links), "RSS와 발행 글 목록이 다릅니다").toEqual(
      new Set(canonicals),
    );
  });

  it("글의 앞부분 이미지만 우선 로드한다", () => {
    const prioritizedCounts = articlePages.map(({ file, html }) => {
      // When
      const prioritized = queryAll(html, '.mdx img[fetchpriority="high"]');

      // Then
      expect(
        prioritized.length,
        `${file}: 우선 로드 이미지는 한 장이어야 합니다`,
      ).toBeLessThanOrEqual(1);
      expect(
        prioritized.at(0)?.attributes.get("loading") ?? "eager",
        `${file}: lazy와 함께 쓸 수 없습니다`,
      ).toBe("eager");
      return prioritized.length;
    });

    expect(prioritizedCounts, "우선 로드 이미지가 있는 글이 없습니다").toContain(1);
  });

  it("목차는 본문의 모든 H2로 정확히 이동한다", () => {
    for (const { file, html } of articlePages) {
      // When
      const tocSlugs = queryAll(html, "[data-section-link]").map(({ attributes }) =>
        attributes.get("data-section-link"),
      );
      const headingIds = queryAll(html, ".mdx h2").map(({ attributes }) => attributes.get("id"));

      // Then
      expect(tocSlugs, `${file}: 목차와 본문 제목이 다릅니다`).toStrictEqual(headingIds);
    }
  });

  it("인터랙션 MDX가 없는 페이지는 React 섬을 싣지 않는다", () => {
    // Given
    const staticPages = pages.filter(({ html }) => !html.includes("client:"));

    for (const { file, html } of staticPages) {
      // When
      const islands = queryAll(html, "astro-island");

      // Then
      expect(islands.length, `${file}: 불필요한 React 섬이 있습니다`).toBe(0);
    }
  });

  it("내부 링크는 모두 빌드된 페이지나 파일을 가리킨다", async () => {
    // Given
    const internalLinks = new Set(
      pages.flatMap(({ html }) =>
        queryAll(html, "a[href^='/']")
          .map(({ attributes }) => attributes.get("href") ?? "")
          .filter((href) => !href.startsWith("//"))
          .map((href) => new URL(href, SITE_URL).pathname),
      ),
    );

    // When
    const results = await Promise.all(
      [...internalLinks].map(async (pathname) => ({
        pathname,
        exists: await readArtifact(toArtifactPath(pathname)).then(
          () => true,
          () => false,
        ),
      })),
    );

    // Then
    expect(results.filter(({ exists }) => !exists).map(({ pathname }) => pathname)).toEqual([]);
  });

  it("플레이스홀더 광고 슬롯을 내보내지 않는다", () => {
    for (const { file, html } of pages) {
      expect(
        queryAll(html, "ins.adsbygoogle").length,
        `${file}: 수동 광고 슬롯이 남아 있습니다`,
      ).toBe(0);
    }
  });
});

describe("배포 설정", () => {
  it("기존 sitemap.xml 주소는 공식 인덱스로 영구 리디렉션한다", async () => {
    // Given
    const VercelConfigSchema = z.object({
      redirects: z.array(
        z.object({ source: z.string(), destination: z.string(), statusCode: z.number() }),
      ),
    });

    // When
    const { redirects } = VercelConfigSchema.parse(
      await Bun.file(new URL("../../vercel.json", import.meta.url)).json(),
    );

    // Then
    expect(redirects).toContainEqual({
      source: "/sitemap.xml",
      destination: "/sitemap-index.xml",
      statusCode: 301,
    });
  });
});

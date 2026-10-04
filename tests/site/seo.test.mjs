import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, describe, it } from "node:test";
import { load } from "cheerio";
import { loadPages, readArtifact, SITE_URL } from "./build.mjs";

const canonicalOf = ({ $ }) => $("link[rel=canonical]").attr("href");
const meta = ($, key) => $(`meta[name="${key}"],meta[property="${key}"]`).attr("content");

function schemasOf({ file, $ }) {
  return $('script[type="application/ld+json"]')
    .toArray()
    .map((node) => {
      try {
        return JSON.parse($(node).text());
      } catch (cause) {
        throw new Error(`${file}: JSON-LD가 올바른 JSON이 아닙니다`, { cause });
      }
    });
}

describe("배포된 페이지의 SEO", () => {
  let pages;
  let indexable;
  let articles;

  before(async () => {
    pages = await loadPages();
    indexable = pages.filter(({ file }) => file !== "404.html");
    articles = pages.filter(({ file }) => file.startsWith("post/"));
  });

  it("대표 URL은 운영 도메인을 사용하고 쿼리·해시·불필요한 슬래시를 포함하지 않는다", () => {
    // Given
    const expectedOrigin = SITE_URL;
    for (const page of pages) {
      // When
      const links = page.$("link[rel=canonical]");
      const href = links.attr("href");

      // Then
      assert.equal(links.length, 1, `${page.file}: canonical은 하나여야 합니다`);
      assert(href, `${page.file}: canonical 주소가 없습니다`);
      const canonical = new URL(href);
      assert.equal(canonical.origin, expectedOrigin, `${page.file}: 대표 도메인이 다릅니다`);
      assert.equal(
        canonical.search + canonical.hash,
        "",
        `${page.file}: 쿼리나 해시가 포함되었습니다`,
      );
      assert(
        canonical.pathname === "/" || !canonical.pathname.endsWith("/"),
        `${page.file}: 마지막 슬래시가 포함되었습니다`,
      );
    }
  });

  it("Open Graph 주소는 대표 URL과 일치한다", () => {
    // Given
    for (const page of pages) {
      const canonical = canonicalOf(page);

      // When
      const ogUrl = meta(page.$, "og:url");

      // Then
      assert.equal(ogUrl, canonical, `${page.file}: OG와 canonical 주소가 다릅니다`);
    }
  });

  it("모든 페이지에 검색 제목과 설명이 있다", () => {
    // Given
    for (const { file, $ } of pages) {
      // When
      const title = $("title").text().trim();
      const description = meta($, "description")?.trim();

      // Then
      assert(title, `${file}: 검색 제목이 없습니다`);
      assert(description, `${file}: 검색 설명이 없습니다`);
    }
  });

  it("404 페이지만 noindex로 색인에서 제외한다", () => {
    // Given
    assert(
      pages.some(({ file }) => file === "404.html"),
      "404 페이지가 없습니다",
    );
    for (const { file, $ } of pages) {
      const shouldExclude = file === "404.html";

      // When
      const excluded = meta($, "robots")?.includes("noindex") ?? false;

      // Then
      assert.equal(excluded, shouldExclude, `${file}: 색인 제외 정책이 다릅니다`);
    }
  });

  it("모든 페이지에 WebSite 구조화 데이터가 있다", () => {
    // Given
    for (const page of pages) {
      // When
      const website = schemasOf(page).find((schema) => schema["@type"] === "WebSite");

      // Then
      assert(website, `${page.file}: WebSite 구조화 데이터가 없습니다`);
    }
  });

  it("발행 글의 구조화 데이터는 대표 URL과 실제 작성·수정일을 나타낸다", () => {
    // Given
    assert(articles.length, "발행된 글이 없습니다");
    for (const page of articles) {
      const canonical = canonicalOf(page);
      const modifiedTime = meta(page.$, "article:modified_time");

      // When
      const article = schemasOf(page).find((schema) => schema["@type"] === "BlogPosting");

      // Then
      assert(article, `${page.file}: BlogPosting 구조화 데이터가 없습니다`);
      assert.equal(
        article.mainEntityOfPage?.["@id"],
        canonical,
        `${page.file}: 글의 대표 URL이 다릅니다`,
      );
      assert(
        new Date(article.dateModified) >= new Date(article.datePublished),
        `${page.file}: 작성·수정일이 올바르지 않습니다`,
      );
      assert.equal(
        article.dateModified,
        modifiedTime,
        `${page.file}: 수정일 메타데이터가 다릅니다`,
      );
    }
  });

  it("발행 글에 탐색경로 구조화 데이터가 있다", () => {
    // Given
    for (const page of articles) {
      // When
      const breadcrumb = schemasOf(page).find((schema) => schema["@type"] === "BreadcrumbList");

      // Then
      assert(breadcrumb, `${page.file}: 탐색경로 구조화 데이터가 없습니다`);
    }
  });

  describe("공식 사이트맵", () => {
    let references;
    let entries;

    before(async () => {
      const index = load(await readArtifact("sitemap-index.xml"), { xml: true });
      references = index("sitemap > loc")
        .toArray()
        .map((node) => new URL(index(node).text()));
      const maps = await Promise.all(
        references.map(async (url) =>
          load(await readArtifact(url.pathname.slice(1)), { xml: true }),
        ),
      );
      entries = maps.flatMap(($) =>
        $("urlset > url")
          .toArray()
          .map((node) => ({
            url: $(node).find("loc").text(),
            lastmod: $(node).find("lastmod").text(),
          })),
      );
    });

    it("인덱스는 운영 도메인의 사이트맵 파일을 참조한다", () => {
      // Given
      const expectedOrigin = SITE_URL;

      // When
      const origins = references.map((url) => url.origin);

      // Then
      assert(origins.length, "사이트맵 인덱스에 파일이 없습니다");
      for (const origin of origins) {
        assert.equal(origin, expectedOrigin, "사이트맵 파일의 도메인이 다릅니다");
      }
    });

    it("색인 가능한 모든 페이지를 중복 없이 포함한다", () => {
      // Given
      const expected = indexable.map(canonicalOf);

      // When
      const locations = entries.map((entry) => entry.url);

      // Then
      assert.equal(
        expected.length,
        new Set(expected).size,
        "페이지의 canonical 주소가 중복되었습니다",
      );
      assert.equal(locations.length, new Set(locations).size, "사이트맵 주소가 중복되었습니다");
      assert.deepEqual(
        new Set(locations),
        new Set(expected),
        "사이트맵과 공개 페이지 목록이 다릅니다",
      );
    });

    it("글의 lastmod는 실제 수정일 메타데이터와 일치한다", () => {
      // Given
      const sitemapDates = new Map(entries.map(({ url, lastmod }) => [url, lastmod]));
      for (const page of articles) {
        const expectedDate = meta(page.$, "article:modified_time");

        // When
        const lastmod = sitemapDates.get(canonicalOf(page));

        // Then
        assert(lastmod, `${page.file}: 사이트맵 수정일이 없습니다`);
        assert.equal(
          new Date(lastmod).toISOString(),
          expectedDate,
          `${page.file}: 사이트맵 수정일이 다릅니다`,
        );
      }
    });
  });

  it("RSS는 모든 발행 글의 대표 URL을 중복 없이 포함한다", async () => {
    // Given
    const expected = articles.map(canonicalOf);

    // When
    const $ = load(await readArtifact("rss.xml"), { xml: true });
    const links = $("item > link")
      .toArray()
      .map((node) => $(node).text());

    // Then
    assert.equal(links.length, new Set(links).size, "RSS 주소가 중복되었습니다");
    assert.deepEqual(new Set(links), new Set(expected), "RSS와 발행 글 목록이 다릅니다");
  });

  it("기존 sitemap.xml 주소는 공식 인덱스로 영구 리디렉션한다", async () => {
    // Given
    const configFile = new URL("../../.vercel/output/config.json", import.meta.url);

    // When
    const deployment = JSON.parse(await readFile(configFile, "utf8"));
    const redirect = deployment.routes.find(
      (route) =>
        route.headers?.Location === "/sitemap-index.xml" &&
        [301, 308].includes(route.status) &&
        new RegExp(route.src).test("/sitemap.xml"),
    );

    // Then
    assert(redirect, "기존 사이트맵의 영구 리디렉션이 없습니다");
  });
});

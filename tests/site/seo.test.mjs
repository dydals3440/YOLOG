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
        throw new Error(`${file}: invalid JSON-LD`, { cause });
      }
    });
}

describe("Deployed SEO", () => {
  let pages;
  let indexable;
  let articles;

  before(async () => {
    pages = await loadPages();
    indexable = pages.filter(({ file }) => file !== "404.html");
    articles = pages.filter(({ file }) => file.startsWith("post/"));
  });

  it("every page has a canonical URL, matching OG URL, title and description", () => {
    for (const page of pages) {
      const { file, $ } = page;
      assert.equal($("link[rel=canonical]").length, 1, `${file}: canonical count`);
      assert(canonicalOf(page), `${file}: canonical href missing`);
      const canonical = new URL(canonicalOf(page));
      assert.equal(canonical.origin, SITE_URL, `${file}: canonical host`);
      assert.equal(canonical.search + canonical.hash, "", `${file}: canonical query/hash`);
      assert(
        canonical.pathname === "/" || !canonical.pathname.endsWith("/"),
        `${file}: trailing slash`,
      );
      assert.equal(meta($, "og:url"), canonical.href, `${file}: OG/canonical mismatch`);
      assert($("title").text().trim(), `${file}: title missing`);
      assert(meta($, "description")?.trim(), `${file}: description missing`);
    }
  });

  it("only the 404 page is excluded from indexing", () => {
    assert(
      pages.some(({ file }) => file === "404.html"),
      "404 page missing",
    );
    for (const { file, $ } of pages) {
      assert.equal(
        meta($, "robots")?.includes("noindex") ?? false,
        file === "404.html",
        `${file}: indexing policy`,
      );
    }
  });

  it("structured data describes the site and each published article", () => {
    for (const page of pages) {
      assert(
        schemasOf(page).some((schema) => schema["@type"] === "WebSite"),
        `${page.file}: WebSite missing`,
      );
    }
    assert(articles.length, "No published articles found");
    for (const page of articles) {
      const { file, $ } = page;
      const schemas = schemasOf(page);
      const article = schemas.find((schema) => schema["@type"] === "BlogPosting");
      assert(article, `${file}: BlogPosting missing`);
      assert.equal(
        article.mainEntityOfPage?.["@id"],
        canonicalOf(page),
        `${file}: article canonical`,
      );
      assert(
        new Date(article.dateModified) >= new Date(article.datePublished),
        `${file}: invalid update date`,
      );
      assert.equal(
        meta($, "article:modified_time"),
        article.dateModified,
        `${file}: modified time mismatch`,
      );
      assert(
        schemas.some((schema) => schema["@type"] === "BreadcrumbList"),
        `${file}: breadcrumbs missing`,
      );
    }
  });

  it("the sitemap contains every indexable page exactly once with matching article dates", async () => {
    const index = load(await readArtifact("sitemap-index.xml"), { xml: true });
    const sitemapFiles = index("sitemap > loc")
      .toArray()
      .map((node) => index(node).text());
    assert(sitemapFiles.length, "Sitemap index has no files");
    const modifiedDates = new Map(
      articles.map((page) => [canonicalOf(page), meta(page.$, "article:modified_time")]),
    );
    const maps = await Promise.all(
      sitemapFiles.map(async (file) => {
        const url = new URL(file);
        assert.equal(url.origin, SITE_URL, "Unexpected sitemap host");
        return load(await readArtifact(url.pathname.slice(1)), { xml: true });
      }),
    );
    const locations = [];
    for (const $ of maps) {
      for (const node of $("urlset > url").toArray()) {
        const location = $(node).find("loc").text();
        locations.push(location);
        if (modifiedDates.has(location)) {
          assert.equal(
            new Date($(node).find("lastmod").text()).toISOString(),
            modifiedDates.get(location),
            `${location}: lastmod mismatch`,
          );
        }
      }
    }
    const expected = indexable.map(canonicalOf);
    assert.equal(expected.length, new Set(expected).size, "Duplicate page canonical");
    assert.equal(locations.length, new Set(locations).size, "Duplicate sitemap entry");
    assert.deepEqual(new Set(locations), new Set(expected), "Sitemap/page mismatch");
  });

  it("the RSS feed contains every published article exactly once", async () => {
    const $ = load(await readArtifact("rss.xml"), { xml: true });
    const links = $("item > link")
      .toArray()
      .map((node) => $(node).text());
    assert.equal(links.length, new Set(links).size, "Duplicate RSS entry");
    assert.deepEqual(new Set(links), new Set(articles.map(canonicalOf)), "RSS/article mismatch");
  });

  it("the legacy sitemap URL permanently redirects to the official index", async () => {
    const deployment = JSON.parse(
      await readFile(new URL("../../.vercel/output/config.json", import.meta.url), "utf8"),
    );
    assert(
      deployment.routes.some(
        (route) =>
          route.headers?.Location === "/sitemap-index.xml" &&
          [301, 308].includes(route.status) &&
          new RegExp(route.src).test("/sitemap.xml"),
      ),
      "Legacy sitemap redirect missing",
    );
  });
});

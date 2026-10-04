import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { load } from "cheerio";
import { SITE_URL } from "../src/lib/config/app.ts";

// Vercel에 실제 업로드되는 파일을 검증한다. UI HTML을 정규식으로 파싱하지 않는다.
const root = ".vercel/output/static";
const home = load(await readFile(path.join(root, "index.html"), "utf8"));
const analytics = process.env.EXPECT_ANALYTICS ?? (home("#yolog-ga").length ? "on" : "off");
assert(["on", "off"].includes(analytics), "EXPECT_ANALYTICS must be on or off");
const liveBuild = !["preview", "development"].includes(process.env.VERCEL_ENV);
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const target = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(target) : [target];
      }),
    )
  ).flat();
}
const files = (await walk(root)).filter((file) => file.endsWith(".html"));
const documents = await Promise.all(
  files.map(async (file) => [file, await readFile(file, "utf8")]),
);
const canonicals = new Set();
const modifiedDates = new Map();
let bootstrap;
for (const [file, html] of documents) {
  const relative = path.relative(root, file);
  if (relative.startsWith("naver")) continue;
  const $ = load(html);
  const meta = (key) => $(`meta[name="${key}"],meta[property="${key}"]`).attr("content");
  const canonical = new URL($("link[rel=canonical]").attr("href"));
  assert.equal(canonical.origin, SITE_URL, `${relative}: canonical host`);
  assert.equal(canonical.search + canonical.hash, "", `${relative}: canonical query/hash`);
  assert(
    canonical.pathname === "/" || !canonical.pathname.endsWith("/"),
    `${relative}: trailing slash`,
  );
  assert.equal(meta("og:url"), canonical.href, `${relative}: OG/canonical mismatch`);
  assert(
    meta("description")?.trim() && $("title").text().trim(),
    `${relative}: title/description missing`,
  );
  const schemas = $('script[type="application/ld+json"]')
    .toArray()
    .map((node) => JSON.parse($(node).text()));
  assert(
    schemas.some((schema) => schema["@type"] === "WebSite"),
    `${relative}: WebSite missing`,
  );
  if (relative === "404.html") {
    assert(meta("robots").includes("noindex"), "404 must be noindex");
    continue;
  }
  assert(!canonicals.has(canonical.href), `${relative}: duplicate canonical`);
  canonicals.add(canonical.href);
  const article = schemas.find((entry) => entry["@type"] === "BlogPosting");
  if (article) {
    assert.equal(article.mainEntityOfPage["@id"], canonical.href, `${relative}: article canonical`);
    assert(
      new Date(article.dateModified) >= new Date(article.datePublished),
      `${relative}: invalid update date`,
    );
    assert(
      schemas.some((entry) => entry["@type"] === "BreadcrumbList"),
      `${relative}: breadcrumbs`,
    );
    modifiedDates.set(canonical.href, article.dateModified);
    bootstrap ??= $("#yolog-ga").text();
  }
  assert.equal(
    $('script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]').length,
    liveBuild ? 1 : 0,
    `${relative}: ad loader count`,
  );
  assert.equal($("#yolog-ga").length, analytics === "on" ? 1 : 0, `${relative}: GA build gate`);
}
const deployment = JSON.parse(await readFile(".vercel/output/config.json", "utf8"));
assert(
  deployment.routes.some(
    (route) =>
      route.headers?.Location === "/sitemap-index.xml" &&
      [301, 308].includes(route.status) &&
      new RegExp(route.src).test("/sitemap.xml"),
  ),
  "Legacy sitemap URL must permanently redirect to the official index",
);
const index = load(await readFile(path.join(root, "sitemap-index.xml"), "utf8"), { xml: true });
const sitemapFiles = index("sitemap > loc")
  .toArray()
  .map((node) => index(node).text());
assert(sitemapFiles.length, "Sitemap index has no files");
const maps = await Promise.all(
  sitemapFiles.map(async (url) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, SITE_URL, "Unexpected sitemap host");
    return load(await readFile(path.join(root, parsed.pathname), "utf8"), { xml: true });
  }),
);
const locations = [];
for (const $ of maps) {
  for (const node of $("urlset > url").toArray()) {
    const url = $(node).find("loc").text();
    locations.push(url);
    if (modifiedDates.has(url)) {
      assert.equal(
        new Date($(node).find("lastmod").text()).toISOString(),
        modifiedDates.get(url),
        `${url}: lastmod mismatch`,
      );
    }
  }
}
assert.equal(locations.length, new Set(locations).size, "Duplicate sitemap entries");
assert.deepEqual(new Set(locations), canonicals, "Sitemap must match every indexable page");
const rss = load(await readFile(path.join(root, "rss.xml"), "utf8"), { xml: true });
for (const node of rss("item > link").toArray()) {
  const url = rss(node).text();
  assert(canonicals.has(url), `RSS URL is not canonical: ${url}`);
}
if (analytics === "on") {
  assert(bootstrap, "GA bootstrap missing");
  // 브라우저 대신 격리된 VM에서 실행해 실제 GA 요청을 보내지 않는다.
  function run(host) {
    const loaded = [];
    const window = {};
    const context = vm.createContext({
      window,
      URL,
      location: {
        hostname: host,
        href: `https://${host}/post/example?utm_source=test&email=private#heading`,
      },
      document: {
        createElement: () => ({}),
        head: { appendChild: (script) => loaded.push(script) },
      },
    });
    vm.runInContext(bootstrap, context);
    vm.runInContext(bootstrap, context);
    return { window, loaded };
  }
  const live = run(new URL(SITE_URL).hostname);
  assert.equal(live.loaded.length, 1, "GA loader duplicated");
  const configs = live.window.dataLayer.filter((args) => args[0] === "config");
  assert.equal(configs.length, 1, "Page view config duplicated");
  assert.equal(configs[0][2].page_location, `${SITE_URL}/post/example?utm_source=test`);
  assert(configs[0][2].content_group, "Content group missing");
  for (const host of ["localhost", "yolog-preview.vercel.app"]) {
    assert.equal(run(host).loaded.length, 0, `${host}: unexpected GA collection`);
  }
}
console.log(
  `Verified ${canonicals.size} canonical pages, ${modifiedDates.size} articles, sitemap/RSS/JSON-LD and analytics (${analytics}).`,
);

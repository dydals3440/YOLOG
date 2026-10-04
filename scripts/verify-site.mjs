import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

// 생성된 결과를 검증하므로 템플릿과 실제 배포 파일이 어긋나도 잡아낸다.
const root = existsSync(".vercel/output/static/index.html") ? ".vercel/output/static" : "dist";
const origin = "https://www.yolog.co.kr";
const mode = process.env.EXPECT_ANALYTICS ?? "on";
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}
function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(
      ([, key, double, single, bare]) => [key, double ?? single ?? bare],
    ),
  );
}
function meta(html, key) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attributes(tag));
  return tags.find((tag) => tag.name === key || tag.property === key)?.content;
}
const files = (await walk(root)).filter((file) => file.endsWith(".html"));
const canonicals = new Set();
let articles = 0;
let sample;
const documents = await Promise.all(
  files.map(async (file) => [file, await readFile(file, "utf8")]),
);
for (const [file, html] of documents) {
  const relative = path.relative(root, file);
  if (relative.startsWith("naver")) continue;
  const canonicalTag = [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => attributes(tag))
    .find((tag) => tag.rel === "canonical");
  assert(canonicalTag?.href, `${relative}: canonical missing`);
  const canonical = new URL(canonicalTag.href);
  assert.equal(canonical.origin, origin, `${relative}: canonical host`);
  assert.equal(canonical.search + canonical.hash, "", `${relative}: canonical query/hash`);
  assert(
    canonical.pathname === "/" || !canonical.pathname.endsWith("/"),
    `${relative}: trailing slash`,
  );
  assert.equal(meta(html, "og:url"), canonical.href, `${relative}: OG/canonical mismatch`);
  assert(meta(html, "description")?.trim(), `${relative}: description missing`);
  assert(/<title>[^<]+<\/title>/.test(html), `${relative}: title missing`);
  const schemas = [
    ...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map(([, json]) => JSON.parse(json));
  assert(
    schemas.some((schema) => schema["@type"] === "WebSite"),
    `${relative}: WebSite missing`,
  );
  if (relative === "404.html") {
    assert(meta(html, "robots").includes("noindex"), "404 must be noindex");
    continue;
  }
  assert(!canonicals.has(canonical.href), `${relative}: duplicate canonical`);
  canonicals.add(canonical.href);
  const schema = schemas.find((entry) => entry["@type"] === "BlogPosting");
  if (schema) {
    articles++;
    assert.equal(schema.mainEntityOfPage["@id"], canonical.href, `${relative}: article canonical`);
    assert(
      new Date(schema.dateModified) >= new Date(schema.datePublished),
      `${relative}: invalid update date`,
    );
    assert(
      schemas.some((entry) => entry["@type"] === "BreadcrumbList"),
      `${relative}: breadcrumbs`,
    );
    sample ??= html;
  }
  const ads = [
    ...html.matchAll(
      /<script\b[^>]*src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*>/g,
    ),
  ];
  assert.equal(ads.length, mode === "on" ? 1 : 0, `${relative}: ad loader count`);
  assert.equal(html.includes("window.gtag('config'"), mode === "on", `${relative}: GA build gate`);
}
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value);
assert.equal(locations.length, new Set(locations).size, "Duplicate sitemap entries");
assert.deepEqual(new Set(locations), canonicals, "Sitemap must match every indexable page");
const index = await readFile(path.join(root, "sitemap-index.xml"), "utf8");
assert(
  index.includes(`${origin}/sitemap.xml`),
  "Legacy sitemap index must point to current sitemap",
);
const rss = await readFile(path.join(root, "rss.xml"), "utf8");
for (const [, link] of rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)) {
  assert(canonicals.has(link), `RSS URL is not canonical: ${link}`);
}
if (mode === "on") {
  const bootstrap = [...sample.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, code]) => code)
    .find((code) => code.includes("window.gtag('config'"));
  assert(bootstrap, "GA bootstrap missing");
  function run(host) {
    const loaded = [];
    const window = {};
    const context = vm.createContext({
      window,
      location: {
        hostname: host,
        href: `https://${host}/post/http-cache?utm_source=test&email=private#heading`,
      },
      document: {
        createElement: () => ({}),
        head: { appendChild: (script) => loaded.push(script) },
      },
      URL,
    });
    vm.runInContext(bootstrap, context);
    vm.runInContext(bootstrap, context);
    return { window, loaded };
  }
  const live = run("www.yolog.co.kr");
  assert.equal(live.loaded.length, 1, "GA loader duplicated");
  const configs = live.window.dataLayer.filter((args) => args[0] === "config");
  assert.equal(configs.length, 1, "Page view config duplicated");
  assert.equal(configs[0][2].page_location, `${origin}/post/http-cache?utm_source=test`);
  assert(configs[0][2].content_group, "Content group missing");
  for (const host of ["localhost", "yolog-preview.vercel.app"]) {
    const preview = run(host);
    assert.equal(preview.loaded.length, 0, `${host}: unexpected GA collection`);
    assert.equal(preview.window.gtag, undefined);
  }
}
console.log(
  `Verified ${canonicals.size} canonical pages, ${articles} articles, sitemap/RSS/JSON-LD and analytics (${mode}).`,
);

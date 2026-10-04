import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import vm from "node:vm";
import { loadPages, SITE_URL } from "./build.mjs";

const production = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
const gaId = process.env.PUBLIC_GA_ID?.trim();
const configured = /^G-[A-Z0-9]+$/.test(gaId ?? "") && gaId !== "G-XXXXXXXXXX";
const expected = process.env.EXPECT_ANALYTICS ?? (production && configured ? "on" : "off");

// 생성된 태그를 최소 브라우저 환경에서 실행한다. 실제 GA 요청은 보내지 않는다.
function executeBootstrap(bootstrap, hostname, repetitions = 1) {
  const scripts = [];
  const window = {};
  const context = vm.createContext({
    window,
    URL,
    location: {
      hostname,
      href: `https://${hostname}/post/example?utm_source=test&email=private#heading`,
    },
    document: {
      createElement: () => ({}),
      head: { appendChild: (script) => scripts.push(script) },
    },
  });
  for (let i = 0; i < repetitions; i++) {
    vm.runInContext(bootstrap, context, { timeout: 1000 });
  }
  return { scripts, configs: window.dataLayer?.filter((args) => args[0] === "config") ?? [] };
}

describe("Deployed monitoring", () => {
  let pages;
  let bootstrap;

  before(async () => {
    assert(["on", "off"].includes(expected), "EXPECT_ANALYTICS must be on or off");
    pages = await loadPages();
    const article = pages.find(({ file }) => file.startsWith("post/"));
    bootstrap = article?.$("#yolog-ga").text();
  });

  it("GA presence matches the requested build environment", () => {
    for (const { file, $ } of pages) {
      assert.equal($("#yolog-ga").length, expected === "on" ? 1 : 0, `${file}: GA build gate`);
    }
  });

  it("AdSense loads once in production and is absent from preview builds", () => {
    for (const { file, $ } of pages) {
      const count = $(
        'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
      ).length;
      assert.equal(count, production ? 1 : 0, `${file}: ad loader count`);
    }
  });

  describe("GA bootstrap", { skip: expected === "off" }, () => {
    before(() => assert(bootstrap, "Article GA bootstrap missing"));

    it("repeated initialization creates one loader and one page view config", () => {
      const { scripts, configs } = executeBootstrap(bootstrap, new URL(SITE_URL).hostname, 2);
      assert.equal(scripts.length, 1, "GA loader duplicated");
      assert.equal(configs.length, 1, "Page view config duplicated");
      assert(scripts[0].async, "GA loader must be async");
      assert.equal(new URL(scripts[0].src).origin, "https://www.googletagmanager.com");
    });

    it("page location preserves attribution and excludes private query values and fragments", () => {
      const { configs } = executeBootstrap(bootstrap, new URL(SITE_URL).hostname);
      assert.equal(configs[0]?.[2].page_location, `${SITE_URL}/post/example?utm_source=test`);
      assert(configs[0]?.[2].content_group, "Content group missing");
    });

    for (const hostname of ["localhost", "yolog-preview.vercel.app"]) {
      it(`does not collect analytics on ${hostname}`, () => {
        const { scripts, configs } = executeBootstrap(bootstrap, hostname);
        assert.equal(scripts.length, 0);
        assert.equal(configs.length, 0);
      });
    }
  });
});

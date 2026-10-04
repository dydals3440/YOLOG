import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { loadPages, SITE_URL } from "./build.mjs";
import { executeBootstrap } from "./ga-fixture.mjs";

const production = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
const gaId = process.env.PUBLIC_GA_ID?.trim();
const configured = /^G-[A-Z0-9]+$/.test(gaId ?? "") && gaId !== "G-XXXXXXXXXX";
const gaExpected = process.env.EXPECT_ANALYTICS ?? (production && configured ? "on" : "off");

describe("배포된 모니터링", () => {
  let pages;
  let bootstrap;
  let articleCategory;

  before(async () => {
    assert(["on", "off"].includes(gaExpected), "EXPECT_ANALYTICS는 on 또는 off여야 합니다");
    pages = await loadPages();
    const article = pages.find(({ file }) => file.startsWith("post/"));
    bootstrap = article?.$("#yolog-ga").text();
    articleCategory = article?.$('meta[property="article:section"]').attr("content") ?? "사이트";
  });

  it("GA 태그 포함 여부는 빌드 환경의 기대값과 일치한다", () => {
    // Given
    const expectedCount = gaExpected === "on" ? 1 : 0;
    for (const { file, $ } of pages) {
      // When
      const count = $("#yolog-ga").length;

      // Then
      assert.equal(count, expectedCount, `${file}: GA 태그 포함 여부가 다릅니다`);
    }
  });

  it("광고 태그는 운영 빌드에서 한 번 로드되고 미리보기에서는 제외된다", () => {
    // Given
    const expectedCount = production ? 1 : 0;
    for (const { file, $ } of pages) {
      // When
      const count = $(
        'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
      ).length;

      // Then
      assert.equal(count, expectedCount, `${file}: 광고 로더 개수가 다릅니다`);
    }
  });

  describe("GA 초기화 동작", { skip: gaExpected === "off" }, () => {
    before(() => assert(bootstrap, "글 페이지의 GA 초기화 태그가 없습니다"));

    it("반복 초기화해도 로더와 페이지뷰 설정은 한 번만 생성된다", () => {
      // Given
      const hostname = new URL(SITE_URL).hostname;

      // When
      const { scripts, configs } = executeBootstrap(bootstrap, hostname, 2);

      // Then
      assert.equal(scripts.length, 1, "GA 로더가 중복되었습니다");
      assert.equal(configs.length, 1, "페이지뷰 설정이 중복되었습니다");
    });

    it("Google 태그는 공식 도메인에서 비동기로 로드된다", () => {
      // Given
      const hostname = new URL(SITE_URL).hostname;

      // When
      const { scripts } = executeBootstrap(bootstrap, hostname);

      // Then
      assert.equal(scripts.length, 1, "GA 로더가 없습니다");
      assert(scripts[0].async, "GA 로더는 비동기여야 합니다");
      assert.equal(
        new URL(scripts[0].src).origin,
        "https://www.googletagmanager.com",
        "Google 태그 도메인이 다릅니다",
      );
    });

    it("페이지 주소는 유입 파라미터를 보존하고 개인 쿼리와 해시를 제외한다", () => {
      // Given
      const hostname = new URL(SITE_URL).hostname;
      const expectedUrl = `${SITE_URL}/post/example?utm_source=test`;

      // When
      const { configs } = executeBootstrap(bootstrap, hostname);

      // Then
      assert.equal(
        configs[0]?.[2].page_location,
        expectedUrl,
        "GA 페이지 주소 정제가 올바르지 않습니다",
      );
    });

    it("글의 카테고리를 content_group으로 전달한다", () => {
      // Given
      const hostname = new URL(SITE_URL).hostname;
      const expectedCategory = articleCategory;

      // When
      const { configs } = executeBootstrap(bootstrap, hostname);

      // Then
      assert.equal(
        configs[0]?.[2].content_group,
        expectedCategory,
        "GA와 글의 카테고리가 다릅니다",
      );
    });

    for (const hostname of ["localhost", "yolog-preview.vercel.app"]) {
      it(`${hostname}에서는 분석을 수집하지 않는다`, () => {
        // Given
        // 운영 호스트와 다른 로컬·미리보기 주소를 사용한다.

        // When
        const { scripts, configs } = executeBootstrap(bootstrap, hostname);

        // Then
        assert.equal(scripts.length, 0, `${hostname}: GA 로더가 생성되었습니다`);
        assert.equal(configs.length, 0, `${hostname}: 페이지뷰가 설정되었습니다`);
      });
    }
  });
});

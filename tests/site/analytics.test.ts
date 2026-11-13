import { beforeAll, describe, expect, it } from "bun:test";

import { z } from "zod";

import { type BuiltPage, loadPages, queryAll, readMeta, SITE_URL } from "./build-output";
import { runGaBootstrap } from "./ga-bootstrap";

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;
const PLACEHOLDER_GA_ID = "G-XXXXXXXXXX";
const ADSENSE_LOADER_SELECTOR =
  'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';

const isProductionBuild = !Bun.env.VERCEL_ENV || Bun.env.VERCEL_ENV === "production";
const gaId = Bun.env.PUBLIC_GA_ID?.trim() ?? "";
const isGaConfigured = GA_ID_PATTERN.test(gaId) && gaId !== PLACEHOLDER_GA_ID;
const expectedAnalytics = z
  .enum(["on", "off"])
  .parse(Bun.env.EXPECT_ANALYTICS ?? (isProductionBuild && isGaConfigured ? "on" : "off"));

const PageViewConfigSchema = z.tuple([
  z.literal("config"),
  z.string(),
  z.object({ page_location: z.string(), content_group: z.string() }),
]);

describe("배포된 모니터링", () => {
  let pages: BuiltPage[] = [];
  let bootstrap = "";
  let articleCategory = "";

  beforeAll(async () => {
    pages = await loadPages();
    const article = pages.find(({ file }) => file.startsWith("post/"));
    bootstrap = queryAll(article?.html ?? "", "#yolog-ga").at(0)?.text ?? "";
    articleCategory = readMeta(article?.html ?? "", "article:section") ?? "사이트";
  });

  it("GA 태그 포함 여부는 빌드 환경의 기대값과 일치한다", () => {
    // Given
    const expectedCount = expectedAnalytics === "on" ? 1 : 0;

    for (const { file, html } of pages) {
      // When
      const count = queryAll(html, "#yolog-ga").length;

      // Then
      expect(count, `${file}: GA 태그 포함 여부가 다릅니다`).toBe(expectedCount);
    }
  });

  it("광고 태그는 운영 빌드에서 한 번 로드되고 미리보기에서는 제외된다", () => {
    // Given
    const expectedCount = isProductionBuild ? 1 : 0;

    for (const { file, html } of pages) {
      // When
      const count = queryAll(html, ADSENSE_LOADER_SELECTOR).length;

      // Then
      expect(count, `${file}: 광고 로더 개수가 다릅니다`).toBe(expectedCount);
    }
  });

  describe.skipIf(expectedAnalytics === "off")("GA 초기화 동작", () => {
    const productionHostname = new URL(SITE_URL).hostname;

    it("반복 초기화해도 로더와 페이지뷰 설정은 한 번만 생성된다", () => {
      // When
      const { scripts, configs } = runGaBootstrap(bootstrap, productionHostname, 2);

      // Then
      expect(scripts.length, "GA 로더가 중복되었습니다").toBe(1);
      expect(configs.length, "페이지뷰 설정이 중복되었습니다").toBe(1);
    });

    it("Google 태그는 공식 도메인에서 비동기로 로드된다", () => {
      // When
      const [loader] = runGaBootstrap(bootstrap, productionHostname).scripts;

      // Then
      expect(loader?.async, "GA 로더는 비동기여야 합니다").toBeTrue();
      expect(new URL(loader?.src ?? "").origin, "Google 태그 도메인이 다릅니다").toBe(
        "https://www.googletagmanager.com",
      );
    });

    it("페이지 주소는 유입 파라미터를 보존하고 개인 쿼리와 해시를 제외한다", () => {
      // When
      const [config] = runGaBootstrap(bootstrap, productionHostname).configs;
      const [, , options] = PageViewConfigSchema.parse(config);

      // Then
      expect(options.page_location, "GA 페이지 주소 정제가 올바르지 않습니다").toBe(
        `${SITE_URL}/post/example?utm_source=test`,
      );
    });

    it("글의 카테고리를 content_group으로 전달한다", () => {
      // When
      const [config] = runGaBootstrap(bootstrap, productionHostname).configs;
      const [, , options] = PageViewConfigSchema.parse(config);

      // Then
      expect(options.content_group, "GA와 글의 카테고리가 다릅니다").toBe(articleCategory);
    });

    it.each(["localhost", "yolog-preview.vercel.app"])(
      "%s에서는 분석을 수집하지 않는다",
      (hostname) => {
        // When
        const { scripts, configs } = runGaBootstrap(bootstrap, hostname);

        // Then
        expect(scripts.length, `${hostname}: GA 로더가 생성되었습니다`).toBe(0);
        expect(configs.length, `${hostname}: 페이지뷰가 설정되었습니다`).toBe(0);
      },
    );
  });
});

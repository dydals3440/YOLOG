import { describe, expect, it } from "bun:test";

import { getSamePageSectionId, isPlainNavigationClick } from "./post-navigation";

const CURRENT_URL = "https://www.yolog.co.kr/post/moyeo-product-operations?from=blogs#intro";

const PLAIN_CLICK = {
  button: 0,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  defaultPrevented: false,
};

describe("getSamePageSectionId", () => {
  it.each([
    ["#다시-쓰는-사용자를-찾아서", "다시-쓰는-사용자를-찾아서"],
    ["#%EA%B0%80%EA%B2%A9", "가격"],
    ["#user-content-fn-1", "user-content-fn-1"],
    ["#user-content-fnref-1", "user-content-fnref-1"],
    [CURRENT_URL, "intro"],
  ])("같은 글의 목차·각주 링크 %s를 요소 ID %s로 해석한다", (href, expected) => {
    expect(getSamePageSectionId(href, CURRENT_URL)).toBe(expected);
  });

  it.each([
    "/post/moyeo-frontend-architecture#마무리",
    "https://example.com/post/moyeo-product-operations?from=blogs#intro",
    "http://www.yolog.co.kr/post/moyeo-product-operations?from=blogs#intro",
    "?from=home#intro",
    "/post/moyeo-product-operations#intro",
    "mailto:support@moyeo.io",
  ])("다른 글·출처·검색 조건으로 가는 %s는 일반 탐색으로 남긴다", (href) => {
    expect(getSamePageSectionId(href, CURRENT_URL)).toBeNull();
  });

  it.each(["", "#", "#%E0%A4%A", "https://["])(
    "빈 해시나 잘못된 주소 %p는 가로채지 않는다",
    (href) => {
      expect(getSamePageSectionId(href, CURRENT_URL)).toBeNull();
    },
  );
});

describe("isPlainNavigationClick", () => {
  it("보조 키 없는 왼쪽 클릭은 처리한다", () => {
    expect(isPlainNavigationClick(PLAIN_CLICK)).toBeTrue();
  });

  it.each(["altKey", "ctrlKey", "metaKey", "shiftKey", "defaultPrevented"] as const)(
    "%s가 켜진 클릭은 새 탭·새 창·기존 핸들러를 존중해 처리하지 않는다",
    (key) => {
      expect(isPlainNavigationClick({ ...PLAIN_CLICK, [key]: true })).toBeFalse();
    },
  );

  it.each([1, 2])("%i번 버튼 클릭은 처리하지 않는다", (button) => {
    expect(isPlainNavigationClick({ ...PLAIN_CLICK, button })).toBeFalse();
  });
});

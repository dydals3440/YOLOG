import assert from "node:assert/strict";
import { it } from "node:test";
import { getSamePageSectionId, isPlainNavigationClick } from "../../src/lib/post-navigation.ts";

const current = "https://www.yolog.co.kr/post/moyeo-product-operations?from=blogs#intro";

it("같은 글의 한글 목차와 각주를 실제 요소 ID로 해석한다", () => {
  assert.equal(
    getSamePageSectionId("#다시-쓰는-사용자를-찾아서", current),
    "다시-쓰는-사용자를-찾아서",
  );
  assert.equal(getSamePageSectionId("#%EA%B0%80%EA%B2%A9", current), "가격");
  assert.equal(getSamePageSectionId("#user-content-fn-1", current), "user-content-fn-1");
  assert.equal(getSamePageSectionId("#user-content-fnref-1", current), "user-content-fnref-1");
  assert.equal(getSamePageSectionId(current, current), "intro");
});

it("다른 글·출처·검색 조건으로 가는 링크는 일반 탐색으로 남긴다", () => {
  for (const href of [
    "/post/moyeo-frontend-architecture#마무리",
    "https://example.com/post/moyeo-product-operations?from=blogs#intro",
    "http://www.yolog.co.kr/post/moyeo-product-operations?from=blogs#intro",
    "?from=home#intro",
    "/post/moyeo-product-operations#intro",
    "mailto:support@moyeo.io",
  ]) {
    assert.equal(getSamePageSectionId(href, current), null, href);
  }
});

it("빈 해시와 잘못된 인코딩·URL은 가로채지 않는다", () => {
  for (const href of ["", "#", "#%E0%A4%A", "https://["]) {
    assert.equal(getSamePageSectionId(href, current), null, href);
  }
});

const click = {
  button: 0,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  defaultPrevented: false,
};

it("일반 클릭과 Enter 활성화는 처리하되 새 탭·새 창·기존 핸들러를 존중한다", () => {
  assert.equal(isPlainNavigationClick(click), true);
  for (const key of ["altKey", "ctrlKey", "metaKey", "shiftKey", "defaultPrevented"]) {
    assert.equal(isPlainNavigationClick({ ...click, [key]: true }), false, key);
  }
  assert.equal(isPlainNavigationClick({ ...click, button: 1 }), false);
  assert.equal(isPlainNavigationClick({ ...click, button: 2 }), false);
});

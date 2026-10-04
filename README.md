# YOLOG

개발자 매튜의 기술 블로그. Astro + MDX, Node.js 24, Bun 1.4.2, Vercel로 운영합니다.

## 개발과 검증

```sh
bun install --frozen-lockfile
cp .env.example .env  # 새 환경에서만 실행. 기존 .env를 덮어쓰지 않는다.
bun run dev
bun run validate
```

`validate`는 lint/format, Astro/TypeScript, 정적 빌드, 생성된 SEO·분석 설정을 확인합니다.
`verify:site`는 Node 기본 테스트 러너로 `tests/site/seo.test.mjs`와
`tests/site/analytics.test.mjs`를 실행합니다. 파일 탐색은 Node의 glob,
HTML/XML 파싱은 Cheerio를 사용합니다. 실패 시 검사 항목과 파일 경로가 표시됩니다.
GitHub Actions가 PR과 main에서 실행하고, Vercel Preview 빌드의 분석 제외도 검증합니다.
`verify:site`는 빌드 후 실행하며 canonical, OG, JSON-LD, 전체 사이트맵, RSS,
광고 스크립트 중복, GA 초기화 중복, 로컬 호스트 제외를 확인합니다.
GA 검증에는 실제 운영 데이터를 전송하지 않습니다.
로컬 검증은 `.env`를 읽고, CI의 `EXPECT_ANALYTICS`는 기대하는 태그 포함 여부를 명시합니다.
실제 결과에서 기대값을 추측하지 않으므로 태그가 실수로 빠져도 검사가 실패합니다.
의존성 보안 점검은 `bun audit`로 실행합니다. 배포는 Vercel의 Git 연동을 사용하며,
사용하지 않는 Vercel CLI 패키지는 설치하지 않습니다(`@astrojs/vercel` 어댑터는 유지).

## 글 작성

`src/content/post/blog/<slug>.mdx`에 작성합니다. 파일명을 바꾸면 URL이 바뀌므로
기존 글의 slug는 유지하세요. 주소는 `https://www.yolog.co.kr/post/<slug>`입니다.

```yaml
---
title: HTTP Keep-Alive와 커넥션 풀은 어떻게 연결될까?
description: HTTP 연결 재사용과 커넥션 풀의 차이를 설명하고, 실제 서버에서 연결이 유지되는 조건과 운영 중 확인할 지표를 정리합니다.
date: 2026-10-04
category: HTTP
tags: [HTTP, Keep-Alive, 커넥션 풀]
image: /images/http-keep-alive/thumbnail.webp
draft: true
---
```

- `draft: true`인 글은 글 페이지·목록·관련 글·RSS·사이트맵·llms.txt에서 제외됩니다.
  `*.draft.mdx` 파일은 아예 로딩하지 않고 Git에서도 제외합니다.
- 공개할 때 `draft: false`로 바꾸고 `bun run validate`를 실행합니다.
- description은 검색 의도와 글이 답하는 문제를 자연스러운 1~2문장으로 직접 작성하세요.
  없으면 본문에서 코드·제목·마크다운을 제거한 설명을 자동 생성합니다.
- 내용을 실질적으로 수정할 때만 `updatedDate`를 변경합니다. 독자에게 수정일도 표시합니다.
- category는 DEVELOPMENT / HTTP / DESIGN_PATTERN / REVIEW / STORY 중 하나입니다.
- 검색어는 제목과 첫 문단, 소제목에 자연스럽게 씁니다. meta keywords와 태그 나열만으로
  검색 순위가 올라가지는 않습니다. 본문에 관련 글의 내부 링크와 정확한 이미지 설명을 추가하세요.

## GA4

GA 관리 화면에서 블로그 웹 스트림의 측정 ID를 확인한 뒤 Vercel **Production** 환경에만
`PUBLIC_GA_ID`를 설정하세요. 로컬 `.env`는 Git에서 제외합니다.
측정 ID는 브라우저에 전달되는 공개 식별자이며 비밀 키가 아닙니다.
API secret·서비스 계정 키·접근 토큰에는 `PUBLIC_` 접두사를 사용하지 말고
Vercel 서버 환경 변수나 GitHub Actions Secrets에 보관합니다.
CI는 실제 GA 속성과 무관한 테스트용 측정 ID를 사용합니다.

`Monitoring.astro`가 Google 태그를 한 번 초기화합니다. 문서 이동은 기본
`page_view`를 사용하며 수동 page_view 이벤트를 추가하지 않습니다.
Vercel Preview/Development 빌드에는 GA·광고·Vercel 모니터링을 넣지 않고,
GA는 실제 `www.yolog.co.kr` 호스트에서만 로드합니다. 빈 값·예시 ID도 제외합니다.
UTM/광고 유입 파라미터는 보존하고 임의 쿼리와 hash는 page_location에서 제거합니다.

| 데이터 | 용도 |
| --- | --- |
| `page_view` + 페이지 경로/제목 | 많이 읽는 글 |
| `content_group` (기본 Content group 차원) | 개발/HTTP/디자인 패턴/회고 등 카테고리 비교 |
| `scroll` (향상된 측정) | 페이지 90% 도달. 정독 완료를 의미하지는 않음 |
| `click`, `file_download`, 영상 이벤트 | 외부 링크·자료·YouTube 참여 |
| `share` + `method`, `content_type`, `item_id` | SNS 공유창 실행 / 성공한 링크 복사 / 성공한 네이티브 공유 |

GA Reports snapshot은 User behavior 템플릿으로 설정합니다.
이벤트 보관 기간은 14개월로 설정해 장기 탐색 분석에 사용합니다(설정 반영까지 24시간).

GA 관리자 → Data streams → yolog → Enhanced measurement:
Page loads, Scrolls, Outbound clicks, Video engagement, File downloads를 켭니다.
현재 사이트에는 검색·입력 폼이 없으므로 Site search와 Form interactions는 끕니다.
일반 문서 탐색만 사용하므로 history 기반 page_view도 끕니다.
향후 Astro ClientRouter를 도입하면 페이지뷰 측정 방식을 다시 점검하세요.

Search Console의 블로그 도메인 속성은 이미 GA 스트림에 연결되어 있습니다.
GA Reports의 Search Console 보고서에서 실제 검색어와 유입 페이지를 확인합니다.
Search Console 검색어는 방문자 개별 이벤트와 연결되지 않으며 보고에 지연이 있습니다.

## 검색 노출과 운영 루틴

대표 주소는 `https://www.yolog.co.kr`이며 마지막 `/`는 홈에만 사용합니다.
Astro, Vercel, canonical, OG, JSON-LD, 공유 링크, RSS, 사이트맵이 같은 규칙을 사용합니다.
404는 `noindex`, 공개 글은 큰 이미지 미리보기를 허용합니다.

- [Search Console](https://search.google.com/search-console?resource_id=sc-domain%3Ayolog.co.kr)
- [GA4](https://analytics.google.com/)
- [사이트맵](https://www.yolog.co.kr/sitemap-index.xml), [RSS](https://www.yolog.co.kr/rss.xml)
- 공식 `@astrojs/sitemap`이 실제 정적 경로에서 `/sitemap-index.xml`과 `/sitemap-0.xml`을 생성합니다.
  기존 `/sitemap.xml`은 index로 영구 리디렉션합니다. 글의 lastmod는 생성된 수정일 메타데이터를 재사용합니다.

**발행할 때:** validate → PR 검증 → main 병합/배포 → 글 주소/이미지 확인.
새 글은 Search Console URL 검사에서 필요할 때 색인 생성을 요청합니다.
일반 글 URL을 Sitemaps에 제출하지 않습니다.

**주 1회, 10분:** Search Console 실적에서 최근 28일을 이전 28일과 비교합니다.
노출은 높고 CTR은 낮은 글은 제목/설명을 점검하고, 검색어가 늘어난 글은 본문을 보완합니다.
GA에서는 Organic Search 유입, 인기 글, 참여 시간, 카테고리와 공유 이벤트를 확인합니다.
성과를 비교할 때 코드 변경 전후의 수집 방식 차이도 고려하세요.

**월 1회:** 색인 제외 사유, 오래된 글의 정확성, 내부 링크, 깨진 이미지, 코어 웹 바이탈을 확인합니다.
canonical 대체 페이지와 정상 리디렉션은 반드시 오류인 것은 아닙니다.

2026-10-04 점검: sitemap.xml과 RSS는 제출 성공 상태입니다. Search Console에는
일반 글 URL 등을 사이트맵으로 잘못 제출한 과거 항목도 남아 있습니다.
이 항목은 사이트맵 관리 목록에서만 정리할 대상이며, 검색 URL 삭제 도구를 쓰는 대상이 아닙니다.
404 보고서에는 과거 `/post/mcp-dev-workflow/` 주소 1개가 있습니다. 삭제된 글이면 정상적인 404이며,
동일한 내용의 새 주소가 있을 때만 그 주소로 리디렉션합니다. 관련 없는 글로 보내지 않습니다.
실제 콘텐츠 색인과 순위는 Google의 판단과 재수집에 따라 달라집니다.

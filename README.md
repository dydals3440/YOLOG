# YOLOG

개발자 매튜의 기술 블로그예요. Astro 7 정적 사이트로 만들고 Vercel(Hobby)에 배포해요.

## 시작하기

```sh
bun ci                    # bun.lock 그대로 설치
[ -f .env ] || cp .env.example .env   # 이미 있는 .env는 덮어쓰지 않아요.
bun run dev
```

| 스크립트 | 하는 일 |
| --- | --- |
| `bun run dev` / `build` / `preview` | Astro 개발 서버, 정적 빌드, 빌드 결과 미리보기 |
| `bun run check` | `astro check`(생성 타입 포함) → oxlint(타입 기반) → oxfmt → `bun check` → knip(미사용 파일·export·의존성) |
| `bun run fix` | 린트 자동 수정과 포맷 |
| `bun run test` | `src/**/*.test.ts` 단위 테스트(`bun test`) |
| `bun run test:site` | 빌드 결과(`dist`)의 SEO·GEO·링크·이미지·분석 태그 검사 |
| `bun run lighthouse` | `dist`로 Lighthouse CI 실행(CLS·접근성·SEO는 실패, LCP·성능은 경고) |
| `bun run validate` | `check` → `test` → `build` → `test:site` |

Node 24와 Bun 1.4.4를 써요(`package.json`의 `engines`·`packageManager`). `bunfig.toml`의
`minimumReleaseAge`로 배포된 지 3일이 지나지 않은 패키지는 설치하지 않아요.

## 구조

```text
src/
  constants/site.ts            사이트 URL·작성자·연락처
  domains/                     기능별 모델과 비즈니스 규칙(순수 함수 + Policy)
    post.model.ts              PostSchema, filterBy*/orderBy*, calculate*, PostPolicy
    category.model.ts          CategorySchema, CATEGORY_LABEL
  apis/posts.ts                글 조회(getPosts·getPost·renderPost). 저장소를 바꾸는 유일한 지점
  apis/__fixtures__/           테스트 픽스처(createPost)
  utils/                       도메인과 무관한 순수 함수(date, pagination, routes, markdown, structured-data …)
  stores/theme.ts              테마 상태(nanostores)
  components/site/             헤더·푸터·SEO·분석·페이지네이션 등 사이트 공통 UI
  components/post/             글 목록·글 화면 UI
  components/mdx/              글 안의 인터랙션(React 섬)
  layouts/BaseLayout.astro     html 골격
  pages/                       화면 조립(위에서 아래로 읽히게)과 RSS·llms·robots 엔드포인트
  content/posts/<slug>/        글(index.mdx)과 그 글의 이미지
tests/site/                    빌드 결과 검사
```

- 모델은 서버 응답과 분리된 클라이언트 모델이에요. 컴포넌트는 `CollectionEntry`가 아니라 `Post`만 알아요.
- 글을 서버·CMS로 옮기면 `src/content.config.ts`의 `glob()` loader를 객체 loader로 바꾸고, `apis/posts.ts`만 손봐요.
  CMS 웹훅으로 다시 빌드하는 방식이 무료 플랜에 가장 잘 맞아요. 요청 시 렌더링이 필요해지면
  `@astrojs/vercel` 어댑터와 Astro route caching(`cache` + `routeRules`)을 함께 검토해요.
- 공통 UI는 서버 렌더링 HTML과 작은 `<script>`로 만들어요. React는 인터랙션이 있는 글에서만 로드돼요.

## 글 작성

`src/content/posts/<slug>/index.mdx`에 쓰고 이미지는 같은 폴더에 둬요. 폴더 이름이 곧 주소(`/post/<slug>`)라서
공개한 글의 폴더 이름은 바꾸지 않아요. 문체와 마크다운 규칙은 `CLAUDE.md`를 따라요.

```yaml
---
title: HTTP Keep-Alive와 커넥션 풀은 어떻게 연결될까?
description: HTTP 연결 재사용과 커넥션 풀의 차이를 설명하고, 실제 서버에서 연결이 유지되는 조건과 운영 중 확인할 지표를 정리합니다.
date: 2026-10-04
category: HTTP
tags: [HTTP, Keep-Alive, 커넥션 풀]
image: ./thumbnail.webp
draft: true
---
```

- `draft: true`인 글은 모든 페이지·RSS·사이트맵·llms.txt에서 빠져요. `index.draft.mdx` 같은 파일은 아예 읽지 않아요.
- `description`이 없으면 `PostPolicy.summary`가 본문 문단으로 160자 요약을 만들어요.
- 내용을 실질적으로 고칠 때만 `updatedDate`를 바꿔요. 독자에게 수정일로 보여요.
- category는 DEVELOPMENT / REVIEW / HTTP / STORY / DESIGN_PATTERN 중 하나예요.
- 이미지는 빌드할 때 Astro가 크기를 읽고 `srcset`을 만들어요. 따로 압축하지 않아도 돼요.

## 배포와 무료 플랜

Vercel Git 연동으로 `main`은 운영, PR은 미리보기로 배포해요. 설정은 `vercel.json`에 있어요.

- 이미지 최적화는 빌드 시점 sharp라 Vercel Image Optimization 사용량이 없어요. 결과는 `node_modules/.astro`에 캐시돼요.
- Speed Insights는 `sampleRate` 0.5로 Hobby 한도(30일 10,000 이벤트) 안에서 수집해요.
- Dependabot 브랜치는 미리보기 배포를 만들지 않아요.
- Hobby는 비상업 개인용이에요. AdSense를 유지하는 동안 약관 해석은 Vercel 지원팀에 확인이 필요해요.

## CI

변경 하나에 검증과 배포가 한 번씩만 돌게 짰어요.

| 시점 | GitHub Actions | Vercel |
| --- | --- | --- |
| PR | `ci.yml`: `bun ci` → `bun audit` → `check` → `test` → `build` → `test:site` → Lighthouse(URL 3개 × 1회) | 미리보기 1번 |
| 스택 PR | 아래층 변경이 모두 들어 있는 **맨 위 PR에서만** 검증 | 맨 위 브랜치만 미리보기 |
| `main` 머지 | 없음(PR에서 검증한 트리가 그대로 머지돼요) | 운영 배포 1번 → 성공하면 IndexNow |
| 문서만 변경(`*.md`, 이슈 템플릿, `dependabot.yml`) | CI 건너뜀 | 빌드 건너뜀 |
| 워크플로만 변경(`.github/workflows`) | CI + zizmor | 빌드 건너뜀 |

Vercel 쪽 판단은 `vercel.json`의 `ignoreCommand` 한 줄이 해요. 마지막 성공 배포 이후 사이트에 영향 없는 파일(`*.md`, `.github`)만 바뀌었으면
운영·미리보기 모두 건너뛰고, 그 밖의 운영 배포는 항상 빌드해요. 미리보기는 이 브랜치를 base로 하는 열린 PR이 있으면
(스택 아래층) 건너뛰어요. GitHub API 호출이 실패하면 빌드해요.
IndexNow 워크플로는 배포 상태 이벤트마다 실행 기록이 생기지만, 운영 배포 성공이 아니면 잡을 건너뛰어 Actions 시간을 쓰지 않아요.

액션은 모두 커밋 SHA로 고정하고, Dependabot이 주 1회 배포된 지 7일 지난 버전으로 올려요(미리보기 배포 없음).
저장소 설정에서 "Require actions to be pinned to a full-length commit SHA"를 켜 두면 고정을 강제할 수 있어요.

## GA4

GA 관리 화면에서 블로그 웹 스트림의 측정 ID를 확인한 뒤 Vercel **Production** 환경에만
`PUBLIC_GA_ID`를 설정하세요. 로컬 `.env`는 Git에서 제외합니다.
측정 ID는 브라우저에 전달되는 공개 식별자이며 비밀 키가 아닙니다.
API secret·서비스 계정 키·접근 토큰에는 `PUBLIC_` 접두사를 사용하지 말고
Vercel 서버 환경 변수나 GitHub Actions Secrets에 보관합니다.
CI는 실제 GA 속성과 무관한 테스트용 측정 ID를 사용합니다.

`src/components/site/Analytics.astro`가 Google 태그를 한 번 초기화합니다. 문서 이동은 기본
`page_view`를 사용하며 수동 page_view 이벤트를 추가하지 않습니다.
Vercel Preview/Development 빌드에는 GA·광고·Vercel 모니터링을 넣지 않고(`astro:env`의 `VERCEL_ENV`),
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
- 목록 페이지네이션 주소는 `/blogs/2`, `/blogs/http/2` 형식입니다. 이전 `/blogs/page/2` 형식은 `vercel.json`에서 301로 연결합니다.
- LLM·AI 검색용으로 [`/llms.txt`](https://www.yolog.co.kr/llms.txt), [`/llms-full.txt`](https://www.yolog.co.kr/llms-full.txt),
  글마다 `/post/<slug>.md` 마크다운 미러를 만듭니다. `robots.txt`는 주요 AI 크롤러를 허용합니다.
  마크다운 미러와 `llms-full.txt`는 HTML 글과 내용이 같아 `vercel.json`에서 `X-Robots-Tag: noindex`를 붙여 검색 색인에서 뺍니다.
- 운영 배포가 끝나면 `.github/workflows/indexnow.yml`이 오늘 바뀐 글을 IndexNow(Bing·Naver 등)에 알립니다.

**발행할 때:** validate → PR 검증 → main 병합/배포 → 글 주소/이미지 확인.
새 글은 Search Console URL 검사에서 필요할 때 색인 생성을 요청합니다.
일반 글 URL을 Sitemaps에 제출하지 않습니다.

**주 1회, 10분:** Search Console 실적에서 최근 28일을 이전 28일과 비교합니다.
노출은 높고 CTR은 낮은 글은 제목/설명을 점검하고, 검색어가 늘어난 글은 본문을 보완합니다.
GA에서는 Organic Search 유입, 인기 글, 참여 시간, 카테고리와 공유 이벤트를 확인합니다.
성과를 비교할 때 코드 변경 전후의 수집 방식 차이도 고려하세요.

**월 1회:** 색인 제외 사유, 오래된 글의 정확성, 내부 링크, 깨진 이미지, 코어 웹 바이탈을 확인합니다.
canonical 대체 페이지와 정상 리디렉션은 반드시 오류인 것은 아닙니다.

2026-11-14 점검: Search Console에 제출한 사이트맵은 `sitemap-index.xml`과 `rss.xml` 두 개뿐입니다.
예전에 잘못 제출한 글 주소·`robots.txt`·옛 `sitemap.xml`·Tistory 시절 항목 16개는 사이트맵 관리 목록에서 지웠습니다
(검색 결과 삭제가 아니라 제출 기록만 지운 것입니다). robots.txt는 배포 직후 새 파일을 가져갔습니다.
목록 주소 변경(`/blogs/page/2` → `/blogs/2`)은 301로 연결했고, 예전 이미지 주소(`/images/...`)는 404입니다.
이미지 주소는 페이지를 다시 수집하면서 `/_astro/...`로 바뀝니다.
404 보고서의 과거 `/post/mcp-dev-workflow/`처럼 삭제된 글은 정상적인 404이며, 같은 내용의 새 주소가 있을 때만
그 주소로 리디렉션합니다. 관련 없는 글로 보내지 않습니다.

네이버 서치어드바이저는 호스트마다 사이트를 따로 등록합니다. 대표 주소 `https://www.yolog.co.kr` 사이트(HTML 파일 확인)에
`sitemap-index.xml`과 `rss.xml`을 제출했습니다. www 없는 사이트는 모든 주소가 www로 308 리디렉션되어 제출할 수 없습니다.
GA4 향상된 측정은 페이지뷰(history 기반 제외)·스크롤·외부 링크·영상·파일 다운로드만 켭니다.

광고 차단기(예: macOS Unicorn)가 켜진 기기에서는 GA 스크립트가 빈 파일로 바뀌어 GA4 실시간 보고서에 잡히지 않습니다.
수집 확인은 차단기가 없는 기기(휴대폰 등)에서 합니다.

# 구현 대조와 기술 검토

2026-10-11 최종 본문 기준. 제품 저장소 `/Users/matthew/workspace/products/moyeo`는 읽기만 했다. Before/After는 대안 비교이며 실제 리팩터링 이력을 주장하지 않는다.

## 확인 기준

설치된 React 19.3.0, TanStack Start 1.168.57, Router 1.170.38, Query 5.103.2, Zod 4.6.5, oRPC 2.0.0-beta.39를 기준으로 코드와 타입을 대조했다. oRPC는 beta이므로 전체가 최신 stable이라는 표현은 쓰지 않는다. 버전 표는 본문에 넣지 않았다.

API 대안 비교는 2026-10-11 npm 배포 태그와 공식 문서를 대조했다. oRPC 정식판은 1.15.5, tRPC는 11.19.0, Orval은 8.41.0이다. `@trpc/openapi`의 latest 태그는 11.19.0-alpha이므로 정식판 기능으로 표시하지 않았다. 사용자가 선택한 대로 예제에는 실제 모여의 oRPC 2 beta 문법을 유지하고 첫 계약 예제의 각주에서 구분했다. oRPC v1의 OpenAPI·SSE 문서에서도 비교에 사용한 기능을 확인했다.

## 실제 코드와 설명용 인터페이스

- **게시물 페이지:** 실제 두 보기와 검색·상태 조건을 바탕으로 화면 순서가 보이게 펼쳤다. `filters/pageSize`를 받는 PostList는 설명용 재구성이다. 실제 PostList는 라우트에서 조건을 직접 읽는다.
- **상세 화면:** 현재 제품의 `PostArticle`은 `postDetailRouteApi.useParams()`에서 필수 게시물 ID를 읽고 `postQueryOptions`로 조회한다. 조회된 게시물을 Props로 받아 표시하는 설명용 PostInfoCard와 구분한다. 제품 컴포넌트의 실제 이름은 바꾸지 않았다.
- **스타일 추상화 예제:** `post-info-card.tsx`의 PostInfoCard는 설명용 구성이다. 공유 응답 PostRecord가 null이면 Empty를 먼저 반환하고, 값이 있으면 Content로 전달한다. 각 상태는 Card·CardContent로 표시한다. 지역 컴포넌트 PostInfoRow·Message에 반복 스타일을 둔다. PostStatusBadge에는 실제 인터페이스대로 post를 전달한다. 이 예제는 조회를 구현한 제품의 PostArticle과 구분한다.
- **입력:** 실제 AmountInput의 숫자 표시·빈 값·12자리 제한을 바탕으로 한다. 제품은 optional onChange를 제공하지만 본문의 편집용 인터페이스는 변경 함수를 필수로 받는다. 원본 InputGroupInput Props를 Omit하고 spread를 먼저 적어 제어하는 값이 덮이지 않게 했다. 0과 빈 입력을 구분한다.
- **URL 상태:** 보기/검색 조건의 Zod 검증, 이전 search를 보존하는 부분 변경, URL과 로컬 저장소에 공통인 튜플 인터페이스를 보여 준다. 저장소 변경이 링크 공유·SSR·loader 정책까지 자동으로 해결한다는 주장은 하지 않는다.
- **무한 조회:** 실제 `PostList`의 `selectPosts`를 사용한다. 공유 응답 타입 이름은 `PostList`이며 import에서 `PostListOutput`으로 별칭을 붙인다. 캐시의 pages/pageParams를 유지하고 구독자가 게시물 배열을 읽는다. 검색은 서버로 보낸다.
- **사전 조회:** 현재 설치된 QueryClient의 `infiniteQuery`와 제품의 `postListInfiniteOptions`에 연결했다. loader와 화면에 같은 조건을 전달한다. loader의 오류와 화면 안의 오류 경계는 구분한다.
- **계약:** `packages/api`의 Zod 공개 응답을 oRPC input/output과 연결한다. 계약은 타입 오류로 영향 범위를 찾게 하며 화면까지 자동으로 고치지는 않는다. 외부 SNS adapter 예제는 삭제한 상태를 유지한다.
- **API 선택:** REST+OpenAPI+Orval도 타입·API 호출 함수·Query 훅과 옵션을 생성한다. Zod·MCP 출력도 지원하지만 본문의 설정은 react-query와 fetch만 사용한다. tRPC도 SSE와 외부 HTTP 호출을 지원하며 공식 OpenAPI 패키지는 alpha다. 모여가 공유 계약으로 내부 웹의 타입과 HTTP 경로·명세를 함께 관리하려 했다는 판단을 적었다. 실제 웹의 OpenAPILink, 서버의 OpenAPIGenerator, 공유 스트림 스키마를 대조했다. MCP는 미구현 확장 목표이며 oRPC 핵심의 자동 변환 기능으로 소개하지 않는다.
- **SSE 타입:** `notificationStreamEventSchema`와 `watchNotificationsInputSchema`를 가져와 asyncIteratorObject 출력에 연결한다. 구독 예제는 publishing_changed를 확인한 뒤 주입한 onPostsChanged에 이벤트 전체를 넘긴다. 공유 타입 WorkspaceChangedEvent의 workspaceId·postIds·truncated를 보존하며 캐시 갱신 구현은 생략한다. 신호 종류를 확인하기 전의 postIds 접근과 필드 오타는 타입 오류로 검사한다. engagement_changed에도 postIds가 있으므로 다른 모든 이벤트에 이 필드가 없다고 설명하지 않는다. 재연결·유실 방지를 타입으로 해결한다는 주장은 하지 않는다.
- **정책:** publishing/retry_wait/unconfirmed 및 예약까지 2분 미만이라는 실제 복구 조회 규칙을 `publication.model.ts` 예제의 순수 함수와 PublicationPolicy로 재구성했다. 함수는 `@moyeo/api`의 PublicationListItem을 그대로 받고, 별도의 응답 타입은 정의하지 않는다. 이미 지난 scheduled도 대상이다. SSE의 보완 조회임을 명시한다. 테스트 예제는 실제 `@moyeo/api/testing`의 createPublicationListItemFixture를 사용하며, 모델·Policy·테스트의 타입을 모여의 공유 패키지로 검사했다.
- **분석:** 실제 제품의 이벤트 중 하나만 보여 준다. Zod 정의에서 타입을 얻고 전송 전 검사하며 provider를 주입한다. 축약한 try/catch는 동기 오류를 처리한다. 비동기 provider의 오류 처리는 별도 책임임을 남겼다.
- **업로드·편집·시간대·SSE:** 실제 동작을 바탕으로 필요한 부분만 간추렸다. 기존에 기록된 측정값을 인용하며 이번 편집에서 다시 측정했다고 쓰지 않는다.

## 검증

- API 절 재작성 후 계약·조회 컴포넌트·SSE 계약과 소비자·Policy·테스트의 6개 예제를 실제 모여 타입으로 확인했다. 예제 진단은 0개이며 Router 등을 통해 포함된 제품 의존 파일의 기존 진단 11개는 별도다. 이벤트 분기 전 postIds 접근은 TS2339, 분기 후 postIdz 오타는 TS2551로 거부되는 것을 확인했다. 검사 스크립트는 `/tmp/check-moyeo-api-section.cjs`이고 제품 파일은 변경하지 않았다.

- API 비교 보강 후 게시물 계약·SSE 계약·소비자 예제를 실제 모여 타입으로 검사했다. 예제와 의존 파일 진단 모두 0개. 이벤트 종류를 확인하기 전 postIds 접근과 postIdz 오타는 각각 타입 오류를 발생시켰다.
- 본문의 Orval 설정을 임시 디렉터리에서 Orval 8.41.0으로 실행해 게시물 조회 명세에서 fetch 요청 함수와 React Query 훅·옵션이 생성되는 것을 확인했다. 생성된 클라이언트도 모여의 React Query 타입과 연결해 진단 0개를 확인했다. 설치 환경에 따른 자동 감지 차이를 피하려고 예제에 `override.query.version: 5`를 명시했다. 제품·블로그 의존성은 변경하지 않았다.

- 탭 분기 비교는 의도적으로 `scheduled` 처리를 빠뜨린 예제다. `switch`의 default는 타입 검사를 통과하지만, `match().exhaustive()`는 `NonExhaustiveError<"scheduled">`로 호출 오류를 낸다. 같은 예제에 scheduled 분기를 추가하면 오류가 사라지는 것을 설치된 ts-pattern과 TypeScript로 확인했다. (`/tmp/check-moyeo-exhaustive.cjs`)

- 본문에서 추출한 핵심 예제 22개를 제품의 tsconfig·API·UI·Router 등록 타입과 연결한 가상 TypeScript 파일로 검사했다. **예제 자체 진단 0개.** 제품 저장소에 검사 파일을 쓰지 않았다.
- Router Link의 정상 예제와 잘못된 경로·누락된 params·허용하지 않은 search를 대조했다. 정상 진단 0개, 부정 사례 3개 확인.
- 같은 타입 검사에서 제품의 기존 의존 파일 진단 11개가 남는다. 폼 resolver, Promise.withResolvers, Cloudflare 환경 타입 등이며 본문 진단과 분리했다. 제품 전체 typecheck가 통과했다는 의미는 아니다.
- 저장소 unit test는 본문의 함수/조회 조건을 직접 추출해 금액 null/0, URL 검증·부분 변경·loader와 화면의 조건 일치, select의 순서·원본 보존, 정책 경계값, 분석 검증·provider 교체·오류 격리, 편집 보호, DST 시각과 도식 좌표를 확인한다.
- 설치된 Query의 선택 함수 참조 재사용과 원본 캐시 보존은 이전 대조에서도 확인했다. 공식 문서는 본문의 select 각주에 남겼다.

로컬 대조 스크립트: `/private/tmp/check-moyeo-rewrite.cjs`, `/private/tmp/check-moyeo-route-link.cjs`. 재사용할 행동 검사는 `tests/unit/moyeo-frontend.test.mjs`에 있다.

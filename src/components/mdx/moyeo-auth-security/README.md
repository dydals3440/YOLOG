# 모여 인증 글의 도식과 근거

본문은 `src/content/post/blog/did-i-secure-my-service.mdx`에 있다. 기존 콘텐츠 컬렉션과 `src/pages/post/[...slug].astro`를 사용하므로 주소는 `/post/did-i-secure-my-service`다. `blog/`는 콘텐츠 분류이며 URL에는 포함하지 않는다.

다른 발행 글과 동일하게 frontmatter에서 초안 설정을 생략했다. 공통 컬렉션을 통해 글 목록, 상세 페이지, RSS, 사이트맵, llms.txt에 포함된다. 별도의 미리보기 페이지나 개발 환경 전용 경로는 사용하지 않는다.

## 구성

| 도식 | 보여 주는 과정 |
| --- | --- |
| login | 첫 비밀번호 확인 → 세션 생성 → 쿠키 저장 → 다음 요청의 세션 조회 |
| cookie | 브라우저 → TanStack Start → NestJS 요청과 반대 방향의 Set-Cookie 응답 |
| ssr | 페이지 요청의 Cookie → 서버 API 요청에 전달 → 사용자 데이터 → SSR HTML |
| devices | 활성 5개 → 최근 사용 기록 갱신 → 여섯 번째 로그인 → 오래된 세션 교체 |
| recovery | 운영자 로그아웃 → DB 세션 종료 → 남은 쿠키로 요청 → 인증 거부 |
| scale | 공유 DB 세션과 별도 철회 조회가 없는 JWT의 다음 요청 비교 |
| hash | Argon2id 64MiB × 실제 동시 실행 수의 메모리 예산 |

두 정적 SVG는 브라우저·API의 요청 검증과 Cloudflare·NestJS·비공개 DB의 경계를 보여 준다. 그림은 설명용 모델이며 실제 모여 API를 호출하지 않는다. 해싱 그림의 칸 수는 실행 한도나 실측 RSS가 아니다.

Canvas는 그림의 절반 이상이 화면에 들어오면 한 번 자동 재생하고 마지막 단계에서 멈춘다. 각 단계는 2.4초다. 화면 밖이나 숨겨진 탭에서는 진행을 멈추고, 사용자가 누른 일시정지를 유지한다. 이전·다음·다시 보기를 지원한다. 테마와 화면 폭을 반영하며 픽셀 배율은 최대 2다. 움직임 줄이기 설정에서는 자동 재생 없이 단계 버튼을 사용한다. JavaScript 실행 전에도 마지막 단계의 정적 SVG와 전체 과정의 텍스트를 읽을 수 있다. 전체 과정의 목록에서는 단계 제목의 번호를 제거해 목록 번호와 겹치지 않게 한다.

본문은 로그인 이후 요청 순서에 맞춰 구성했다. 주요 코드 6개는 짧게 유지하고 세부 구현은 접힌 설명 9개로 옮겼다. HTTP·보안 개념은 기존 블로그 글로 연결했다. 괄호가 있는 용어에 Markdown 강조를 사용하지 않고 Opaque Token과 Digest는 개발자에게 익숙한 영어 표기를 쓴다.

접힌 설명도 문제·처리·이유 순서로 읽히도록 소제목을 나눴다. 쿠키 속성과 소셜 로그인 검사는 표로 비교하며, 소셜 로그인은 세션 생성 설명에 함께 둔다. 경쟁 조건·트랜잭션·JWT 서명과 갱신·salt·요청 제한의 집계 범위는 구체적인 상황부터 설명한다. 숫자·정책·구현의 한계와 예시 코드의 생략 범위는 유지한다.

쿠키 중계의 접힌 설명에는 별도의 Set-Cookie 헤더 두 개와 쉼표로 합친 뒤 나눠 날짜가 잘리는 반례를 함께 넣었다. 올바른 처리는 앞의 getSetCookie·append 코드로 연결한다. 사용자별 SSR 클라이언트·캐시 생성과 최근 사용 시각의 최소 15분 갱신 조건에도 짧은 재구성 예시를 넣었다. 갱신은 요청이 들어왔을 때 판단하며 예약 작업이나 인증 검사 생략으로 설명하지 않는다.

인라인 코드는 실제 헤더·속성·함수·변수·클래스 이름과 설정값에 사용한다. 일반 개념과 프레임워크 이름은 보통 글자로 쓰고, 굵은 글씨는 핵심 설계 결정과 결론에만 사용한다. 강조 범위에는 괄호를 넣지 않는다. 본문은 제목으로 구분하며 수평선을 추가하지 않는다. 단독 `---`는 frontmatter의 시작과 끝에만 사용하고, 표의 구분 행은 표 문법으로 유지한다. 코드 블록 제목과 캡션은 일반 텍스트로 작성한다.

## 구현 근거

2026년 10월 4일 `/Users/matthew/workspace/products/moyeo`의 코드를 읽어 확인했다. 아래 경로는 해당 프로젝트를 기준으로 한다.

- 토큰: `apps/server/src/shared/infrastructure/adapters/versioned-hmac-opaque-token.adapter.ts`
- 쿠키: `apps/server/src/modules/identity/presentation/adapters/session-cookie.adapter.ts`
- 기기 제한·시간: `apps/server/src/modules/identity/domain/policies/session-limit.policy.ts`, `session-touch.policy.ts`, `session-expiration.policy.ts`
- 세션 생성·동시성: `apps/server/src/modules/identity/infrastructure/persistence/session/drizzle-session-creation.transaction.impl.ts` 및 기존 통합 테스트
- 세션 인증: `apps/server/src/modules/identity/application/use-cases/session/authenticate-session.use-case.ts`
- 새 기기 안내: `apps/server/src/modules/identity/domain/policies/new-device-sign-in-notice.policy.ts` 및 세션 생성·알림 전달 구현
- 사용자 철회: `apps/server/src/modules/identity/application/use-cases/session/revoke-other-sessions.use-case.ts`와 `infrastructure/persistence/session/drizzle-session-revocation.transaction.impl.ts`
- 비밀번호 변경·재설정: `apps/server/src/modules/identity/infrastructure/persistence/password/`의 두 트랜잭션 구현
- 운영자 권한: `apps/server/src/modules/identity/application/use-cases/operations/manage-operations-user.use-case.ts`와 해당 조치 트랜잭션
- 해싱: `apps/server/src/modules/identity/infrastructure/adapters/password/bun-argon2id-password-hasher.adapter.ts`
- 인증 요청 제한: `apps/server/src/modules/identity/application/use-cases/security/consume-identity-rate-limit.use-case.ts`와 `infrastructure/persistence/security/drizzle-identity-rate-limit.repository.impl.ts`
- CORS·요청 검증: 서버 부트스트랩과 `apps/server/src/platform/orpc/request-security.interceptor.ts`
- 브라우저·SSR: `apps/web/src/api/browser-api-client.ts`, `request-scoped-server-api-client.ts`와 동시 요청 격리 테스트
- 프록시: `apps/web/src/routes/api/$/route.ts`, `apps/web/src/server/runtime/api-origin-request.ts`, `api-origin-response.ts`
- 배포 경로: 웹의 Worker 설정과 `infra/terraform/production/`의 네트워크·컴퓨트·DB 설정

여섯 번째 로그인은 거부되지 않는다. 새 세션을 생성하고 기록된 `lastSeenAt`이 가장 오래된 기존 세션을 철회한다. 동일 시각은 `issuedAt`, ID 순서로 비교한다. 최근 인증의 15분과 touch 간격의 15분은 다른 정책이다.

## 운영 설정 확인 범위

Cloudflare MCP의 읽기 조회로 HTTPS·TLS·Tunnel·DDoS·Access·Bot Fight Mode·WAF 배포 여부를 확인했다. 규칙 목록의 존재를 활성화로 해석하지 않았다. 개발 환경 Access와 운영 관리자 인증은 구분했다.

AWS MCP는 이 세션에 없어서 AWS CLI의 읽기 조회를 사용했다. EC2의 사양·보안 그룹·IMDSv2·EBS 암호화, 비공개 RDS의 접근 범위·암호화·단일 AZ, SSM 상태를 확인했다. Terraform의 선언만으로 운영 설정을 확인했다고 주장하지 않는다. 자격 증명·비밀 값은 읽거나 본문에 넣지 않았으며 인프라를 변경하지 않았다.

공개 HTTP 응답으로 API와 웹 루트의 보안 헤더를 따로 확인했다. Cloudflare HSTS 설정과 API의 HSTS 응답은 별개다.

## 이미지

`trust-built-with-code.webp`는 마치며의 도입 이미지다. 혼자 만드는 개발자가 사용성·안정성·보안의 기반을 다듬는 일을 작은 다리를 놓는 모습으로 표현한다. 사용자의 신뢰를 실제 구현으로 쌓되 필요한 만큼 합리적으로 설계하겠다는 글의 결론을 담는다. 완벽한 보안을 보장한다는 의미는 아니다. 생성 프롬프트는 public/images/moyeo-auth-security/trust-built-with-code-prompt.txt에 있다.

`csrf-request-forgery.webp`는 CSRF 설명 바로 아래에서 악성 사이트가 로그인된 브라우저에 변경 요청을 유도하는 과정을 보여 준다. 쿠키가 공격자에게 탈취되는 그림이 아니며, 쿠키 전송이 허용되고 출처 검사가 없는 취약한 서비스를 가정한다. 실제 모여에서 방어 없이 처리된다는 의미는 아니다.

`fresh-authentication-actions.webp`는 모여의 최근 본인 확인이 필요한 대표 작업과 15분 만료 후 확인·권한 재검사 흐름을 보여 준다. 본문에는 identity 유스케이스와 access-action-requirements 정책에 정의된 실제 작업을 표로 정리했다. 비밀번호 변경은 현재 비밀번호를 직접 검증하고 최근 본인 확인 기간을 갱신하는 별도 흐름으로 설명했다. 브라우저 내 비밀번호 확인의 한 번 재시도와 소셜 확인 후 복귀·다시 진행 안내를 구분한다.

`scale-up-out.webp`는 한 서버의 CPU·메모리를 키우는 것과 서버 수를 늘려 요청을 분산하는 것을 비교한다. 오른쪽의 공유 세션 DB는 향후 API 서버 확장의 설명용 모델이며 현재 두 API 서버가 운영된다는 의미가 아니다.

`shared-session-vs-jwt.webp`는 두 형식 모두 쿠키로 전달할 수 있음을 표시하면서 공유 DB의 세션 조회와 각 서버의 JWT 검증을 비교한다. JWT는 아직 유효하고 별도의 로그아웃 상태 조회가 없는 모델이다. 발급자·대상·만료 확인을 함께 표시하고, JWT 내용과 서명 영역을 분리한다. DB 조회용 값은 토큰 Digest로 표기한다. 새 그림 네 장의 프롬프트는 public/images/moyeo-auth-security 아래 같은 이름의 -prompt.txt 파일에 보관한다.

`token-digest-storage.webp`는 토큰 저장의 접힌 설명 안에서 브라우저의 원문 토큰과 DB의 HMAC Digest를 나눈다. 로그인 성공 시 원문은 브라우저로, Digest는 DB로 보내고 다음 요청에서는 서버가 같은 키로 Digest를 계산해 세션을 조회한다. HMAC 키는 서버 쪽에만 표시하며 복호화 과정이나 브라우저 토큰 탈취까지 방지한다는 의미는 없다. 프롬프트는 `public/images/moyeo-auth-security/token-digest-storage-prompt.txt`에 있다.

`concurrent-session-limit.webp`는 동시 로그인 설명 안에서 활성 4개인 같은 계정에 로그인 2건이 들어오는 사례를 비교한다. 두 요청이 각각 4개를 확인하면 6개가 될 수 있지만, 모여는 사용자 행 잠금으로 순서대로 처리해 두 로그인을 허용하면서 활성 5개를 유지한다. A·B는 서로 다른 사용자 계정이 아니라 로그인 요청 이름이다. 프롬프트는 `public/images/moyeo-auth-security/concurrent-session-limit-prompt.txt`에 있다.

`ssr-cookie-isolation.webp`는 쿠키 중계의 접힌 설명 안에서 로그인 요청의 Cookie·응답의 Set-Cookie 전달과 SSR 요청별 클라이언트·캐시 분리를 보여 준다. 상단의 Set-Cookie는 로그인 응답에 해당하며, 하단은 사용자마다 별도 물리 서버나 DB가 아닌 요청마다 만드는 클라이언트와 캐시를 뜻한다. 본문은 헤더 정리·로그인 응답과 SSR 조회의 차이·사용자별 데이터 분리·브라우저 직접 호출의 CORS 조건으로 나눴다. 프롬프트는 `public/images/moyeo-auth-security/ssr-cookie-isolation-prompt.txt`에 있다.

`infrastructure-protection.webp`는 운영 설정의 접힌 설명 안에서 전송 중 보호·저장소 암호화·접근 경로 제한을 비교한다. 그림의 세 영역과 본문의 세 소제목을 맞췄다. 프롬프트는 `public/images/moyeo-auth-security/infrastructure-protection-prompt.txt`에 있다.

`proxy-network-hop.webp`는 브라우저의 직접 API 호출과 TanStack Start를 거치는 경로를 비교한다. 아래 경로의 중간 서버와 시계로 중계 처리·네트워크 왕복 비용을 표현했다. 실측 지연이나 SSR의 선택적 호출을 나타내는 그림은 아니다. 프롬프트는 `public/images/moyeo-auth-security/proxy-network-hop-prompt.txt`에 있다.

`account-sharing.webp`는 넷플릭스의 계정 공유에 빗댄 문단 위에 넣은 새 일러스트다. 하나의 구독 계정, 여러 사용자, 계속 발생하는 운영 비용을 파스텔 그림으로 표현했다. 프롬프트와 변환 설정은 `public/images/moyeo-auth-security/account-sharing-prompt.txt`에 있다.

`public/images/moyeo-auth-security/cover-prompt.txt`에 이미지 생성 프롬프트와 편집 범위를 기록했다. 썸네일은 ImageGen으로 새로 생성한 파스텔 일러스트이며 WebP로 변환했다. 두 화면 예시는 제공된 스크린샷에서 개인정보 영역을 제외하도록 ImageGen으로 편집했다. 원본을 그대로 캡처한 이미지라고 설명하지 않는다.

## 검증

- `bun run check`: 통과. 새 파일 경고 없음; 기존 파일의 경고 6개는 유지.
- `bun run typecheck`: 오류·경고·힌트 0개.
- `bun run test`: 모델의 교체·touch·동시 로그인·알림·철회·해싱 비용과 모든 단계의 도형 경계를 검증. 전체 11개 통과.
- `bun run build`: 통과. 기존 MDX의 head-inject 지시문 경고는 유지.
- `bun run verify:site`: SEO·사이트맵·RSS·분석 정책 20개 통과.
- 개발 URL의 HTTP 200, 제목·썸네일·본문·코드 하이라이팅과 브라우저의 Canvas 자동 재생·종료·단계 이동·다시 보기를 확인.
- 390px 화면의 세션·서버 확장 도식과 프록시 일러스트를 확인. 페이지 가로 넘침 없음. 작은 그림 폭 240px부터 모든 모델 단계의 수치 경계를 검증.
- 운영 산출물의 글 목록·상세 페이지·RSS·사이트맵·llms.txt에 `/post/did-i-secure-my-service`가 포함됨을 확인.

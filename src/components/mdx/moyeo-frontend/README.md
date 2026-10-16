# 모여 프론트엔드 글

본문: `src/content/post/blog/moyeo-frontend-architecture.mdx`  
주소: `/post/moyeo-frontend-architecture`

게시물 페이지의 배치 → 상태의 사용법과 URL 타입 검사 → 목록의 인터페이스와 사전 조회 → 공유 계약과 순수 정책 → 업로드·편집 보호·예약·탭 동기화·행동 분석으로 이어진다. Next.js와 nuqs 비교는 URL 절의 짧은 Before·After로 한정한다. 설명을 위해 만든 상황보다 실제 제품에서 필요한 문제를 먼저 소개한다.

Before와 After는 같은 요구사항을 비교한다. 조회 옵션과 select는 실제 제품 코드를 바탕으로 간추렸다. PostList의 filters/pageSize 인터페이스와 최소 oRPC 계약은 설명을 위한 재구성이며 실제 리팩터링 이력을 주장하지 않는다. 버전 목록과 검증 범위는 본문 대신 아래 문서에 남긴다.

- [구현 대조와 API 검토](./architecture-review.md)
- [편집·동작·화면 확인](./writing-review.md)

## 도식과 자산

- WebP 3개를 사용한다. 실제 게시물 화면은 2026-10-11 Chrome 직장 프로필에서 moyeo.io에 접속해 캡처했고 1008×686 무손실 WebP로 저장했다. 커버와 편집 보호 과정은 설명용 일러스트다.
- FrontendAnimation은 리더 선정·신호 전달·인계·연결 교체를 보여 준다. 자동 재생하지 않으며 서버 HTML에는 SVG 첫 화면과 전체 과정 텍스트가 있다.
- 본문 미리보기의 QuerySelectDiagram과 사용하지 않는 전용 스타일은 제거했다. select는 실제 무한 목록의 페이지 가공 코드로 설명한다.
- 모든 WebP는 본문에서 참조한다. 새 장식 이미지는 추가하지 않았다. 측정 결과와 시간대는 표로 비교한다.

Canvas는 화면 밖·숨김·reduced motion에서 재생하지 않고 observer·리스너·animation frame을 정리한다. 브라우저 API를 실제로 실행하는 시뮬레이터는 아니다.

## 검사

`tests/unit/moyeo-frontend.test.mjs`는 도식의 연결·좌표, 본문 TS/TSX 문법, 금액의 빈 값과 0, 폴링 경계값, 무한 목록 select의 페이지 순서·원본 보존, URL의 부분 변경과 검증·loader·화면 조회 조건의 일치, 분석 이벤트 검증·provider 교체·오류 격리, 편집 보호, 뉴욕 DST 시각을 검사한다. 함수 예제는 본문에서 추출해 실행한다.

저장소 검사: `bun run check`, `bun run typecheck`, `bun run test`, `bun run build`, `bun run verify:site`.

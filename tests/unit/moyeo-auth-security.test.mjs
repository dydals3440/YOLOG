import assert from "node:assert/strict";
import { it } from "node:test";
import {
  addSession,
  getStory,
  hashMemoryMiB,
  remainingSessions,
  scenes,
  shouldNotify,
  tokenAcceptedAfterRevocation,
  touchSession,
} from "../../src/components/mdx/moyeo-auth-security/story.ts";
import { buildFrame } from "../../src/components/mdx/moyeo-auth-security/graphics.ts";

const fiveSessions = () =>
  Array.from({ length: 5 }, (_, i) => ({
    id: String.fromCharCode(65 + i),
    issuedAt: i,
    lastSeenAt: i,
    revoked: false,
  }));

it("여섯 번째 로그인은 성공하고 최근 기록이 가장 오래된 세션을 철회한다", () => {
  const sessions = addSession(touchSession(fiveSessions(), "A", 20), "F", 21);
  assert.deepEqual(
    sessions.filter((s) => s.revoked).map((s) => s.id),
    ["B"],
  );
  assert.equal(sessions.filter((s) => !s.revoked).length, 5);
  assert.equal(sessions.find((s) => s.id === "F").revoked, false);
  assert.equal(fiveSessions()[0].lastSeenAt, 0);
});
it("15분 미만의 사용은 기록을 갱신하지 않고 경계 시각부터 갱신한다", () => {
  assert.equal(touchSession(fiveSessions(), "A", 14)[0].lastSeenAt, 0);
  assert.equal(touchSession(fiveSessions(), "A", 15)[0].lastSeenAt, 15);
});
it("최근 기록이 같으면 발급 시각과 ID로 교체 순서를 정한다", () => {
  const input = [
    { id: "B", issuedAt: 1, lastSeenAt: 2, revoked: false },
    { id: "A", issuedAt: 1, lastSeenAt: 2, revoked: false },
    { id: "C", issuedAt: 0, lastSeenAt: 2, revoked: false },
  ];
  const first = addSession(input, "D", 3, 3);
  assert.deepEqual(
    first.filter((s) => s.revoked).map((s) => s.id),
    ["C"],
  );
  const second = addSession(first, "E", 4, 3);
  assert.deepEqual(
    second.filter((s) => s.revoked).map((s) => s.id),
    ["A", "C"],
  );
});
it("사용자 잠금으로 직렬화한 7개 로그인 모델은 각 확정 시점에 활성 5개 이하를 유지한다", () => {
  let sessions = [];
  for (let i = 0; i < 7; i++) {
    sessions = addSession(sessions, String.fromCharCode(65 + i), i);
    assert(sessions.filter((s) => !s.revoked).length <= 5);
  }
  assert.equal(sessions.length, 7);
  assert.equal(sessions.filter((s) => s.revoked).length, 2);
  assert.deepEqual(
    sessions.filter((s) => !s.revoked).map((s) => s.id),
    ["C", "D", "E", "F", "G"],
  );
});
it("새 기기 안내의 생략 조건을 빠뜨리지 않는다", () => {
  const normal = { earlier: true, recognition: "new", tracked: true };
  assert.equal(shouldNotify(normal), true);
  assert.equal(shouldNotify({ ...normal, earlier: false }), false);
  assert.equal(shouldNotify({ ...normal, recognition: "known" }), false);
  assert.equal(shouldNotify({ ...normal, recognition: "untracked", tracked: false }), false);
  assert.equal(shouldNotify({ ...normal, tracked: false }), false);
});
it("비밀번호 변경·재설정과 최근 인증 만료를 세션 종료와 구분한다", () => {
  assert.deepEqual(remainingSessions("change"), ["현재"]);
  assert.deepEqual(remainingSessions("other"), ["현재"]);
  assert.deepEqual(remainingSessions("reset"), []);
  assert.deepEqual(remainingSessions("admin"), []);
  assert.deepEqual(remainingSessions("fresh"), ["현재"]);
});
it("JWT의 만료 전 철회 한계와 해싱 비용을 전제에 맞게 표시한다", () => {
  assert.equal(tokenAcceptedAfterRevocation("jwt-out"), true);
  assert.equal(tokenAcceptedAfterRevocation("hybrid-out"), false);
  assert.equal(tokenAcceptedAfterRevocation("db-out"), false);
  assert.equal(hashMemoryMiB(8), 512);
  assert.equal(hashMemoryMiB(16), 1024);
});
it("모든 시나리오와 단계는 작은 화면에서도 유한한 도형을 만들고 존재하는 카드로 정보를 전달한다", () => {
  for (const scene of Object.keys(scenes)) {
    {
      const story = getStory(scene);
      assert(story.length >= 3);
      for (const step of story) {
        const ids = new Set(step.cards.map((card) => card.id));
        assert.equal(ids.size, step.cards.length);
        for (const transfer of [
          ...(step.transfers ?? []),
          ...(step.transfer ? [step.transfer] : []),
          ...(step.connections ?? []),
        ]) {
          assert(ids.has(transfer.from));
          assert(ids.has(transfer.to));
        }
        for (const width of [240, 264, 280, 320, 520, 664, 1000]) {
          for (const progress of [0, 0.5, 1]) {
            const frame = buildFrame(step, width, progress);
            assert(frame.height > 0 && Number.isFinite(frame.height));
            for (const mark of frame.marks) {
              const points = mark.kind === "line" ? mark.points : [[mark.x, mark.y]];
              for (const [x, y] of points) {
                assert(Number.isFinite(x) && Number.isFinite(y));
                assert(x >= 0 && x <= frame.width, `${scene}: x=${x}`);
                assert(y >= 0 && y <= frame.height, `${scene}: y=${y}`);
              }
              if (mark.kind === "rect") {
                assert(mark.x + mark.width <= width + 0.001);
                assert(mark.y + mark.height <= frame.height);
              }
            }
          }
        }
      }
    }
  }
});

it("로그인 응답과 SSR 요청은 쿠키를 서로 다른 방향으로 전달한다", () => {
  const response = getStory("cookie");
  assert.equal(response.at(-1).transfer.from, "web");
  assert.equal(response.at(-1).transfer.to, "browser");
  assert.equal(response.at(-1).transfer.label, "Set-Cookie");
  const page = getStory("ssr");
  assert.equal(page[1].transfer.from, "web");
  assert.equal(page[1].transfer.to, "api");
  assert.match(page[1].transfer.label, /Cookie/);
  assert.equal(page.at(-1).transfer.label, "SSR HTML");
});
it("로그아웃 비교는 같은 다음 요청에서 세션 거부와 JWT 검증 통과를 보여 준다", () => {
  const result = getStory("scale").at(-1);
  assert(result.cards.find((card) => card.id === "db-b").lines.includes("다음 요청 거부"));
  assert(result.cards.find((card) => card.id === "jwt-b").lines.includes("토큰 검증 통과"));
  assert.match(result.note, /로그아웃 상태를 조회/);
  const recovery = getStory("recovery");
  assert(recovery[1].cards.find((card) => card.id === "browser").lines.includes("쿠키는 그대로"));
  assert(
    recovery
      .at(-1)
      .cards.find((card) => card.id === "api")
      .lines.includes("인증 거부"),
  );
});

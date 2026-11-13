import { expect, it } from "bun:test";

import type { Point } from "../moyeo-resource-budget/graphics";
import { buildFrame } from "./graphics";
import {
  addSession,
  getStory,
  hashMemoryMiB,
  remainingSessions,
  scenes,
  shouldNotify,
  tokenAcceptedAfterRevocation,
  touchSession,
  type DemoSession,
  type SceneName,
} from "./story";

const isSceneName = (name: string): name is SceneName => Object.hasOwn(scenes, name);

const fiveSessions = () =>
  Array.from({ length: 5 }, (_, i) => ({
    id: String.fromCharCode(65 + i),
    issuedAt: i,
    lastSeenAt: i,
    revoked: false,
  }));

it("여섯 번째 로그인은 성공하고 최근 기록이 가장 오래된 세션을 철회한다", () => {
  const sessions = addSession(touchSession(fiveSessions(), "A", 20), "F", 21);
  expect(sessions.filter((s) => s.revoked).map((s) => s.id)).toStrictEqual(["B"]);
  expect(sessions.filter((s) => !s.revoked).length).toBe(5);
  expect(sessions.find((s) => s.id === "F")?.revoked).toBe(false);
  expect(fiveSessions()[0]?.lastSeenAt).toBe(0);
});
it("15분 미만의 사용은 기록을 갱신하지 않고 경계 시각부터 갱신한다", () => {
  expect(touchSession(fiveSessions(), "A", 14)[0]?.lastSeenAt).toBe(0);
  expect(touchSession(fiveSessions(), "A", 15)[0]?.lastSeenAt).toBe(15);
});
it("최근 기록이 같으면 발급 시각과 ID로 교체 순서를 정한다", () => {
  const input = [
    { id: "B", issuedAt: 1, lastSeenAt: 2, revoked: false },
    { id: "A", issuedAt: 1, lastSeenAt: 2, revoked: false },
    { id: "C", issuedAt: 0, lastSeenAt: 2, revoked: false },
  ];
  const first = addSession(input, "D", 3, 3);
  expect(first.filter((s) => s.revoked).map((s) => s.id)).toStrictEqual(["C"]);
  const second = addSession(first, "E", 4, 3);
  expect(second.filter((s) => s.revoked).map((s) => s.id)).toStrictEqual(["A", "C"]);
});
it("사용자 잠금으로 직렬화한 7개 로그인 모델은 각 확정 시점에 활성 5개 이하를 유지한다", () => {
  let sessions: DemoSession[] = [];
  for (let i = 0; i < 7; i++) {
    sessions = addSession(sessions, String.fromCharCode(65 + i), i);
    expect(sessions.filter((s) => !s.revoked).length <= 5).toBeTruthy();
  }
  expect(sessions.length).toBe(7);
  expect(sessions.filter((s) => s.revoked).length).toBe(2);
  expect(sessions.filter((s) => !s.revoked).map((s) => s.id)).toStrictEqual([
    "C",
    "D",
    "E",
    "F",
    "G",
  ]);
});
it("새 기기 안내의 생략 조건을 빠뜨리지 않는다", () => {
  const normal: Parameters<typeof shouldNotify>[0] = {
    earlier: true,
    recognition: "new",
    tracked: true,
  };
  expect(shouldNotify(normal)).toBe(true);
  expect(shouldNotify({ ...normal, earlier: false })).toBe(false);
  expect(shouldNotify({ ...normal, recognition: "known" })).toBe(false);
  expect(shouldNotify({ ...normal, recognition: "untracked", tracked: false })).toBe(false);
  expect(shouldNotify({ ...normal, tracked: false })).toBe(false);
});
it("비밀번호 변경·재설정과 최근 인증 만료를 세션 종료와 구분한다", () => {
  expect(remainingSessions("change")).toStrictEqual(["현재"]);
  expect(remainingSessions("other")).toStrictEqual(["현재"]);
  expect(remainingSessions("reset")).toStrictEqual([]);
  expect(remainingSessions("admin")).toStrictEqual([]);
  expect(remainingSessions("fresh")).toStrictEqual(["현재"]);
});
it("JWT의 만료 전 철회 한계와 해싱 비용을 전제에 맞게 표시한다", () => {
  expect(tokenAcceptedAfterRevocation("jwt-out")).toBe(true);
  expect(tokenAcceptedAfterRevocation("hybrid-out")).toBe(false);
  expect(tokenAcceptedAfterRevocation("db-out")).toBe(false);
  expect(hashMemoryMiB(8)).toBe(512);
  expect(hashMemoryMiB(16)).toBe(1024);
});
it("모든 시나리오와 단계는 작은 화면에서도 유한한 도형을 만들고 존재하는 카드로 정보를 전달한다", () => {
  for (const scene of Object.keys(scenes).filter(isSceneName)) {
    const story = getStory(scene);
    expect(story.length >= 3).toBeTruthy();
    for (const step of story) {
      const ids = new Set(step.cards.map((card) => card.id));
      expect(ids.size).toBe(step.cards.length);
      for (const transfer of [
        ...(step.transfers ?? []),
        ...(step.transfer ? [step.transfer] : []),
        ...(step.connections ?? []),
      ]) {
        expect(ids.has(transfer.from)).toBeTruthy();
        expect(ids.has(transfer.to)).toBeTruthy();
      }
      for (const width of [240, 264, 280, 320, 520, 664, 1000]) {
        for (const progress of [0, 0.5, 1]) {
          const frame = buildFrame(step, width, progress);
          expect(frame.height > 0 && Number.isFinite(frame.height)).toBeTruthy();
          for (const mark of frame.marks) {
            const points: Point[] = mark.kind === "line" ? mark.points : [[mark.x, mark.y]];
            for (const [x, y] of points) {
              expect(Number.isFinite(x) && Number.isFinite(y)).toBeTruthy();
              expect(x >= 0 && x <= frame.width, `${scene}: x=${x}`).toBeTruthy();
              expect(y >= 0 && y <= frame.height, `${scene}: y=${y}`).toBeTruthy();
            }
            if (mark.kind === "rect") {
              expect(mark.x + mark.width <= width + 0.001).toBeTruthy();
              expect(mark.y + mark.height <= frame.height).toBeTruthy();
            }
          }
        }
      }
    }
  }
});

it("로그인 응답과 SSR 요청은 쿠키를 서로 다른 방향으로 전달한다", () => {
  const response = getStory("cookie");
  expect(response.at(-1)?.transfer?.from).toBe("web");
  expect(response.at(-1)?.transfer?.to).toBe("browser");
  expect(response.at(-1)?.transfer?.label).toBe("Set-Cookie");
  const page = getStory("ssr");
  expect(page[1]?.transfer?.from).toBe("web");
  expect(page[1]?.transfer?.to).toBe("api");
  expect(page[1]?.transfer?.label).toMatch(/Cookie/);
  expect(page.at(-1)?.transfer?.label).toBe("SSR HTML");
});
it("로그아웃 비교는 같은 다음 요청에서 세션 거부와 JWT 검증 통과를 보여 준다", () => {
  const result = getStory("scale").at(-1);
  expect(
    result?.cards.find((card) => card.id === "db-b")?.lines.includes("다음 요청 거부"),
  ).toBeTruthy();
  expect(
    result?.cards.find((card) => card.id === "jwt-b")?.lines.includes("토큰 검증 통과"),
  ).toBeTruthy();
  expect(result?.note).toMatch(/로그아웃 상태를 조회/);
  const recovery = getStory("recovery");
  expect(
    recovery[1]?.cards.find((card) => card.id === "browser")?.lines.includes("쿠키는 그대로"),
  ).toBeTruthy();
  expect(
    recovery
      .at(-1)
      ?.cards.find((card) => card.id === "api")
      ?.lines.includes("인증 거부"),
  ).toBeTruthy();
});

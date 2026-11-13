import { expect, it } from "bun:test";

import type { Point } from "./graphics";
import {
  buildDiagram,
  buildScene,
  diagrams,
  scenes,
  type DiagramName,
  type SceneName,
} from "./scenes";
import {
  batch,
  connectionDemo,
  eventLoopAt,
  ioModelAt,
  fanoutComparison,
  parallelComparison,
  poolAt,
  simulatePool,
} from "./simulation";

const isSceneName = (name: string): name is SceneName => Object.hasOwn(scenes, name);
const isDiagramName = (name: string): name is DiagramName => Object.hasOwn(diagrams, name);

it("12개 작업은 사라지거나 중복되지 않고, 연결 8개 안에서 완료된다", () => {
  for (let time = 0; time <= 3500; time += 25) {
    const state = poolAt(connectionDemo, time);
    expect(state.arrived.length).toBe(
      state.running.length + state.waiting.length + state.pending.length + state.completed.length,
    );
    expect(state.running.length <= 8).toBeTruthy();
    expect(new Set(state.running.map((request) => request.slot)).size).toBe(state.running.length);
  }
  expect(poolAt(connectionDemo, 500).waiting.length).toBe(4);
  expect(poolAt(connectionDemo, 1500).waiting.length).toBe(0);
  expect(poolAt(connectionDemo, 3000).completed.length).toBe(12);
  for (const request of connectionDemo.executions.filter((item) => item.group === "extra")) {
    expect(request.started - request.arrived).toBe(1000);
    expect(request.ended - request.arrived).toBe(2500);
  }
});

it("작업 내부 제한은 호출 총량 대신 풀로 들어가는 수를 바꾼다", () => {
  const [unlimitedCase, boundedCase] = fanoutComparison;
  const unlimited = poolAt(unlimitedCase.simulation, 1500);
  const bounded = poolAt(boundedCase.simulation, 1500);
  expect([
    unlimited.running.length,
    unlimited.waiting.length,
    unlimited.pending.length,
  ]).toStrictEqual([8, 8, 0]);
  expect([bounded.running.length, bounded.waiting.length, bounded.pending.length]).toStrictEqual([
    8, 0, 8,
  ]);
  for (const { simulation } of fanoutComparison)
    expect(poolAt(simulation, 4000).completed.length).toBe(16);
  for (const time of [0, 500, 1999, 2000, 3500]) {
    const state = poolAt(boundedCase.simulation, time);
    for (const group of ["A", "B", "C", "D"]) {
      expect(
        [...state.running, ...state.waiting].filter((item) => item.group === group).length <= 2,
      ).toBeTruthy();
    }
  }
});

it("병렬 묶음의 속도와 화면 조회의 대기는 본문 수치와 일치한다", () => {
  const timings = parallelComparison.map(({ simulation }) => {
    const screen = simulation.executions.find((request) => request.group === "screen");
    if (!screen) expect.unreachable("화면 조회 실행이 있어야 한다");
    const backgroundEnd = Math.max(
      ...simulation.executions
        .filter((request) => request.group === "background")
        .map((request) => request.ended),
    );
    return [screen.ended - screen.arrived, backgroundEnd];
  });
  expect(timings).toStrictEqual([
    [50, 2000],
    [50, 1000],
    [500, 500],
  ]);
});

it("예약 확인 자리를 분리하면 긴 외부 요청 뒤의 2.5초 대기를 피한다", () => {
  const shared = simulatePool([...batch(4, "provider", 3000), ...batch(1, "tick", 250, 500)], 4);
  const dedicated = simulatePool(batch(1, "tick", 250, 500), 1);
  const tick = shared.executions.find((request) => request.group === "tick");
  const [dedicatedTick] = dedicated.executions;
  if (!tick || !dedicatedTick) expect.unreachable("예약 확인 실행이 있어야 한다");
  expect(tick.started - tick.arrived).toBe(2500);
  expect(dedicatedTick.started - dedicatedTick.arrived).toBe(0);
});

it("동기 계산이 길어지면 두 큐의 콜백이 모두 스택을 기다린다", () => {
  const short = eventLoopAt(0.52);
  const long = eventLoopAt(0.52, true);
  expect(short.output).toStrictEqual(["① 동기 코드", "② Promise", "③ 타이머"]);
  expect(long.active).toBe("script");
  expect(long.blocked).toBe(true);
  expect(long.promiseQueued).toBe(true);
  expect(long.timerQueued).toBe(true);
  expect(long.output).toStrictEqual([]);
  for (const heavy of [false, true]) {
    for (let tick = 0; tick <= 100; tick += 1) {
      const state = eventLoopAt(tick / 100, heavy);
      if (state.active === "script") expect(state.output.length).toBe(0);
      if (state.active === "timer") expect(state.promiseCompleted).toBe(true);
      if (state.timerCompleted) expect(state.promiseCompleted).toBe(true);
    }
    expect(eventLoopAt(1, heavy).output).toStrictEqual(short.output);
  }
});

it("본문의 완료된 Promise와 0ms 타이머 예시는 동기 코드 다음에 실행된다", async () => {
  const output: string[] = [];
  const finished = new Promise<void>((resolve) => {
    setTimeout(() => {
      output.push("타이머");
      resolve();
    }, 0);
  });
  const reaction = Promise.resolve().then(() => output.push("Promise"));
  output.push("동기 코드");
  expect(output).toStrictEqual(["동기 코드"]);
  await Promise.all([reaction, finished]);
  expect(output).toStrictEqual(["동기 코드", "Promise", "타이머"]);
});

it("비동기 I/O의 대기는 겹쳐도 JS 실행은 하나씩 진행된다", () => {
  expect(ioModelAt(0).completed.length).toBe(0);
  expect(ioModelAt(0.45).waiting.length).toBe(3);
  for (let tick = 0; tick <= 1400; tick += 1) {
    const state = ioModelAt(tick / 1400);
    expect(state.executing.length <= 1).toBeTruthy();
    expect(state.requests.length).toBe(3);
    for (const request of state.requests) {
      expect(request.dispatched < request.waiting).toBeTruthy();
      expect(request.waiting < request.ready).toBeTruthy();
      expect(request.ready < request.ended).toBeTruthy();
    }
  }
  expect(ioModelAt(1).completed.length).toBe(3);
});

it("병렬 차트는 공통 시간축 안에서 완료를 표시한다", () => {
  for (const width of [280, 664]) {
    const texts = (progress: number) =>
      buildScene("parallel", progress, width)
        .marks.filter((mark) => mark.kind === "text")
        .map((mark) => mark.text);
    expect(texts(0).filter((text) => text === "8개 중 0개 완료").length).toBe(3);
    expect(texts(1).filter((text) => text === "8개 중 8개 완료").length).toBe(3);
    expect(texts(1).filter((text) => text.startsWith("묶음 완료")).length).toBe(3);
    expect(texts(1).filter((text) => text === "2.2초").length).toBe(3);
    expect(texts(0.45).filter((text) => text.startsWith("묶음 완료")).length).toBe(1);
  }
});

it("좁은 화면과 가로 배치 경계에서 모든 도형이 그림 영역 안에 머문다", () => {
  for (const width of [280, 320, 400, 539, 540, 664]) {
    const frames = [
      ...Object.keys(scenes)
        .filter(isSceneName)
        .flatMap((scene) =>
          [0, 0.16, 0.35, 0.6, 0.9, 1].map((progress) => buildScene(scene, progress, width)),
        ),
      ...Object.keys(diagrams)
        .filter(isDiagramName)
        .map((diagram) => buildDiagram(diagram, width)),
    ];
    for (const frame of frames) {
      for (const mark of frame.marks) {
        const points: Point[] =
          mark.kind === "line"
            ? mark.points
            : mark.kind === "rect"
              ? [
                  [mark.x, mark.y],
                  [mark.x + mark.width, mark.y + mark.height],
                ]
              : [[mark.x, mark.y]];
        for (const [x, y] of points) {
          expect(Number.isFinite(x) && Number.isFinite(y)).toBeTruthy();
          expect(
            x >= 0 && x <= frame.width && y >= 0 && y <= frame.height,
            `${width}px: ${JSON.stringify(mark)}`,
          ).toBeTruthy();
        }
      }
    }
  }
});

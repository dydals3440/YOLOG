import assert from "node:assert/strict";
import { test } from "node:test";
import {
  batch,
  connectionDemo,
  eventLoopAt,
  fanoutComparison,
  parallelComparison,
  poolAt,
  simulatePool,
} from "./simulation";
import {
  buildDiagram,
  buildScene,
  diagrams,
  scenes,
  type DiagramName,
  type SceneName,
} from "./scenes";

test("12개 작업은 사라지거나 중복되지 않고, 연결 8개 안에서 완료된다", () => {
  for (let time = 0; time <= 3500; time += 25) {
    const state = poolAt(connectionDemo, time);
    assert.equal(
      state.arrived.length,
      state.running.length + state.waiting.length + state.pending.length + state.completed.length,
    );
    assert.ok(state.running.length <= 8);
    assert.equal(new Set(state.running.map((request) => request.slot)).size, state.running.length);
  }
  assert.equal(poolAt(connectionDemo, 500).waiting.length, 4);
  assert.equal(poolAt(connectionDemo, 1500).waiting.length, 0);
  assert.equal(poolAt(connectionDemo, 3000).completed.length, 12);
  for (const request of connectionDemo.executions.filter((item) => item.group === "extra")) {
    assert.equal(request.started - request.arrived, 1000);
    assert.equal(request.ended - request.arrived, 2500);
  }
});

test("작업 내부 제한은 호출 총량 대신 풀로 들어가는 수를 바꾼다", () => {
  const unlimited = poolAt(fanoutComparison[0].simulation, 1500);
  const bounded = poolAt(fanoutComparison[1].simulation, 1500);
  assert.deepEqual(
    [unlimited.running.length, unlimited.waiting.length, unlimited.pending.length],
    [8, 8, 0],
  );
  assert.deepEqual(
    [bounded.running.length, bounded.waiting.length, bounded.pending.length],
    [8, 0, 8],
  );
  for (const { simulation } of fanoutComparison)
    assert.equal(poolAt(simulation, 4000).completed.length, 16);
  for (const time of [0, 500, 1999, 2000, 3500]) {
    const state = poolAt(fanoutComparison[1].simulation, time);
    for (const group of ["A", "B", "C", "D"]) {
      assert.ok(
        [...state.running, ...state.waiting].filter((item) => item.group === group).length <= 2,
      );
    }
  }
});

test("병렬 묶음의 속도와 화면 조회의 대기는 본문 수치와 일치한다", () => {
  parallelComparison.forEach(({ simulation }, i) => {
    const screen = simulation.executions.find((request) => request.group === "screen");
    assert.ok(screen);
    assert.equal(screen.ended - screen.arrived, [50, 50, 500][i]);
    assert.equal(
      Math.max(
        ...simulation.executions
          .filter((request) => request.group === "background")
          .map((request) => request.ended),
      ),
      [2000, 1000, 500][i],
    );
  });
});

test("정기 검사 자리를 분리하면 긴 외부 요청 뒤의 2.5초 대기를 피한다", () => {
  const shared = simulatePool([...batch(4, "provider", 3000), ...batch(1, "tick", 250, 500)], 4);
  const dedicated = simulatePool(batch(1, "tick", 250, 500), 1);
  const tick = shared.executions.find((request) => request.group === "tick");
  assert.ok(tick);
  assert.equal(tick.started - tick.arrived, 2500);
  assert.equal(dedicated.executions[0].started - dedicated.executions[0].arrived, 0);
});

test("동기 계산이 길어지면 두 큐의 콜백이 모두 스택을 기다린다", () => {
  const short = eventLoopAt(0.52);
  const long = eventLoopAt(0.52, true);
  assert.deepEqual(short.output, ["① 동기 코드", "② Promise", "③ 타이머"]);
  assert.equal(long.active, "script");
  assert.equal(long.blocked, true);
  assert.equal(long.promiseQueued, true);
  assert.equal(long.timerQueued, true);
  assert.deepEqual(long.output, []);
  for (const heavy of [false, true]) {
    for (let tick = 0; tick <= 100; tick += 1) {
      const state = eventLoopAt(tick / 100, heavy);
      if (state.active === "script") assert.equal(state.output.length, 0);
      if (state.active === "timer") assert.equal(state.promiseCompleted, true);
      if (state.timerCompleted) assert.equal(state.promiseCompleted, true);
    }
    assert.deepEqual(eventLoopAt(1, heavy).output, short.output);
  }
});

test("본문의 완료된 Promise와 0ms 타이머 예시는 동기 코드 다음에 실행된다", async () => {
  const output: string[] = [];
  const finished = new Promise<void>((resolve) => {
    setTimeout(() => {
      output.push("타이머");
      resolve();
    }, 0);
  });
  const reaction = Promise.resolve().then(() => output.push("Promise"));
  output.push("동기 코드");
  assert.deepEqual(output, ["동기 코드"]);
  await Promise.all([reaction, finished]);
  assert.deepEqual(output, ["동기 코드", "Promise", "타이머"]);
});

test("좁은 화면과 가로 배치 경계에서 모든 도형이 그림 영역 안에 머문다", () => {
  for (const width of [280, 320, 400, 539, 540, 664]) {
    const frames = [
      ...Object.keys(scenes).flatMap((scene) =>
        [0, 0.16, 0.35, 0.6, 0.9, 1].map((progress) =>
          buildScene(scene as SceneName, progress, width),
        ),
      ),
      ...Object.keys(diagrams).map((diagram) => buildDiagram(diagram as DiagramName, width)),
    ];
    for (const frame of frames) {
      for (const mark of frame.marks) {
        const points =
          mark.kind === "line"
            ? mark.points
            : mark.kind === "rect"
              ? [
                  [mark.x, mark.y],
                  [mark.x + mark.width, mark.y + mark.height],
                ]
              : [[mark.x, mark.y]];
        for (const [x, y] of points) {
          assert.ok(Number.isFinite(x) && Number.isFinite(y));
          assert.ok(
            x >= 0 && x <= frame.width && y >= 0 && y <= frame.height,
            `${width}px: ${JSON.stringify(mark)}`,
          );
        }
      }
    }
  }
});

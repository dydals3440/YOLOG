export interface Request {
  id: string;
  arrived: number;
  duration: number;
  group: string;
}

export interface Execution extends Request {
  admitted: number;
  started: number;
  ended: number;
  slot: number;
}

export interface PoolSample {
  time: number;
  arrived: number;
  admitted: number;
  running: number;
  waiting: number;
  pending: number;
  completed: number;
}

export interface Simulation {
  capacity: number;
  requests: Request[];
  executions: Execution[];
  samples: PoolSample[];
}

/** Scaled browser example: a script, a resolved Promise reaction, then a ready timer. */
export function eventLoopAt(progress: number, longSynchronousWork = false) {
  const scriptEnd = longSynchronousWork ? 0.66 : 0.22;
  const promiseStart = scriptEnd + 0.02;
  const promiseEnd = scriptEnd + 0.1;
  const timerStart = scriptEnd + 0.16;
  const timerEnd = scriptEnd + 0.24;
  const active =
    progress < scriptEnd
      ? "script"
      : progress >= promiseStart && progress < promiseEnd
        ? "promise"
        : progress >= timerStart && progress < timerEnd
          ? "timer"
          : null;
  return {
    active,
    blocked: longSynchronousWork && progress >= 0.14 && progress < scriptEnd,
    promiseQueued: progress >= 0.08 && progress < promiseStart,
    timerQueued: progress >= 0.12 && progress < timerStart,
    promiseCompleted: progress >= promiseEnd,
    timerCompleted: progress >= timerEnd,
    output: [
      ...(progress >= scriptEnd ? ["① 동기 코드"] : []),
      ...(progress >= promiseEnd ? ["② Promise"] : []),
      ...(progress >= timerEnd ? ["③ 타이머"] : []),
    ],
  };
}

/** Admission limits protect a job's own queue before it joins the shared DB pool. */
export function simulatePool(
  requests: readonly Request[],
  capacity: number,
  groupLimits: Readonly<Record<string, number>> = {},
): Simulation {
  if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("잘못된 풀 크기");
  if (new Set(requests.map((request) => request.id)).size !== requests.length) {
    throw new RangeError("중복 요청 ID");
  }
  for (const limit of Object.values(groupLimits)) {
    if (!Number.isInteger(limit) || limit < 1) throw new RangeError("잘못된 실행 제한");
  }
  for (const request of requests) {
    if (
      !Number.isFinite(request.arrived) ||
      request.arrived < 0 ||
      !Number.isFinite(request.duration) ||
      request.duration <= 0
    ) {
      throw new RangeError("잘못된 요청 시간");
    }
  }
  const ordered = requests.toSorted((a, b) => a.arrived - b.arrived);
  const pending: Request[] = [];
  const waiting: Array<Request & { admitted: number }> = [];
  const running: Execution[] = [];
  const executions: Execution[] = [];
  const samples: PoolSample[] = [];
  let next = 0;
  let completed = 0;
  let admitted = 0;
  let time = ordered[0]?.arrived ?? 0;

  while (completed < ordered.length) {
    for (let i = running.length - 1; i >= 0; i -= 1) {
      if (running[i].ended <= time) {
        running.splice(i, 1);
        completed += 1;
      }
    }
    while (next < ordered.length && ordered[next].arrived <= time) {
      pending.push(ordered[next]);
      next += 1;
    }
    for (let i = 0; i < pending.length;) {
      const request = pending[i];
      const active = [...running, ...waiting].filter((item) => item.group === request.group).length;
      if (active >= (groupLimits[request.group] ?? Infinity)) {
        i += 1;
      } else {
        waiting.push({ ...request, admitted: time });
        pending.splice(i, 1);
        admitted += 1;
      }
    }
    while (running.length < capacity && waiting.length > 0) {
      const request = waiting.shift();
      if (!request) break;
      const occupied = new Set(running.map((item) => item.slot));
      let slot = 0;
      while (occupied.has(slot)) slot += 1;
      const execution = { ...request, started: time, ended: time + request.duration, slot };
      running.push(execution);
      executions.push(execution);
    }
    samples.push({
      time,
      arrived: next,
      admitted,
      running: running.length,
      waiting: waiting.length,
      pending: pending.length,
      completed,
    });
    const future = Math.min(
      ordered[next]?.arrived ?? Infinity,
      ...running.map((item) => item.ended),
    );
    if (!Number.isFinite(future) && completed < ordered.length)
      throw new Error("진행할 수 없는 시뮬레이션");
    time = future;
  }
  return { capacity, requests: ordered, executions, samples };
}

export function poolAt(simulation: Simulation, time: number) {
  const arrived = simulation.requests.filter((request) => request.arrived <= time);
  const running = simulation.executions.filter(
    (request) => request.started <= time && request.ended > time,
  );
  const waiting = simulation.executions.filter(
    (request) => request.admitted <= time && request.started > time,
  );
  const pending = simulation.executions.filter(
    (request) => request.arrived <= time && request.admitted > time,
  );
  const completed = simulation.executions.filter((request) => request.ended <= time);
  const maximumWait = Math.max(0, ...waiting.map((request) => time - request.admitted));
  return { arrived, running, waiting, pending, completed, maximumWait };
}

export function batch(count: number, group: string, duration: number, arrived = 0): Request[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${group}-${i}`,
    group,
    duration,
    arrived,
  }));
}

export const connectionDemo = simulatePool(
  [...batch(8, "first", 1500), ...batch(4, "extra", 1500, 500)],
  8,
);

const comparisonRequests = [...batch(8, "background", 250), ...batch(1, "screen", 50, 50)];
export const parallelComparison = [
  {
    name: "하나씩 실행",
    limit: 1,
    simulation: simulatePool(comparisonRequests, 4, { background: 1 }),
  },
  {
    name: "두 개씩 실행",
    limit: 2,
    simulation: simulatePool(comparisonRequests, 4, { background: 2 }),
  },
  { name: "여덟 개를 시작", limit: 8, simulation: simulatePool(comparisonRequests, 4) },
];

const fanoutRequests = ["A", "B", "C", "D"].flatMap((group) => batch(4, group, 2000));
export const fanoutComparison = [
  { name: "작업마다 네 개씩 시작", simulation: simulatePool(fanoutRequests, 8) },
  {
    name: "작업마다 두 개씩 시작",
    simulation: simulatePool(fanoutRequests, 8, { A: 2, B: 2, C: 2, D: 2 }),
  },
];

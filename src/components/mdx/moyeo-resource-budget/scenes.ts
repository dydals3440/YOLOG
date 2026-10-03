import type { Frame, Ink, Mark, Point } from "./graphics";
import {
  batch,
  connectionDemo,
  eventLoopAt,
  fanoutComparison,
  parallelComparison,
  poolAt,
  simulatePool,
  type Simulation,
} from "./simulation";

export type SceneName =
  | "symptoms"
  | "pool"
  | "fanout"
  | "event-loop"
  | "parallel"
  | "locks"
  | "lanes"
  | "atomic"
  | "notify";
export type DiagramName =
  | "jobs"
  | "collection"
  | "transaction"
  | "deadlock"
  | "experiment"
  | "topology"
  | "capacity";

export const scenes: Record<
  SceneName,
  { title: string; description: string; duration: number; snapshot: number }
> = {
  symptoms: {
    title: "CPU 사용률이 낮아도 처리는 느릴 수 있다",
    description:
      '정상 상태, 대기가 길어진 상태, CPU 사용률이 100%인 상태를 비교한다. CPU 사용률과 처리 시간의 축은 각각 동일하다. 두 번째 상황은 CPU 사용률이 낮아도 처리가 느릴 수 있다는 것을 보여준다. 실제 "모여" 모니터링 시계열이 아니다.',
    duration: 14,
    snapshot: 0.85,
  },
  pool: {
    title: "연결을 돌려줘야 다음 작업이 시작된다",
    description:
      "연결 8개에 먼저 8개 작업이 들어오고, 0.5초 뒤 4개가 추가된다. 작업마다 연결을 1.5초 사용한다는 설명용 가정이다. 대기 점은 아직 DB 연결을 얻지 못한 작업이다.",
    duration: 12,
    snapshot: 0.34,
  },
  fanout: {
    title: "작업 수와 연결 요청 수는 다르다",
    description:
      "작업 네 개가 DB 호출 네 개씩 실행하는 16개 요청 예시다. 왼쪽은 전부 시작해 풀에서 기다리고, 오른쪽은 작업당 두 개씩 시작해 나머지가 작업 안에서 기다린다. 당시 실제 작업 하나가 동시에 쓰려던 연결은 4~7개였다.",
    duration: 14,
    snapshot: 0.35,
  },
  "event-loop": {
    title: "콜백은 언제 실행될까?",
    description:
      "브라우저 예시다. 짧은 동기 코드와 긴 동기 계산을 비교한다. 호출 스택이 비면 Promise의 마이크로태스크를 먼저 처리하고, 다음 태스크인 타이머 콜백을 실행한다. 오른쪽은 동기 계산이 끝날 때까지 두 큐의 콜백이 모두 기다린다. 그림의 시간은 설명을 위해 늘렸다.",
    duration: 12,
    snapshot: 0.52,
  },
  parallel: {
    title: "작업은 빨라졌는데, 화면은 더 느려졌다",
    description:
      "풀 4개, DB 작업 8개(각 250ms), 50ms 뒤 들어온 화면 조회(50ms)를 비교한다. 한꺼번에 실행하면 화면 조회는 앞선 8개 뒤에서 기다려 총 500ms가 걸린다. 하나씩·두 개씩 시작하면 50ms에 끝난다. 실제 측정과 구분한 FIFO 모델 예시다.",
    duration: 16,
    snapshot: 0.28,
  },
  locks: {
    title: "락을 기다리는 동안에도 연결을 쓴다",
    description:
      "같은 채널을 처리하는 작업 하나와 락을 원하는 다른 작업 셋의 예시다. 연결을 잡고 기다리면 점유는 네 개가 된다. try-lock에 실패하고 돌려주면 쓰는 연결은 하나다. 미룬 작업은 버리지 않고 다음 시각에 다시 시도한다.",
    duration: 12,
    snapshot: 0.4,
  },
  lanes: {
    title: "긴 작업 때문에 짧은 검사까지 밀릴 때",
    description:
      "실행 슬롯 4개와 3초짜리 외부 작업 4개를 가정한다. 0.5초에 들어온 0.25초짜리 검사는 한 줄에서 2.5초 기다린다. 외부 작업 3자리와 검사 1자리를 나누면 바로 시작한다. 실제 운영 슬롯 설정을 재생한 것은 아니다.",
    duration: 14,
    snapshot: 0.48,
  },
  atomic: {
    title: "저장과 작업 등록 사이에 끊기면",
    description:
      "먼저 DB를 커밋하고 외부 큐에 등록하다 끊기면 예약만 남을 수 있다. pg-boss에 같은 DB 트랜잭션으로 넣으면 예약과 작업이 함께 남는다. 별도 장면에서는 커밋 전에 실패했을 때 둘 다 롤백되는 모습을 보여준다.",
    duration: 16,
    snapshot: 0.6,
  },
  notify: {
    title: "알림을 놓쳐도, 기록에서 다시 찾는다",
    description:
      "워커가 끊겨 있으면 NOTIFY 신호를 받지 못한다. 그래도 커밋한 작업 행은 DB에 남는다. 다시 연결한 워커가 주기 조회로 작업을 찾아 처리한다. 알림 자체가 오프라인 전달을 보장하는 큐는 아니다.",
    duration: 14,
    snapshot: 0.5,
  },
};

export const diagrams: Record<DiagramName, { title: string; description: string }> = {
  transaction: {
    title: "외부 응답을 기다릴 때, DB 연결은?",
    description:
      "상태 확인 10ms, 외부 HTTP 응답 3초, 결과 저장 10ms라는 개념 예시다. 한 트랜잭션으로 묶으면 외부 응답을 기다리는 동안에도 DB 연결을 빌린다. 두 짧은 트랜잭션으로 나누면 HTTP 대기 구간에는 이 작업의 DB 연결을 돌려줄 수 있다. 결과 저장 전 실행 식별자와 상태를 다시 확인해야 한다. 칸의 높이는 시간에 비례하지 않는다.",
  },
  deadlock: {
    title: "서로의 락을 기다리면 끝낼 수 없다",
    description:
      "작업 A는 부모 행을 잠근 채 B가 잠근 자식 행을 기다리고, B는 자식 행을 잠근 채 A가 잠근 부모 행을 기다린다. 같은 부모·자식 행을 반대 순서로 잠그는 개념 예시다. 두 경로 모두 부모부터 잠그면 이 순환 대기를 피할 수 있다.",
  },
  collection: {
    title: "많은 데이터도 조금씩 이어서 가져온다",
    description:
      '"모여" 최초 게시물 수집은 페이지별 데이터와 진행 위치, 후속 작업을 같은 트랜잭션으로 저장한다. 한 실행의 페이지 예산에 닿으면 다음 작업으로 넘긴다. 성과의 과거 구간 수집은 API 요청 예산과 SNS별 조회 기간 상한으로 분량을 정한다. 전체 수집 코드를 하나의 공통 배치 엔진으로 구현한 것은 아니다.',
  },
  jobs: {
    title: "예약 한 번에서 이어지는 일",
    description:
      "발행 시각 확인, 파일 준비, SNS 게시물 발행, 댓글·성과 수집, SNS 계정 인증 갱신, 실패 작업 재처리, 오래된 파일·기록 정리는 서로 다른 주기로 실행된다. 아래 연결은 업무의 관계이며 모든 작업이 반드시 순서대로 한 번씩 실행된다는 뜻은 아니다.",
  },
  experiment: {
    title: '"모여" 성과 조회 · 실제 격리 실험',
    description:
      "초당 20회 읽기, API 풀 상한 4개. 순차와 두 조회 병렬의 reader 구간 p95는 모두 약 23.3ms, 관측 연결은 각각 1개와 2개였다. 인증·전체 HTTP 처리·다른 워커 부하는 포함하지 않은 실험이다.",
  },
  topology: {
    title: "현재 구성 · 2026년 10월 3일 기준",
    description:
      "웹은 Cloudflare Worker, API와 워커는 같은 EC2에서 실행한다. PostgreSQL에 업무 데이터와 pg-boss 작업을 저장한다. 공개 인바운드는 닫고 Tunnel·SSM으로 접근한다. 첫 풀 장애 당시 RDS는 micro였으며 현재는 small이다.",
  },
  capacity: {
    title: "API와 워커가 사용할 DB 연결 수",
    description:
      "API는 업무 4 + pg-boss 2 + 변경 알림 리스너 1 = 7개, 워커는 업무 14 + pg-boss 2 + 큐 리스너 1 = 17개다. 운영 상한 24에 마이그레이션 4와 운영자 5의 여유를 더해 33개를 계획한다.",
  },
};

class Drawing {
  readonly marks: Mark[] = [];
  constructor(readonly width: number) {}
  text(
    text: string,
    x: number,
    y: number,
    ink: Ink = "text",
    size = 14,
    bold = false,
    align: "start" | "middle" | "end" = "start",
  ) {
    this.marks.push({ kind: "text", text, x, y, ink, size, bold, align });
  }
  wrap(text: string, x: number, y: number, width: number, ink: Ink = "muted", size = 13) {
    let line = "";
    let row = 0;
    const measure = (value: string) =>
      Array.from(value).reduce(
        (sum, char) => sum + (/[\u3000-\uffff]/.test(char) ? size : size * 0.57),
        0,
      );
    for (const word of text.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) > width && line) {
        this.text(line.trim(), x, y + row * (size + 6), ink, size);
        line = "";
        row += 1;
      }
      if (measure(word) <= width) line = line ? `${line} ${word}` : word;
      else {
        for (const char of word) {
          if (measure(line + char) > width && line) {
            this.text(line, x, y + row * (size + 6), ink, size);
            line = "";
            row += 1;
          }
          line += char;
        }
      }
    }
    if (line) this.text(line.trim(), x, y + row * (size + 6), ink, size);
    return (row + 1) * (size + 6);
  }
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: Ink = "surface",
    stroke?: Ink,
    radius = 8,
    dash = false,
  ) {
    this.marks.push({ kind: "rect", x, y, width, height, fill, stroke, radius, dash });
  }
  line(points: Point[], stroke: Ink = "border", width = 1, dash = false, fill?: Ink) {
    this.marks.push({ kind: "line", points, stroke, width, dash, fill });
  }
  dot(x: number, y: number, fill: Ink = "blue", radius = 5) {
    this.marks.push({ kind: "circle", x, y, radius, fill, stroke: "background" });
  }
  arrow(x: number, y: number, xx: number, yy: number, ink: Ink = "muted", dash = false) {
    this.line(
      [
        [x, y],
        [xx, yy],
      ],
      ink,
      1.5,
      dash,
    );
    const angle = Math.atan2(yy - y, xx - x);
    this.line(
      [
        [xx - 6 * Math.cos(angle - 0.5), yy - 6 * Math.sin(angle - 0.5)],
        [xx, yy],
        [xx - 6 * Math.cos(angle + 0.5), yy - 6 * Math.sin(angle + 0.5)],
      ],
      ink,
      1.5,
    );
  }
  frame(height: number): Frame {
    return { width: this.width, height, marks: this.marks };
  }
}

const ms = (value: number) => `${Math.round(value)}ms`;
const seconds = (value: number) => `${(value / 1000).toFixed(1)}초`;
const groupInk: Record<string, Ink> = {
  A: "blue",
  B: "blue",
  C: "blue",
  D: "blue",
  screen: "green",
};

function plot(
  d: Drawing,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  values: Point[],
  maximum: number,
  time: number,
  horizon: number,
  ink: "blue" | "purple" | "orange",
  unit: string,
  step = false,
) {
  d.text(title, x, y, "muted", 13, true);
  const xx = x + 37;
  const yy = y + 16;
  const ww = width - 52;
  const hh = height - 40;
  d.rect(xx, yy, ww, hh, "surface", "border", 0);
  for (let i = 0; i <= 2; i += 1) {
    const value = maximum * (1 - i / 2);
    const row = yy + (hh * i) / 2;
    d.line([
      [xx, row],
      [xx + ww, row],
    ]);
    d.text(`${value}${unit}`, xx - 6, row + 4, "muted", 11, false, "end");
  }
  const position = ([t, value]: Point): Point => [
    xx + (Math.min(t, horizon) / horizon) * ww,
    yy + hh * (1 - Math.min(maximum, value) / maximum),
  ];
  const shown = values.filter(([t]) => t <= time);
  if (shown.length === 0) shown.push([0, 0]);
  let endValue = shown[shown.length - 1][1];
  const after = values.find(([t]) => t > time);
  const last = shown[shown.length - 1];
  if (!step && after && after[0] > last[0])
    endValue = last[1] + ((after[1] - last[1]) * (time - last[0])) / (after[0] - last[0]);
  const path: Point[] = [];
  shown.forEach((point, i) => {
    if (step && i > 0) path.push(position([point[0], shown[i - 1][1]]));
    path.push(position(point));
  });
  path.push(position([time, endValue]));
  const end = path[path.length - 1];
  d.line([[xx, yy + hh], ...path, [end[0], yy + hh]], ink, 0, false, `${ink}Soft`);
  d.line(path, ink, 2.5);
  d.line(
    [
      [end[0], yy],
      [end[0], yy + hh],
    ],
    "muted",
    1,
    true,
  );
  d.dot(end[0], end[1], ink, 4.5);
  const readout =
    unit === "%"
      ? `${Math.round(endValue)}%`
      : unit === "초"
        ? `${endValue.toFixed(1)}초`
        : `${Math.round(endValue)}${unit}`;
  const readoutY = Math.max(
    yy + 17,
    Math.min(yy + hh - 8, end[1] < yy + hh * 0.3 ? end[1] + 23 : end[1] - 12),
  );
  d.text(readout, xx + ww - 5, readoutY, ink, 13, true, "end");
  d.text("0", xx, yy + hh + 18, "muted", 11);
  d.text(`${horizon / 1000}초`, xx + ww, yy + hh + 18, "muted", 11, false, "end");
}

function panels(width: number, count: number, height: number) {
  const stacked = width < 540;
  const gap = 22;
  const panelWidth = stacked ? width - 20 : (width - 20 - gap * (count - 1)) / count;
  return {
    stacked,
    panelWidth,
    boxes: Array.from({ length: count }, (_, i) => ({
      x: stacked ? 10 : 10 + i * (panelWidth + gap),
      y: stacked ? 14 + i * (height + 26) : 14,
    })),
    height: stacked ? count * (height + 26) : height + 28,
  };
}

function slotRow(
  d: Drawing,
  simulation: Simulation,
  time: number,
  x: number,
  y: number,
  width: number,
  label: string,
) {
  const state = poolAt(simulation, time);
  d.text(label, x, y, "muted", 13, true);
  const columns = simulation.capacity;
  const step = (width - 4) / columns;
  for (let i = 0; i < columns; i += 1) {
    const request = state.running.find((item) => item.slot === i);
    d.rect(x + i * step, y + 15, step - 5, 29, "surface", "border", 5);
    if (request)
      d.dot(
        x + i * step + (step - 5) / 2,
        y + 29.5,
        groupInk[request.group] ?? "blue",
        Math.min(8, step / 4),
      );
  }
  return state;
}

const sharedLane = simulatePool([...batch(4, "provider", 3000), ...batch(1, "tick", 250, 500)], 4);
const providerLane = simulatePool(batch(4, "provider", 3000), 3);
const schedulerLane = simulatePool(batch(1, "tick", 250, 500), 1);

export function buildScene(scene: SceneName, progress: number, width = 664): Frame {
  const p = Math.max(0, Math.min(1, progress));
  const d = new Drawing(width);
  if (scene === "symptoms") {
    const horizon = 12000;
    const t = p * horizon;
    ["① 여유 있게 처리", "② 기다림 때문에 느림", "③ CPU가 계속 100%"].forEach((title, i) => {
      const y = 20 + i * 302;
      const ink = i === 0 ? "green" : i === 1 ? "orange" : "red";
      d.rect(10, y - 16, Math.min(width - 20, 185), 30, `${ink}Soft`, undefined, 15);
      d.text(title, 22, y + 4, ink, 14, true);
      const cpu: Point[] = [];
      const delay: Point[] = [];
      for (let j = 0; j <= 60; j += 1) {
        const time = (j * horizon) / 60;
        const ramp = Math.max(0, Math.min(1, (time - 4000) / 3000));
        cpu.push([time, i === 2 ? 22 + 78 * ramp : 22 + Math.sin(j / 6) * 4]);
        delay.push([time, i === 0 ? 0.2 : 0.2 + 4.8 * ramp]);
      }
      plot(d, 10, y + 34, width - 20, 108, "CPU 사용률", cpu, 100, t, horizon, "blue", "%");
      plot(
        d,
        10,
        y + 152,
        width - 20,
        108,
        "작업 하나의 처리 시간",
        delay,
        6,
        t,
        horizon,
        "purple",
        "초",
      );
      d.text(
        [
          "계산과 기다림 모두 짧다",
          "DB·락·풀·외부 응답의 대기를 확인",
          "트래픽·코드·실행 한도를 확인",
        ][i],
        width / 2,
        y + 281,
        ink,
        width < 400 ? 12 : 13,
        true,
        "middle",
      );
    });
    return d.frame(925);
  }
  if (scene === "pool") {
    const t = p * 3500;
    const state = slotRow(d, connectionDemo, t, 15, 25, width - 30, "DB에 연결된 자리 · 상한 8");
    d.text(`사용 중 ${state.running.length} / 8`, 15, 95, "blue", 15, true);
    d.text(`완료 ${state.completed.length}`, width - 15, 95, "green", 14, true, "end");
    d.rect(15, 120, width - 30, 76, "orangeSoft", "border");
    d.text(`풀 밖의 대기 · ${state.waiting.length}개`, 27, 144, "orange", 14, true);
    for (const i of state.waiting.keys()) d.dot(34 + i * 25, 174, "orange", 7);
    d.text(
      `가장 긴 현재 대기 ${seconds(state.maximumWait)}`,
      width - 27,
      182,
      "orange",
      12,
      false,
      "end",
    );
    const samples = connectionDemo.samples.map((sample): Point => [sample.time, sample.waiting]);
    plot(
      d,
      10,
      231,
      width - 20,
      150,
      "연결을 기다리는 작업 수",
      samples,
      4,
      t,
      3500,
      "orange",
      "",
      true,
    );
    d.wrap("연결을 돌려주면 기다리던 작업이 시작된다.", 15, 412, width - 30, "muted", 13);
    return d.frame(450);
  }
  if (scene === "fanout") {
    const layout = panels(width, 2, 390);
    const legend = ["실행 중", "풀 대기", "다음 차례", "완료"];
    const inks: Ink[] = ["blue", "orange", "border", "green"];
    legend.forEach((label, i) => {
      const x = 16 + i * ((width - 24) / 4);
      d.dot(x, 16, inks[i], 4);
      d.text(label, x + 9, 20, "muted", 11);
    });
    const t = p * 4300;
    fanoutComparison.forEach(({ name, simulation }, i) => {
      const { x, y: originY } = layout.boxes[i];
      const y = originY + 38;
      const w = layout.panelWidth;
      const state = poolAt(simulation, t);
      d.text(name, x, y + 5, i === 0 ? "orange" : "green", 14, true);
      ["A", "B", "C", "D"].forEach((group, row) => {
        const yy = y + 39 + row * 40;
        d.rect(x, yy, 46, 28, "surface", "border", 5);
        d.text(group, x + 23, yy + 19, "text", 14, true, "middle");
        d.arrow(x + 48, yy + 14, x + 67, yy + 14);
        simulation.executions
          .filter((item) => item.group === group)
          .forEach((request, j) => {
            const color: Ink =
              request.ended <= t
                ? "green"
                : request.started <= t
                  ? (groupInk[group] ?? "blue")
                  : request.admitted <= t
                    ? "orange"
                    : "border";
            d.dot(x + 82 + j * ((w - 94) / 4), yy + 14, color, 6);
          });
      });
      const status = slotRow(d, simulation, t, x, y + 225, w, "같은 DB 풀 · 8개");
      d.text(
        `사용 중 ${status.running.length} · 풀 대기 ${state.waiting.length}`,
        x,
        y + 302,
        "blue",
        14,
        true,
      );
      d.wrap(
        i === 0 ? "풀에 넣은 요청이 연결을 기다린다." : "남은 요청은 작업 안에서 기다린다.",
        x,
        y + 332,
        w,
        "muted",
        13,
      );
      d.text(
        `시작 전 ${state.pending.length} · 완료 ${state.completed.length}`,
        x,
        y + 374,
        "muted",
        13,
      );
    });
    return d.frame(layout.height + 38);
  }
  if (scene === "event-loop") {
    const layout = panels(width, 2, 460);
    layout.boxes.forEach(({ x, y }, i) => {
      const w = layout.panelWidth;
      const state = eventLoopAt(p, i === 1);
      const stackInk: Ink = state.blocked
        ? "red"
        : state.active === "promise"
          ? "purple"
          : state.active === "timer"
            ? "orange"
            : "blue";
      d.text(
        i === 0 ? "동기 코드가 짧을 때" : "동기 계산이 길어지면",
        x,
        y + 7,
        i === 0 ? "blue" : "red",
        14,
        true,
      );
      d.text("호출 스택 · 지금 실행하는 코드", x, y + 38, "muted", 12, true);
      d.rect(x, y + 49, w, 66, state.active ? `${stackInk}Soft` : "surface", "border");
      d.text(
        state.active === "script"
          ? state.blocked
            ? "긴 계산 실행 중"
            : "동기 코드 실행 중"
          : state.active === "promise"
            ? "Promise 콜백 실행"
            : state.active === "timer"
              ? "타이머 콜백 실행"
              : "비어 있음",
        x + 12,
        y + 76,
        state.active ? stackInk : "muted",
        13,
        true,
      );
      d.text(
        state.blocked
          ? "두 큐의 콜백이 모두 기다린다"
          : state.active
            ? "이 코드가 끝나면 스택이 빈다"
            : "다음 콜백을 실행할 수 있다",
        x + 12,
        y + 100,
        "muted",
        11,
      );
      const queues = [
        {
          yy: y + 159,
          title: "마이크로태스크 큐",
          label: "Promise.then 콜백",
          ready: state.promiseQueued,
          completed: state.promiseCompleted,
          active: state.active === "promise",
          ink: "purple" as const,
        },
        {
          yy: y + 245,
          title: "태스크 큐 · 실행 준비된 타이머",
          label: "setTimeout 콜백",
          ready: state.timerQueued,
          completed: state.timerCompleted,
          active: state.active === "timer",
          ink: "orange" as const,
        },
      ];
      queues.forEach(({ yy, title, label, ready, completed, active, ink }) => {
        d.text(title, x, yy - 12, "muted", 12, true);
        d.rect(x, yy, w - 27, 48, ready ? `${ink}Soft` : "surface", ready ? ink : "border");
        d.text(
          ready
            ? label
            : active
              ? "호출 스택에서 실행 중"
              : completed
                ? "처리 완료 · 큐가 비었다"
                : "아직 등록되지 않음",
          x + 10,
          yy + 29,
          ready || active ? ink : "muted",
          12,
          ready,
        );
        if (active) {
          const rail = x + w - 10;
          d.line(
            [
              [x + w - 27, yy + 24],
              [rail, yy + 24],
              [rail, y + 124],
            ],
            ink,
            2,
          );
          d.arrow(rail, y + 124, rail, y + 115, ink);
          const start = i === 0 ? (ink === "purple" ? 0.24 : 0.38) : ink === "purple" ? 0.68 : 0.82;
          const travel = Math.min(1, Math.max(0, (p - start) / 0.08));
          d.dot(rail, yy + 24 - travel * (yy + 24 - y - 124), ink, 4);
        }
      });
      d.text("콘솔 출력 순서", x, y + 329, "muted", 12, true);
      d.rect(x, y + 340, w, 44, "surface", "border");
      d.text(
        state.output.length ? state.output.join(" → ") : "동기 코드가 끝나기를 기다리는 중",
        x + 10,
        y + 367,
        state.output.length ? "text" : "muted",
        11,
      );
      d.wrap(
        state.blocked
          ? "타이머가 준비돼도 동기 계산이 끝나야 실행할 수 있다."
          : state.promiseCompleted && state.timerCompleted
            ? "동기 코드 → Promise → 타이머 순서로 끝났다."
            : "스택이 비면 마이크로태스크부터 처리하고 다음 태스크로 넘어간다.",
        x,
        y + 414,
        w,
        state.blocked ? "red" : "muted",
        12,
      );
    });
    return d.frame(layout.height);
  }
  if (scene === "parallel") {
    const t = p * 2200;
    const rowHeight = 234;
    parallelComparison.forEach(({ name, simulation }, i) => {
      const y = 16 + i * rowHeight;
      const state = poolAt(simulation, t);
      const screen = simulation.executions.find((request) => request.group === "screen");
      const background = simulation.executions.filter((request) => request.group === "background");
      const last = Math.max(...background.map((request) => request.ended));
      d.text(`${i + 1}. ${name}`, 12, y + 6, i === 2 ? "orange" : "blue", 15, true);
      d.text(
        `DB 풀 점유 ${state.running.length} / 4`,
        width - 12,
        y + 6,
        "muted",
        12,
        false,
        "end",
      );
      const labelWidth = width < 400 ? 68 : 96;
      const xx = labelWidth + 12;
      const ww = width - xx - 18;
      d.rect(xx, y + 34, ww, 86, "surface", "border", 0);
      background.forEach((request) => {
        const fillWidth = (Math.max(0, Math.min(t, request.ended) - request.started) / 2200) * ww;
        const yy = y + 40 + request.slot * 19;
        if (fillWidth > 0)
          d.rect(xx + (request.started / 2200) * ww, yy, fillWidth, 12, "blue", undefined, 2);
      });
      d.text("DB 작업", 12, y + 59, "muted", 13);
      d.text("화면 조회", 12, y + 145, "green", 13, true);
      if (screen) {
        const yy = y + 132;
        const waitEnd = Math.min(t, screen.started);
        if (waitEnd > screen.arrived)
          d.rect(
            xx + (screen.arrived / 2200) * ww,
            yy,
            ((waitEnd - screen.arrived) / 2200) * ww,
            15,
            "orangeSoft",
            "orange",
            2,
          );
        if (t > screen.started)
          d.rect(
            xx + (screen.started / 2200) * ww,
            yy,
            Math.max(3, ((Math.min(t, screen.ended) - screen.started) / 2200) * ww),
            15,
            "green",
            undefined,
            2,
          );
        d.text(
          `화면 조회 ${ms(screen.ended - screen.arrived)}`,
          12,
          y + 192,
          i === 2 ? "orange" : "green",
          14,
          true,
        );
      }
      d.line(
        [
          [xx + (Math.min(t, 2200) / 2200) * ww, y + 28],
          [xx + (Math.min(t, 2200) / 2200) * ww, y + 154],
        ],
        "muted",
        1,
        true,
      );
      d.text("0", xx, y + 173, "muted", 11);
      d.text("2.2초", xx + ww, y + 173, "muted", 11, false, "end");
      d.text(`묶음 완료 ${seconds(last)}`, width - 12, y + 192, "blue", 13, false, "end");
      if (i < 2)
        d.line([
          [12, y + 216],
          [width - 12, y + 216],
        ]);
    });
    return d.frame(718);
  }
  if (scene === "locks") {
    const layout = panels(width, 2, 290);
    const busy = p > 0.16 && p < 0.75;
    layout.boxes.forEach(({ x, y }, i) => {
      const w = layout.panelWidth;
      d.text(
        i === 0 ? "연결을 잡고 기다림" : "락을 못 얻으면 연결 반납",
        x,
        y + 8,
        i === 0 ? "orange" : "green",
        14,
        true,
      );
      d.rect(x, y + 37, w, 41, "blueSoft", "blue");
      d.text("채널 처리 중인 작업 A", x + w / 2, y + 63, "blue", 14, true, "middle");
      ["B", "C", "D"].forEach((name, j) => {
        const yy = y + 101 + j * 37;
        d.rect(
          x,
          yy,
          w,
          28,
          busy ? (i === 0 ? "orangeSoft" : "greenSoft") : "surface",
          "border",
          5,
        );
        d.text(
          `${name} · ${busy ? (i === 0 ? "연결을 쥔 채 락 대기" : "연결 반납 → 나중에 재시도") : "차례 확인"}`,
          x + 10,
          yy + 19,
          busy ? (i === 0 ? "orange" : "green") : "muted",
          13,
        );
      });
      d.text(
        `잡고 있는 연결 ${busy && i === 0 ? 4 : 1}개`,
        x,
        y + 245,
        i === 0 ? "orange" : "green",
        16,
        true,
      );
      d.wrap(
        i === 0
          ? "CPU 사용률이 낮아도 연결은 사용 중이다."
          : "미룬 작업은 큐에 남아 다시 실행된다.",
        x,
        y + 275,
        w,
        "muted",
        13,
      );
    });
    return d.frame(layout.height + 20);
  }
  if (scene === "lanes") {
    const t = p * 3600;
    const layout = panels(width, 2, 340);
    layout.boxes.forEach(({ x, y }, i) => {
      const w = layout.panelWidth;
      d.text(
        i === 0 ? "공용 실행 자리 4개" : "외부 요청 3 + 정기 검사 1",
        x,
        y + 6,
        i === 0 ? "orange" : "green",
        14,
        true,
      );
      const provider = poolAt(i === 0 ? sharedLane : providerLane, t);
      const tick =
        i === 0
          ? sharedLane.executions.find((item) => item.group === "tick")
          : schedulerLane.executions[0];
      for (let j = 0; j < 4; j += 1) {
        const yy = y + 44 + j * 41;
        const request =
          i === 0
            ? provider.running.find((item) => item.slot === j)
            : j < 3
              ? provider.running.find((item) => item.slot === j)
              : tick && tick.started <= t && tick.ended > t
                ? tick
                : undefined;
        const isTick = request?.group === "tick";
        d.rect(x, yy, w, 29, isTick ? "greenSoft" : "surface", "border", 5);
        if (request)
          d.rect(
            x + 4,
            yy + 5,
            (w - 8) * Math.min(1, (t - request.started) / request.duration),
            19,
            isTick ? "greenSoft" : "blueSoft",
            undefined,
            3,
          );
        d.text(
          i === 1 && j === 3 ? "정기 검사 자리" : `실행 자리 ${j + 1}`,
          x + 8,
          yy + 20,
          request ? "text" : "muted",
          12,
        );
      }
      d.text(
        t < 500
          ? "정기 검사: 아직 도착 전"
          : tick && t < tick.started
            ? "정기 검사: 줄에서 대기"
            : tick && t < tick.ended
              ? "정기 검사: 처리 중"
              : "정기 검사: 완료",
        x,
        y + 231,
        i === 0 ? "orange" : "green",
        14,
        true,
      );
      d.text(
        `검사가 기다린 시간 ${i === 0 ? "2.5초" : "0초"}`,
        x,
        y + 269,
        i === 0 ? "orange" : "green",
        17,
        true,
      );
      d.wrap(
        i === 0 ? "긴 작업 네 개가 모든 자리를 차지한다." : "긴 외부 작업과 검사를 나눠 실행한다.",
        x,
        y + 303,
        w,
        "muted",
        13,
      );
    });
    return d.frame(layout.height + 20);
  }
  if (scene === "atomic") {
    const layout = panels(width, 2, 320);
    const rollback = p >= 0.78;
    const committed = p >= 0.22 && !rollback;
    const interrupted = p >= 0.45 && !rollback;
    layout.boxes.forEach(({ x, y }, i) => {
      const w = layout.panelWidth;
      d.text(
        i === 0 ? "DB와 외부 큐에 따로 저장" : "같은 DB 트랜잭션으로 저장",
        x,
        y + 7,
        i === 0 ? "orange" : "green",
        14,
        true,
      );
      d.text(
        rollback ? "② 커밋 전에 실패한 경우" : "① DB 저장 뒤 프로세스 중단",
        x,
        y + 35,
        "muted",
        12,
      );
      if (i === 1) {
        d.rect(x, y + 59, w, 144, "greenSoft", "green", 10, true);
        d.text("같이 확정하거나 같이 취소", x + w / 2, y + 84, "green", 13, true, "middle");
      }
      const rowY = i === 1 ? y + 100 : y + 75;
      d.rect(x + 10, rowY, w - 20, 38, "surface", committed ? "green" : "border");
      d.text(
        `예약 · ${rollback ? "롤백" : committed ? "저장됨" : "저장 중"}`,
        x + 22,
        rowY + 25,
        committed ? "green" : "muted",
        14,
        true,
      );
      if (i === 0)
        d.arrow(x + w / 2, rowY + 43, x + w / 2, rowY + 69, interrupted ? "red" : "muted");
      const secondY = i === 1 ? rowY + 48 : rowY + 77;
      const missing = i === 0 && interrupted;
      d.rect(
        x + 10,
        secondY,
        w - 20,
        38,
        missing ? "redSoft" : "surface",
        missing ? "red" : committed && i === 1 ? "green" : "border",
      );
      d.text(
        `실행할 일 · ${rollback ? "없음" : i === 1 && committed ? "저장됨" : missing ? "등록 못 함" : "아직 미확정"}`,
        x + 22,
        secondY + 25,
        missing ? "red" : i === 1 && committed ? "green" : "muted",
        13,
        true,
      );
      d.wrap(
        rollback
          ? "커밋하지 않았으므로 저장은 취소된다."
          : i === 0
            ? "예약은 남았지만 실행할 작업은 없다."
            : "프로세스가 멈춰도 작업 기록은 남는다.",
        x,
        y + 246,
        w,
        i === 0 && interrupted ? "red" : "muted",
        13,
      );
      if (i === 1)
        d.text(
          rollback ? "예약 0 · 작업 0" : committed ? "예약 1 · 작업 1" : "둘 다 커밋 전",
          x,
          y + 307,
          "green",
          14,
          true,
        );
    });
    return d.frame(layout.height);
  }
  const stacked = width < 540;
  const boxWidth = stacked ? width - 30 : (width - 120) / 2;
  const database = { x: 15, y: 35 };
  const worker = { x: stacked ? 15 : width - boxWidth - 15, y: stacked ? 258 : 35 };
  const offline = p >= 0.15 && p < 0.62;
  const done = p >= 0.9;
  d.rect(database.x, database.y, boxWidth, 155, "surface", "border");
  d.text("PostgreSQL", database.x + 15, database.y + 29, "blue", 16, true);
  d.rect(
    database.x + 12,
    database.y + 49,
    boxWidth - 24,
    44,
    done ? "greenSoft" : "blueSoft",
    done ? "green" : "blue",
  );
  d.text(
    done ? "작업 행 · 처리 완료" : "작업 행 · 저장되어 있음",
    database.x + 23,
    database.y + 77,
    done ? "green" : "blue",
    13,
    true,
  );
  d.text("연결이 끊겨도 행은 남는다", database.x + 15, database.y + 130, "muted", 12);
  d.rect(
    worker.x,
    worker.y,
    boxWidth,
    155,
    offline ? "redSoft" : "surface",
    offline ? "red" : "border",
  );
  d.text("워커", worker.x + 15, worker.y + 29, offline ? "red" : "green", 16, true);
  d.text(
    offline ? "리스너 연결 끊김" : p < 0.15 ? "연결되어 있음" : "연결 복구 · 다시 조회",
    worker.x + 15,
    worker.y + 74,
    offline ? "red" : "green",
    13,
    true,
  );
  d.text(
    offline
      ? "알림을 못 받는 동안"
      : done
        ? "기록을 보고 처리 완료"
        : p >= 0.62
          ? "저장된 행을 발견"
          : "새 작업을 기다림",
    worker.x + 15,
    worker.y + 130,
    "muted",
    12,
  );
  const from: Point = stacked ? [width / 2, database.y + 160] : [database.x + boxWidth + 4, 111];
  const to: Point = stacked ? [width / 2, worker.y - 8] : [worker.x - 7, 111];
  if (p > 0.62) d.arrow(...to, ...from, "green");
  else d.arrow(...from, ...to, offline ? "red" : "blue", offline);
  if (p > 0.62) {
    if (stacked) d.text("조회로 다시 찾기", width / 2 + 12, 232, "green", 12);
    else d.text("조회", width / 2, 137, "green", 12, true, "middle");
  } else if (stacked) d.text("NOTIFY", width / 2 + 12, 229, offline ? "red" : "blue", 12);
  else d.text("알림", width / 2, 94, offline ? "red" : "blue", 12, true, "middle");
  if (offline)
    d.text("×", (from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + 7, "red", 26, true, "middle");
  const footer = stacked ? 451 : 231;
  d.wrap(
    done
      ? "알림을 보관한 것이 아니라, 저장된 작업을 다시 찾았다."
      : "알림은 ‘확인해 봐’라는 신호. 실행할 내용은 작업 행에 있다.",
    15,
    footer,
    width - 30,
    done ? "green" : "muted",
    14,
  );
  return d.frame(footer + 65);
}

export function buildDiagram(kind: DiagramName, width = 664): Frame {
  const d = new Drawing(width);
  if (kind === "transaction") {
    const layout = panels(width, 2, 429);
    layout.boxes.forEach(({ x, y }, i) => {
      const w = layout.panelWidth;
      const divided = i === 1;
      const ink = divided ? "green" : "orange";
      d.text(
        divided ? "HTTP 호출은 트랜잭션 밖에서" : "HTTP 호출도 트랜잭션 안에서",
        x,
        y + 9,
        ink,
        14,
        true,
      );
      if (!divided) {
        d.rect(x, y + 31, w, 278, "orangeSoft", "orange");
        d.text("트랜잭션 시작 → 끝", x + 13, y + 55, "orange", 12, true);
      }
      const rows = [
        ["① 상태 확인 · 10ms", "DB 연결 사용"],
        ["② HTTP 응답 대기 · 3초", divided ? "DB 연결 반환" : "DB 연결 계속 점유"],
        ["③ 결과 저장 · 10ms", "DB 연결 사용"],
      ];
      rows.forEach(([title, detail], j) => {
        const yy = y + 67 + j * 81;
        const rowInk = j === 1 ? (divided ? "green" : "orange") : "blue";
        d.rect(x + 10, yy, w - 20, 66, `${rowInk}Soft`, rowInk, 6);
        d.text(title, x + 22, yy + 25, rowInk, 13, true);
        d.text(detail, x + 22, yy + 48, rowInk, 12);
        if (j < 2) d.arrow(x + w / 2, yy + 68, x + w / 2, yy + 78);
      });
      const noteHeight = d.wrap(
        divided
          ? "짧은 트랜잭션 두 번 · 그 사이에는 연결을 돌려준다."
          : "HTTP 응답을 기다리는 동안 연결과 이미 얻은 락도 유지된다.",
        x,
        y + 337,
        w,
        "muted",
        13,
      );
      d.text(
        divided ? "결과 저장 전 상태 재확인" : "외부 발행은 DB 롤백 대상 아님",
        x,
        y + 337 + noteHeight + 19,
        ink,
        13,
        true,
      );
    });
    return d.frame(layout.height);
  }
  if (kind === "deadlock") {
    const x = 28;
    const w = width - 56;
    const rows = [
      ["A · 부모 행 잠금 보유", "자식 행이 필요하지만 B가 잠갔다."],
      ["B · 자식 행 잠금 보유", "부모 행이 필요하지만 A가 잠갔다."],
    ];
    rows.forEach(([title, detail], i) => {
      const y = 16 + i * 142;
      d.rect(x, y, w, 103, i === 0 ? "blueSoft" : "purpleSoft", i === 0 ? "blue" : "purple");
      d.text(title, x + 13, y + 30, i === 0 ? "blue" : "purple", 14, true);
      d.wrap(detail, x + 13, y + 59, w - 26, "muted", 12);
    });
    d.arrow(width - 16, 67, width - 16, 210, "red");
    d.arrow(16, 210, 16, 67, "red");
    d.text("A는 B를, B는 A를 기다린다", width / 2, 295, "red", 14, true, "middle");
    d.wrap("해결: 두 경로 모두 부모 → 자식 순서로 잠근다.", 28, 330, width - 56, "green", 13);
    return d.frame(383);
  }
  if (kind === "collection") {
    const rows = [
      ["① 이번에 읽을 범위 정하기", "요금제 기간 · API 한도"],
      ["② 외부 SNS에서 가져오기", "페이지 단위 요청 · 응답 기다리기"],
      ["③ 가져온 분량 저장하기", "데이터 + 진행 위치 + 후속 작업 함께 저장"],
      ["④ 다음 작업으로 이어가기", "종료 후 저장한 위치부터 재개"],
    ];
    rows.forEach(([title, detail], i) => {
      const y = 12 + i * 109;
      d.rect(12, y, width - 24, 85, i === 2 ? "greenSoft" : "surface", "border");
      d.text(title, 25, y + 29, i === 2 ? "green" : "blue", 14, true);
      d.wrap(detail, 25, y + 54, width - 50, "muted", 12);
      if (i < 3) d.arrow(width / 2, y + 88, width / 2, y + 105);
    });
    return d.frame(443);
  }
  if (kind === "jobs") {
    const rows = [
      "발행 시각 확인 · 파일 준비",
      "SNS 플랫폼에 게시물 발행",
      "댓글·성과 데이터 수집",
      "SNS 계정 인증 갱신",
      "실패한 작업 다시 처리",
      "오래된 파일·작업 정리",
    ];
    d.rect(15, 15, width - 30, 49, "blueSoft", "blue");
    d.text("사용자 · 게시물 한 개 예약", width / 2, 46, "blue", 16, true, "middle");
    rows.forEach((text, i) => {
      const yy = 101 + i * 53;
      d.line(
        [
          [33, 65],
          [33, yy + 18],
        ],
        "border",
        1.5,
      );
      d.arrow(33, yy + 18, 53, yy + 18);
      d.rect(58, yy, width - 73, 37, "surface", "border");
      d.text(text, 73, yy + 25, "text", 14);
    });
    return d.frame(108 + rows.length * 53);
  }
  if (kind === "experiment") {
    const layout = panels(width, 2, 218);
    layout.boxes.forEach(({ x, y }, i) => {
      const w = layout.panelWidth;
      d.text(
        i === 0 ? "순차 조회" : "두 조회 병렬",
        x,
        y + 6,
        i === 0 ? "green" : "blue",
        15,
        true,
      );
      d.text("reader p95", x, y + 42, "muted", 13);
      d.rect(x, y + 55, w, 23, "surface", "border", 3);
      d.rect(x, y + 55, (w * 23.3) / 30, 23, "purple", undefined, 3);
      d.text("약 23.3ms", x, y + 103, "purple", 18, true);
      d.text("관측 연결", x, y + 143, "muted", 13);
      Array.from({ length: i + 1 }, (_, j) => j).forEach((j) =>
        d.dot(x + 11 + j * 27, y + 170, "blue", 9),
      );
      d.text(`${i + 1}개`, x + 75, y + 176, "blue", 17, true);
      d.text("시간 막대의 상한은 공통 30ms", x, y + 211, "muted", 11);
    });
    return d.frame(layout.height);
  }
  if (kind === "capacity") {
    const scale = (width - 30) / 33;
    const segments: Array<[string, number, Ink]> = [
      ["업무", 18, "blue"],
      ["큐", 4, "purple"],
      ["리스너", 2, "orange"],
      ["여유", 9, "green"],
    ];
    let offset = 15;
    d.text("운영 상한 24 + 작업·점검 여유 9 = 33", 15, 26, "text", width < 400 ? 13 : 16, true);
    segments.forEach(([name, count, ink]) => {
      d.rect(offset, 48, count * scale, 34, ink, undefined, 0);
      offset += count * scale;
      const i = segments.findIndex(([item]) => item === name);
      d.dot(23, 112 + i * 30, ink, 6);
      d.text(`${name} ${count}개`, 40, 117 + i * 30, ink, 14, true);
    });
    d.text("API · 4 + 2 + 1 = 7", 15, 267, "blue", 15, true);
    d.text("워커 · 14 + 2 + 1 = 17", 15, 297, "blue", 15, true);
    d.wrap(
      "마이그레이션 4 + 운영자 점검 5의 여유를 별도로 남긴다.",
      15,
      335,
      width - 30,
      "muted",
      13,
    );
    return d.frame(390);
  }
  const rows = [
    ["Cloudflare Worker", "웹 요청 처리"],
    ["Cloudflare Tunnel", "공개 인바운드 없이 API로 전달"],
    ["EC2 t4g.medium", "API 1개 + 백그라운드 워커 1개"],
    ["RDS db.t4g.small", "업무 데이터 + pg-boss 작업"],
  ];
  rows.forEach(([name, description], i) => {
    const yy = 15 + i * 92;
    d.rect(15, yy, width - 30, 66, i === 3 ? "blueSoft" : "surface", i === 3 ? "blue" : "border");
    d.text(name, width / 2, yy + 27, i === 3 ? "blue" : "text", 16, true, "middle");
    d.text(description, width / 2, yy + 50, "muted", 13, false, "middle");
    if (i < 3) d.arrow(width / 2, yy + 70, width / 2, yy + 86);
  });
  return d.frame(379);
}

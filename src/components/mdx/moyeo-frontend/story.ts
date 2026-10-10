export type SceneName = "leader-tab";
export type Tone = "blue" | "green" | "orange" | "purple" | "red" | "muted";
export interface Card {
  id: string;
  title: string;
  lines: string[];
  tone: Tone;
  window?: boolean;
}
export interface Transfer {
  from: string;
  to: string;
  label: string;
  tone?: Tone;
}
export interface StoryStep {
  title: string;
  detail: string;
  choice?: string;
  cards: Card[];
  active?: string;
  transfers?: Transfer[];
  connections?: Transfer[];
  note?: string;
}

export const scenes = {
  "leader-tab": {
    title: "리더가 SSE 신호를 전달하고 각 탭이 캐시를 갱신한다",
    description: "서버 연결과 탭 사이의 전달 경로를 단계별로 비교해 보세요.",
    previewStep: 0,
  },
} satisfies Record<SceneName, { title: string; description: string; previewStep: number }>;

const server: Card = {
  id: "server",
  title: "서버",
  lines: ["게시 상태 변경", "SSE 변경 신호"],
  tone: "blue",
};
const tabA: Card = {
  id: "a",
  title: "탭 A",
  lines: ["현재 화면", "Query 캐시"],
  tone: "green",
  window: true,
};
const tabB: Card = {
  id: "b",
  title: "탭 B",
  lines: ["다른 화면", "Query 캐시"],
  tone: "purple",
  window: true,
};

const leaderStory: StoryStep[] = [
  {
    choice: "개별 연결",
    title: "1. 각 탭이 서버와 SSE 연결을 만든다",
    detail:
      "같은 계정을 두 탭에서 열면 두 화면이 각각 SSE를 구독할 수 있다. Web Locks나 BroadcastChannel 미지원 환경에서는 이 방식으로 동작한다.",
    cards: [server, tabA, tabB],
    connections: [
      { from: "server", to: "a", label: "" },
      { from: "server", to: "b", label: "" },
    ],
    transfers: [{ from: "server", to: "a", label: "각자 SSE" }],
  },
  {
    choice: "리더 선정",
    title: "2. 잠금을 얻은 리더 탭이 SSE 연결을 맡는다",
    detail:
      "계정별 잠금을 얻은 보이는 탭이 리더가 된다. 다른 탭은 직접 연결하는 대신 같은 계정의 BroadcastChannel에서 변경 신호를 기다린다.",
    cards: [
      server,
      { ...tabA, title: "탭 A · 리더", lines: ["계정별 잠금 보유", "SSE 구독"] },
      { ...tabB, lines: ["SSE 연결 안 함", "공유 신호 대기"] },
    ],
    active: "a",
    connections: [{ from: "server", to: "a", label: "" }],
    transfers: [{ from: "server", to: "a", label: "SSE" }],
  },
  {
    choice: "신호 공유",
    title: "3. 변경 신호를 받은 각 탭이 Query 캐시를 갱신한다",
    detail:
      "리더는 변경 신호를 BroadcastChannel로 전달한다. 각 탭은 변경된 데이터의 Query Key를 무효화하고 필요한 데이터를 다시 조회한다. 서버 데이터나 QueryClient 자체를 탭끼리 공유하는 것은 아니다.",
    cards: [
      server,
      { ...tabA, title: "탭 A · 리더", lines: ["변경 신호 수신", "자기 캐시 갱신"] },
      { ...tabB, lines: ["공유 신호 수신", "자기 캐시 갱신"] },
    ],
    connections: [
      { from: "server", to: "a", label: "" },
      { from: "a", to: "b", label: "" },
    ],
    transfers: [{ from: "a", to: "b", label: "BroadcastChannel" }],
  },
  {
    choice: "리더 인계",
    title: "4. 리더가 숨겨지면 다른 탭이 SSE 연결을 맡는다",
    detail:
      "탭 A가 숨겨지거나 종료되면 잠금을 놓는다. 보이는 탭 B가 잠금을 얻고 새 리더로 SSE를 구독한다. 연결을 만드는 동안 바뀌었을 수 있는 데이터도 다시 조회한다.",
    cards: [
      server,
      { ...tabA, title: "탭 A · 숨김", lines: ["잠금 해제", "리더 구독 종료"], tone: "muted" },
      { ...tabB, title: "탭 B · 새 리더", lines: ["계정별 잠금 획득", "SSE 구독"] },
    ],
    active: "b",
    connections: [{ from: "server", to: "b", label: "" }],
    transfers: [{ from: "server", to: "b", label: "새 리더 연결" }],
  },
  {
    choice: "연결 교체",
    title: "5. 새 SSE 연결의 첫 신호를 받은 뒤 기존 연결을 닫는다",
    detail:
      "리더의 SSE 연결을 교체할 때는 기존 연결을 바로 닫지 않는다. 새 연결의 첫 신호를 확인한 뒤 기존 연결을 닫아 인계 중 신호가 끊기는 구간을 줄인다.",
    cards: [
      {
        id: "old",
        title: "기존 연결",
        lines: ["교체 중 잠시 유지", "첫 신호 뒤 종료"],
        tone: "muted",
      },
      { id: "new", title: "새 연결", lines: ["연결 시작", "첫 신호 확인"], tone: "blue" },
      {
        id: "leader",
        title: "리더 탭",
        lines: ["새 연결로 교체", "변경 신호 공유"],
        tone: "green",
        window: true,
      },
    ],
    connections: [
      { from: "old", to: "leader", label: "" },
      { from: "new", to: "leader", label: "" },
    ],
    transfers: [{ from: "new", to: "leader", label: "첫 신호" }],
    note: "연결 교체 중에는 두 물리 연결이 잠시 겹친다. 모든 순간에 연결이 하나라는 뜻은 아니다.",
  },
];

export function getStory(_scene: SceneName): StoryStep[] {
  return leaderStory;
}

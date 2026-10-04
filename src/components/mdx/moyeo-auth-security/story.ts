export type SceneName = "login" | "cookie" | "ssr" | "devices" | "recovery" | "scale" | "hash";
export type Tone = "blue" | "green" | "orange" | "purple" | "red" | "muted";
export interface Card {
  id: string;
  title: string;
  lines: string[];
  tone: Tone;
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
  cards: Card[];
  active?: string;
  transfer?: Transfer;
  transfers?: Transfer[];
  connections?: Transfer[];
  layout?: "flow" | "devices" | "comparison" | "hash";
  count?: number;
  note: string;
}
interface Definition {
  title: string;
  description: string;
  badge: string;
}
export const scenes: Record<SceneName, Definition> = {
  login: {
    title: "처음에는 비밀번호, 다음부터는 토큰",
    description:
      "브라우저에는 토큰이, DB에는 로그인 기록이 남는다. 다음 요청은 그 기록으로 확인한다.",
    badge: "로그인 → 다음 요청",
  },
  cookie: {
    title: "Set-Cookie는 브라우저까지 돌아와야 한다",
    description:
      "브라우저가 받은 moyeo.io의 응답으로 쿠키가 저장된다. 두 서버 사이에서도 응답 헤더를 전달한다.",
    badge: "실제 로그인 경로",
  },
  ssr: {
    title: "페이지 요청의 쿠키를 API 요청에 이어 준다",
    description:
      "TanStack Start가 받은 Cookie를 NestJS 요청에 직접 넣는다. 서버 fetch가 대신 복사해 주지 않는다.",
    badge: "새로고침 · SSR",
  },
  devices: {
    title: "가장 먼저 로그인한 기기를 내보낼까?",
    description:
      "최근에 사용한 노트북은 남기고, 사용 기록이 가장 오래된 세션을 종료한다. 새 로그인은 성공한다.",
    badge: "활성 세션 최대 5개",
  },
  recovery: {
    title: "쿠키는 남아 있어도 세션은 끝날 수 있다",
    description: "운영자는 DB의 세션을 종료한다. 기존 쿠키로 보낸 다음 요청은 인증되지 않는다.",
    badge: "운영자 로그아웃",
  },
  scale: {
    title: "같은 로그아웃 조치, 다른 다음 요청",
    description:
      "공유 DB 세션과, 아직 유효하고 로그아웃 상태를 따로 조회하지 않는 JWT를 비교한다. 실제 부하 측정은 아니다.",
    badge: "확장 방식 비교",
  },
  hash: {
    title: "동시 해싱이 늘면 메모리 예산도 늘어난다",
    description:
      "한 칸은 64MiB다. 추가 비용을 제외한 설정 기반 계산이며, 실측 사용량이나 실행 한도가 아니다.",
    badge: "Argon2id · 64MiB씩",
  },
};
const card = (id: string, title: string, lines: string[], tone: Tone): Card => ({
  id,
  title,
  lines,
  tone,
});
const step = (
  title: string,
  detail: string,
  cards: Card[],
  extra: Partial<StoryStep> = {},
): StoryStep => ({
  title,
  detail,
  cards,
  note: "",
  ...extra,
});

export interface DemoSession {
  id: string;
  issuedAt: number;
  lastSeenAt: number;
  revoked: boolean;
}
// Minute-based timestamps and illustrative IDs; these never call the product API.
export function addSession(
  sessions: readonly DemoSession[],
  id: string,
  now: number,
  maximum = 5,
): DemoSession[] {
  const active = sessions
    .filter((session) => !session.revoked)
    .toSorted((left, right) => {
      return (
        left.lastSeenAt - right.lastSeenAt ||
        left.issuedAt - right.issuedAt ||
        left.id.localeCompare(right.id)
      );
    });
  const replaceCount = Math.max(0, active.length - maximum + 1);
  const replacedIds = new Set(active.slice(0, replaceCount).map((session) => session.id));
  return [
    ...sessions.map((session) => ({
      ...session,
      revoked: session.revoked || replacedIds.has(session.id),
    })),
    { id, issuedAt: now, lastSeenAt: now, revoked: false },
  ];
}
export function touchSession(
  sessions: readonly DemoSession[],
  id: string,
  now: number,
): DemoSession[] {
  return sessions.map((session) => {
    if (session.id === id && !session.revoked && now - session.lastSeenAt >= 15) {
      return { ...session, lastSeenAt: now };
    }
    return { ...session };
  });
}
export function shouldNotify(input: {
  earlier: boolean;
  recognition: "new" | "known" | "untracked";
  tracked: boolean;
}): boolean {
  return input.earlier && input.recognition === "new" && input.tracked;
}
export function remainingSessions(action: string): string[] {
  if (["reset", "admin", "idle", "absolute"].includes(action)) return [];
  return ["현재"];
}
export function tokenAcceptedAfterRevocation(mode: string): boolean {
  return mode === "jwt-out";
}
export function hashMemoryMiB(concurrency: number): number {
  return 64 * concurrency;
}
const loginCards = (browser: string, api: string, db: string) => [
  card("browser", "브라우저", [browser], "blue"),
  card("api", "NestJS", [api], "orange"),
  card("db", "PostgreSQL", [db], "purple"),
];
function loginStory(): StoryStep[] {
  return [
    step(
      "1. 처음에는 비밀번호를 확인한다",
      "서버가 이메일로 계정을 찾고 비밀번호를 확인한다.",
      loginCards("비밀번호 입력", "비밀번호 확인", "계정 · 비밀번호 해시"),
      { active: "api", transfer: { from: "browser", to: "api", label: "로그인 요청" } },
    ),
    step(
      "2. 서버에 로그인 기록을 만든다",
      "새 토큰과 연결된 세션을 저장한다. 어느 사용자이며 언제 끝나는지 기록한다.",
      loginCards("응답을 기다림", "토큰 발급", "새 세션 저장"),
      { active: "db", transfer: { from: "api", to: "db", label: "로그인 기록" } },
    ),
    step(
      "3. 토큰을 브라우저에 전달한다",
      "브라우저는 전달받은 토큰을 쿠키에 보관한다.",
      loginCards("토큰을 쿠키에 저장", "Set-Cookie 응답", "세션 활성"),
      { active: "browser", transfer: { from: "api", to: "browser", label: "Set-Cookie" } },
    ),
    step(
      "4. 다음 요청에는 쿠키가 붙는다",
      "다음 화면을 열 때는 비밀번호 대신 쿠키의 토큰을 보낸다.",
      loginCards("쿠키의 토큰 전송", "토큰으로 세션 조회", "세션 활성"),
      { active: "api", transfer: { from: "browser", to: "api", label: "Cookie" } },
    ),
    step(
      "5. 같은 사용자의 세션인지 확인한다",
      "DB의 세션이 유효하면 그 사용자의 요청으로 처리한다.",
      loginCards("로그인 상태 유지", "인증 성공", "활성 세션 확인"),
      {
        active: "api",
        transfer: { from: "db", to: "api", label: "세션 조회 결과" },
        note: "다음 요청에는 비밀번호를 다시 보내지 않는다",
      },
    ),
  ];
}
const cookieCards = (browser: string, web: string, api: string) => [
  card("browser", "브라우저", ["moyeo.io", browser], "blue"),
  card("web", "TanStack Start", ["/api/v1 프록시", web], "green"),
  card("api", "NestJS", ["api.moyeo.io", api], "orange"),
];
function cookieStory(): StoryStep[] {
  return [
    step(
      "1. 브라우저는 moyeo.io로 요청한다",
      "웹 페이지와 같은 호스트의 /api/v1 로그인 경로를 호출한다.",
      cookieCards("로그인 요청", "요청 받기", "로그인 처리"),
      { active: "web", transfer: { from: "browser", to: "web", label: "로그인 요청" } },
    ),
    step(
      "2. TanStack Start가 NestJS로 중계한다",
      "서버 라우트가 API 원본에 요청을 전달한다.",
      cookieCards("응답 대기", "API 요청 중계", "비밀번호 확인"),
      { active: "api", transfer: { from: "web", to: "api", label: "로그인 요청" } },
    ),
    step(
      "3. NestJS가 Set-Cookie를 응답한다",
      "로그인 성공 후 세션 토큰을 쿠키로 설정할 응답을 보낸다.",
      cookieCards("응답 대기", "응답 헤더 받기", "로그인 성공"),
      { active: "web", transfer: { from: "api", to: "web", label: "Set-Cookie" } },
    ),
    step(
      "4. 브라우저까지 Set-Cookie를 돌려준다",
      "TanStack Start가 받은 쿠키를 응답에 넣어 브라우저로 보낸다.",
      cookieCards("moyeo.io 쿠키 저장", "응답 헤더 전달", "세션 활성"),
      {
        active: "browser",
        transfer: { from: "web", to: "browser", label: "Set-Cookie" },
        note: "쿠키는 브라우저가 받은 응답의 호스트에 저장된다",
      },
    ),
  ];
}
const ssrCards = (browser: string, web: string, api: string) => [
  card("browser", "브라우저", [browser], "blue"),
  card("web", "TanStack Start", [web], "green"),
  card("api", "NestJS", [api], "orange"),
];
function ssrStory(): StoryStep[] {
  return [
    step(
      "1. 새로고침 요청에도 쿠키가 온다",
      "브라우저가 페이지를 요청하며 저장해 둔 쿠키를 함께 보낸다.",
      ssrCards("페이지 새로고침", "페이지 요청 받기", "API 요청 대기"),
      { active: "web", transfer: { from: "browser", to: "web", label: "페이지 요청 + Cookie" } },
    ),
    step(
      "2. 새 API 요청에 Cookie를 직접 넣는다",
      "TanStack Start가 페이지 요청에서 읽은 Cookie를 API 요청 헤더에 넣는다.",
      ssrCards("HTML 응답 대기", "Cookie를 읽어 전달", "세션 확인"),
      {
        active: "api",
        transfer: { from: "web", to: "api", label: "API 요청 + Cookie" },
        note: "서버의 fetch는 브라우저 쿠키를 자동 복사하지 않는다",
      },
    ),
    step(
      "3. 그 사용자의 데이터를 돌려준다",
      "NestJS는 세션을 확인한 뒤 해당 사용자의 조회 결과를 반환한다.",
      ssrCards("HTML 응답 대기", "조회 결과 받기", "인증 후 조회"),
      { active: "web", transfer: { from: "api", to: "web", label: "사용자 데이터" } },
    ),
    step(
      "4. 데이터로 HTML을 만들어 응답한다",
      "TanStack Start가 그 사용자의 데이터를 담은 페이지를 만든다.",
      ssrCards("로그인된 페이지 표시", "HTML 만들기", "세션 활성"),
      {
        active: "browser",
        transfer: { from: "web", to: "browser", label: "SSR HTML" },
        note: "SSR 서버는 사용자의 localStorage를 읽지 않는다",
      },
    ),
  ];
}
const deviceNames: Record<string, string> = {
  A: "노트북 Chrome",
  B: "휴대전화 Safari",
  C: "노트북 Safari",
  D: "태블릿 Chrome",
  E: "회사 PC Edge",
  F: "새 PC Chrome",
};
function deviceCards(sessions: readonly DemoSession[], pending = false): Card[] {
  const cards = sessions.map((session) =>
    card(
      session.id,
      deviceNames[session.id],
      [
        session.revoked ? "로그인 종료" : "로그인 유지",
        `최근 사용 12:${String(session.lastSeenAt).padStart(2, "0")}`,
      ],
      session.revoked ? "red" : "blue",
    ),
  );
  if (pending) cards.push(card("F", deviceNames.F, ["새 로그인 요청", "아직 생성 전"], "orange"));
  return cards;
}
function devicesStory(): StoryStep[] {
  const initial = Array.from({ length: 5 }, (_, index) => ({
    id: String.fromCharCode(65 + index),
    issuedAt: index,
    lastSeenAt: index,
    revoked: false,
  }));
  const touched = touchSession(initial, "A", 20);
  const replaced = addSession(touched, "F", 21);
  return [
    step(
      "1. 다섯 세션이 로그인돼 있다",
      "첫 로그인은 노트북 Chrome이었다. 최근 기록도 아직 가장 오래됐다.",
      deviceCards(initial),
      { layout: "devices", count: 5 },
    ),
    step(
      "2. 노트북 Chrome을 다시 사용한다",
      "20분 뒤 사용해 최근 기록이 12:20으로 갱신된다.",
      deviceCards(touched),
      { layout: "devices", active: "A", count: 5 },
    ),
    step(
      "3. 새 PC에서 로그인한다",
      "새 세션을 만들기 전, 기존 세션의 최근 사용 기록을 비교한다.",
      deviceCards(touched, true),
      {
        layout: "devices",
        active: "B",
        count: 5,
        note: "지금은 휴대전화 Safari의 사용 기록이 가장 오래됐다",
      },
    ),
    step(
      "4. 오래된 세션을 끝내고 새 로그인을 허용한다",
      "휴대전화 Safari 세션은 종료되고 새 PC가 로그인된다.",
      deviceCards(replaced),
      { layout: "devices", active: "F", count: 5, note: "새 로그인 성공 · 활성 세션 5개 유지" },
    ),
  ];
}
const recoveryCards = (browser: string, api: string, db: string, denied = false) => [
  card("browser", "사용자 브라우저", [browser], "blue"),
  card("api", "NestJS", [api], denied ? "red" : "orange"),
  card("db", "PostgreSQL", [db], denied ? "red" : "purple"),
];
function recoveryStory(): StoryStep[] {
  return [
    step(
      "1. 사용자는 로그인돼 있다",
      "브라우저에 쿠키가 있고 서버의 세션도 유효하다.",
      recoveryCards("쿠키 보관", "요청 인증 가능", "세션 활성"),
    ),
    step(
      "2. 운영자가 모든 기기 로그아웃을 실행한다",
      "권한을 확인한 뒤 DB의 대상 세션들을 종료한다.",
      recoveryCards("쿠키는 그대로", "운영자 조치 처리", "세션 종료", true),
      { active: "db", transfer: { from: "api", to: "db", label: "세션 종료" } },
    ),
    step(
      "3. 기존 쿠키로 다음 요청이 온다",
      "브라우저는 쿠키를 보내지만, 서버는 종료된 기록을 확인한다.",
      recoveryCards("기존 쿠키 전송", "세션 상태 조회", "종료된 세션", true),
      { active: "api", transfer: { from: "browser", to: "api", label: "Cookie" } },
    ),
    step(
      "4. 다음 인증 요청을 거부한다",
      "클라이언트가 세션 종료 응답을 받고 로그인 화면으로 안내한다.",
      recoveryCards("다시 로그인 필요", "인증 거부", "종료된 세션", true),
      {
        active: "browser",
        transfer: { from: "api", to: "browser", label: "세션 종료 응답", tone: "red" },
        note: "쿠키가 남았다는 사실만으로 인증할 수 없다",
      },
    ),
  ];
}
const scaleCards = (revoked: boolean, finished: boolean) => [
  card("db-a", "API A", ["DB 세션 사용"], "orange"),
  card("jwt-a", "API A", ["JWT 발급"], "orange"),
  card("store", "공유 세션 DB", [revoked ? "세션 종료" : "세션 활성"], revoked ? "red" : "purple"),
  card("jwt", "발급된 JWT", ["서명 유효", "아직 만료 전"], "green"),
  card(
    "db-b",
    "API B",
    [finished ? "다음 요청 거부" : "같은 DB 조회"],
    finished ? "red" : "orange",
  ),
  card(
    "jwt-b",
    "API B",
    [finished ? "토큰 검증 통과" : "서명 · 만료 확인"],
    finished ? "green" : "orange",
  ),
];
function scaleStory(): StoryStep[] {
  const connections = [
    { from: "db-a", to: "store", label: "저장" },
    { from: "store", to: "db-b", label: "조회" },
    { from: "jwt-a", to: "jwt", label: "발급" },
    { from: "jwt", to: "jwt-b", label: "검증" },
  ];
  return [
    step(
      "1. 요청을 두 API 서버가 나눠 처리한다",
      "DB 세션은 같은 기록을 조회하고, JWT는 각 서버에서 토큰을 검증한다.",
      scaleCards(false, false),
      { layout: "comparison", connections },
    ),
    step(
      "2. 운영자가 기존 로그인을 끝낸다",
      "공유 DB에는 세션 종료가 기록된다. 이미 발급된 JWT의 내용은 바뀌지 않는다.",
      scaleCards(true, false),
      {
        layout: "comparison",
        connections,
        active: "store",
        note: "JWT는 로그아웃 상태를 따로 조회하지 않는 모델",
      },
    ),
    step(
      "3. 같은 로그인 정보로 API B에 요청한다",
      "DB 세션은 종료 상태를 읽는다. JWT는 토큰의 서명과 만료 등을 확인한다.",
      scaleCards(true, false),
      {
        layout: "comparison",
        connections,
        transfers: [
          { from: "store", to: "db-b", label: "종료 상태", tone: "red" },
          { from: "jwt", to: "jwt-b", label: "유효한 토큰", tone: "green" },
        ],
      },
    ),
    step(
      "4. 다음 요청의 결과가 달라진다",
      "DB 세션은 거부한다. 로그아웃 상태를 조회하지 않는 JWT는 토큰 검증을 통과한다.",
      scaleCards(true, true),
      {
        layout: "comparison",
        connections,
        note: "JWT도 로그아웃 상태를 조회할 수 있지만, 저장소 조회 비용이 생긴다",
      },
    ),
  ];
}
function hashStory(): StoryStep[] {
  return [1, 4, 8, 16].map((count, index) =>
    step(
      `${index + 1}. 해시 ${count}개가 동시에 실행된다면`,
      `64MiB × ${count} = ${hashMemoryMiB(count)}MiB. 비밀번호를 확인하는 데 드는 메모리 예산이다.`,
      [],
      { layout: "hash", count, note: "도착한 요청 수가 아니라 실제로 동시에 실행하는 해시 수" },
    ),
  );
}
export function getStory(scene: SceneName): StoryStep[] {
  switch (scene) {
    case "login":
      return loginStory();
    case "cookie":
      return cookieStory();
    case "ssr":
      return ssrStory();
    case "devices":
      return devicesStory();
    case "recovery":
      return recoveryStory();
    case "scale":
      return scaleStory();
    case "hash":
      return hashStory();
  }
}

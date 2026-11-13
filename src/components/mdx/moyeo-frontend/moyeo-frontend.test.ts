import { expect, it } from "bun:test";

import { z } from "astro/zod";
import ts from "typescript";

import type { Point } from "../moyeo-resource-budget/graphics";
import { buildFrame, centerInScene, sceneHeight } from "./graphics";
import { getStory, scenes, type SceneName, type Transfer } from "./story";

// 본문의 예제 코드를 직접 읽어 실행하므로, 글을 옮기면 이 경로도 함께 바꾼다.
const ARTICLE_URL = new URL(
  "../../../content/post/blog/moyeo-frontend-architecture.mdx",
  import.meta.url,
);

// 글의 예제는 타입 정보 없이 실행되므로, 테스트가 사용하는 모양만 확인해 좁힌다.
const fn = z.custom<(...args: unknown[]) => unknown>((value) => typeof value === "function");
const zodSchema = z.instanceof(z.ZodType);
const tracker = z.object({ track: fn });
const searchQuery = z.object({ q: z.string().optional() });
const listRequest = z.object({
  searchText: z.string().optional(),
  statuses: z.array(z.string()).optional(),
});

const isSceneName = (name: string): name is SceneName => Object.hasOwn(scenes, name);
const routes = (transfers: readonly Transfer[] = []) => transfers.map(({ from, to }) => [from, to]);

it("리더 선정·공유·인계에서 서버 연결과 탭 간 신호를 구분한다", () => {
  const [individual, elected, broadcast, takeover, rotation] = getStory("leader-tab");
  if (!individual || !elected || !broadcast || !takeover || !rotation)
    expect.unreachable("리더 탭 장면에는 다섯 단계가 있어야 한다");
  expect(individual.connections?.filter(({ from }) => from === "server").length).toBe(2);
  expect(routes(elected.connections)).toStrictEqual([["server", "a"]]);
  expect(routes(broadcast.transfers)).toStrictEqual([["a", "b"]]);
  expect(routes(takeover.connections)).toStrictEqual([["server", "b"]]);
  expect(rotation.connections?.length, "연결 교체 중의 중첩도 표시한다").toBe(2);
});

it("모든 단계는 정적 첫 화면과 전체 과정 텍스트를 제공한다", () => {
  expect(Object.keys(scenes)).toStrictEqual(["leader-tab"]);
  for (const scene of Object.keys(scenes).filter(isSceneName)) {
    const definition = scenes[scene];
    const story = getStory(scene);
    expect(definition.previewStep).toBe(0);
    expect(story[definition.previewStep]).toBeTruthy();
    for (const step of story) {
      expect(step.title && step.detail && step.choice).toBeTruthy();
      const ids = new Set(step.cards.map(({ id }) => id));
      expect(ids.size).toBe(step.cards.length);
      for (const transfer of [...(step.transfers ?? []), ...(step.connections ?? [])]) {
        expect(ids.has(transfer.from) && ids.has(transfer.to)).toBeTruthy();
        expect(transfer.from).not.toBe(transfer.to);
      }
    }
  }
});

it("모든 단계는 좁은 화면에서도 겹치지 않고 프레임 안에 머문다", () => {
  for (const scene of Object.keys(scenes).filter(isSceneName)) {
    const story = getStory(scene);
    for (const width of [240, 264, 280, 320, 520, 664, 1000]) {
      const height = sceneHeight(story, width);
      for (const step of story) {
        for (const progress of [0, 0.5, 1]) {
          const frame = centerInScene(buildFrame(step, width, progress), height);
          expect(Number.isFinite(height) && height > 0).toBeTruthy();
          for (const mark of frame.marks) {
            const points: Point[] = mark.kind === "line" ? mark.points : [[mark.x, mark.y]];
            for (const [x, y] of points) {
              expect(Number.isFinite(x) && Number.isFinite(y)).toBeTruthy();
              expect(x >= 0 && x <= width, `${scene}: x=${x}`).toBeTruthy();
              expect(y >= 0 && y <= height, `${scene}: y=${y}`).toBeTruthy();
            }
            if (mark.kind === "rect") {
              expect(mark.x + mark.width <= width + 0.001).toBeTruthy();
              expect(mark.y + mark.height <= height).toBeTruthy();
            }
          }
          const boxes = frame.marks.flatMap((mark) =>
            mark.kind === "rect" && mark.radius === 12 ? [mark] : [],
          );
          boxes.forEach((a, index) =>
            boxes.slice(index + 1).forEach((b) => {
              const overlap =
                a.x < b.x + b.width &&
                b.x < a.x + a.width &&
                a.y < b.y + b.height &&
                b.y < a.y + a.height;
              expect(!overlap, `${scene}/${width}: ${step.title}`).toBeTruthy();
            }),
          );
        }
      }
    }
  }
});

it("본문의 TS·TSX 예제에 문법 오류가 없다", async () => {
  const article = await Bun.file(ARTICLE_URL).text();
  const fences = [...article.matchAll(/^```(\w+)([^\n]*)\n([\s\S]*?)^```/gm)];
  for (const [index, [, language = "", metadata = "", source = ""]] of fences.entries()) {
    let code = source;
    if (language === "tsx" && metadata.includes("snippet")) {
      const jsxStart = source.search(/^</m);
      if (jsxStart >= 0) {
        code =
          source.slice(0, jsxStart) + "\nconst example = <>\n" + source.slice(jsxStart) + "\n</>;";
      }
    }
    if (language !== "ts" && language !== "tsx") continue;
    // transpileModule은 구문 진단만 보고하므로 import 대상이나 타입 선언이 없는 예제도 문법만 검사한다.
    const { diagnostics = [] } = ts.transpileModule(code, {
      fileName: `example-${index}.${language}`,
      reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.Latest },
    });
    expect(
      diagnostics.map(({ messageText }) => ts.flattenDiagnosticMessageText(messageText, "\n")),
      `예제 ${index + 1}`,
    ).toStrictEqual([]);
  }
});

async function readExampleSource(title: string): Promise<string> {
  const article = await Bun.file(ARTICLE_URL).text();
  const blocks = [
    ...article.matchAll(/^```(?:ts|tsx)[^\n]*title="([^"]+)"[^\n]*\n([\s\S]*?)^```/gm),
  ];
  const code = blocks.find((block) => block[1] === title)?.[2];
  if (!code) expect.unreachable(`${title} 예제가 없습니다`);
  return code;
}

async function readExample(
  title: string,
  names: string[],
  bindings: Record<string, unknown> = {},
): Promise<unknown> {
  const code = await readExampleSource(title);
  const { outputText } = ts.transpileModule(
    code
      .replace(/^export /gm, "")
      .replace(/^import \{ (?:z|postStatusSchema) \} from "[^"]+";\n/gm, ""),
    {
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS },
    },
  );
  // oxlint-disable-next-line typescript/no-implied-eval -- 글의 예제 코드를 실제로 실행해 검증한다
  const compiled: unknown = new Function(
    "exports",
    ...Object.keys(bindings),
    `${outputText}\nreturn {${names.join(",")}};`,
  );
  return fn.parse(compiled)({}, ...Object.values(bindings));
}

async function readCreateAnalytics() {
  const { analyticsEventSchema } = z
    .object({ analyticsEventSchema: zodSchema })
    .parse(
      await readExample(
        "analytics-event.ts: 게시 요청 이벤트의 이름과 속성",
        ["analyticsEventSchema"],
        { z },
      ),
    );
  const { createAnalytics } = z.object({ createAnalytics: fn }).parse(
    await readExample("create-analytics.ts: 검증과 전송을 분리한다", ["createAnalytics"], {
      analyticsEventSchema,
    }),
  );
  return (provider: { track: (event: unknown) => unknown }) =>
    tracker.parse(createAnalytics(provider));
}

it("분석 이벤트는 이름별 필수 속성을 검사하고 정의하지 않은 값은 전송하지 않는다", async () => {
  const createAnalytics = await readCreateAnalytics();
  const calls: unknown[] = [];
  const analytics = createAnalytics({ track: (event) => calls.push(event) });
  const valid = [{ name: "post_schedule_submitted", mode: "fixed_time", channelCount: 2 }];

  for (const event of [
    ...valid,
    { name: "post_schedule_submited", mode: "fixed_time", channelCount: 2 },
    { name: "post_schedule_submitted", channelCount: 2 },
    { name: "post_schedule_submitted", mode: "fixed_time" },
    { name: "post_schedule_submitted", mode: "fixed_time", channelCount: 0 },
    { name: "post_schedule_submitted", mode: "fixed_time", channelCount: 1.5 },
    { name: "post_schedule_submitted", mode: "unknown", channelCount: 2 },
    {
      name: "post_schedule_submitted",
      mode: "fixed_time",
      channelCount: 2,
      text: "전송하지 않을 본문",
    },
  ]) {
    analytics.track(event);
  }

  expect(calls).toStrictEqual(valid);
});

it("분석 provider를 바꿔도 같은 이벤트를 사용하고 호출 실패가 제품 동작을 막지 않는다", async () => {
  const createAnalytics = await readCreateAnalytics();
  const event = { name: "post_schedule_submitted", mode: "fixed_time", channelCount: 2 };
  const firstCalls: unknown[] = [];
  const secondCalls: unknown[] = [];
  const first = createAnalytics({ track: (value) => firstCalls.push(value) });
  const second = createAnalytics({ track: (value) => secondCalls.push(value) });
  first.track(event);
  second.track(event);
  expect(firstCalls).toStrictEqual(secondCalls);

  const failing = createAnalytics({
    track() {
      throw new Error("SDK unavailable");
    },
  });
  let continued = false;
  expect(() => {
    failing.track(event);
    continued = true;
  }).not.toThrow();
  expect(continued).toBe(true);
});

it("본문의 복구 정책은 경계 시각·완료·누락·빈 목록을 구분한다", async () => {
  const { PublicationPolicy } = z
    .object({ PublicationPolicy: z.object({ shouldPoll: fn }) })
    .parse(await readExample("After: publication.model.ts에 판단을 모은다", ["PublicationPolicy"]));
  const nowAt = Date.parse("2026-10-10T00:00:00Z");
  const publication = (status: string, offset?: number) => ({
    status,
    schedule: offset == null ? null : { scheduledAt: new Date(nowAt + offset).toISOString() },
  });
  for (const status of ["publishing", "retry_wait", "unconfirmed"]) {
    expect(PublicationPolicy.shouldPoll(publication(status), nowAt)).toBe(true);
  }
  for (const offset of [-1, 0, 119_999]) {
    expect(PublicationPolicy.shouldPoll(publication("scheduled", offset), nowAt)).toBe(true);
  }
  for (const offset of [120_000, 120_001]) {
    expect(PublicationPolicy.shouldPoll(publication("scheduled", offset), nowAt)).toBe(false);
  }
  expect(PublicationPolicy.shouldPoll(publication("scheduled"), nowAt)).toBe(false);
  for (const status of ["published", "failed", "canceled"]) {
    expect(PublicationPolicy.shouldPoll(publication(status, -1), nowAt)).toBe(false);
  }
  expect([].some((item) => PublicationPolicy.shouldPoll(item, nowAt))).toBe(false);
  const source = [publication("published"), publication("scheduled", 1)];
  const original = structuredClone(source);
  expect(source.some((item) => PublicationPolicy.shouldPoll(item, nowAt))).toBe(true);
  expect(source).toStrictEqual(original);
});

function collectSources(file: ts.SourceFile, pick: (node: ts.Node) => ts.Node | undefined) {
  const sources: string[] = [];
  const visit = (node: ts.Node) => {
    const picked = pick(node);
    if (picked) sources.push(picked.getText(file));
    ts.forEachChild(node, visit);
  };
  visit(file);
  return sources;
}

async function readOptionCallback(
  title: string,
  option: string,
  bindings: Record<string, unknown> = {},
) {
  const source = await readExampleSource(title);
  const file = ts.createSourceFile(
    "example.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const callback = collectSources(file, (node) =>
    ts.isPropertyAssignment(node) && node.name.getText(file) === option
      ? node.initializer
      : undefined,
  ).at(-1);
  if (!callback) expect.unreachable(`${option} 콜백이 없습니다`);
  // oxlint-disable-next-line typescript/no-implied-eval -- 글의 예제 코드를 실제로 실행해 검증한다
  const compiled: unknown = new Function(...Object.keys(bindings), `return (${callback});`);
  return fn.parse(fn.parse(compiled)(...Object.values(bindings)));
}

it("URL 검증부터 loader와 화면의 조회 조건까지 빈 값과 초안 조건이 일치한다", async () => {
  const { postsSearchSchema } = z.object({ postsSearchSchema: zodSchema }).parse(
    await readExample("URL에서 허용할 보기와 검색 조건을 정한다", ["postsSearchSchema"], {
      z,
      postStatusSchema: z.enum(["draft", "archived"]),
    }),
  );
  expect(postsSearchSchema.parse({})).toStrictEqual({ view: "channel_posts", status: "all" });
  expect(postsSearchSchema.parse({ view: "unknown", status: "drafft", q: 42 })).toStrictEqual({
    view: "channel_posts",
    status: "all",
    q: undefined,
  });
  expect(searchQuery.parse(postsSearchSchema.parse({ q: "a".repeat(201) })).q).toBe(undefined);

  const title = "loader도 목록과 같은 조건으로 조회한다";
  const loaderDeps = await readOptionCallback(title, "loaderDeps");
  const loader = await readOptionCallback(title, "loader", {
    postListInfiniteOptions: (_orpc: unknown, input: unknown) => input,
  });
  const pageSource = await readExampleSource("After: 제목·검색·목록 순서로 배치한다");
  const pageFile = ts.createSourceFile(
    "page.tsx",
    pageSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const filterSource = collectSources(pageFile, (node) =>
    ts.isJsxAttribute(node) &&
    node.name.getText(pageFile) === "filters" &&
    node.initializer &&
    ts.isJsxExpression(node.initializer)
      ? node.initializer.expression
      : undefined,
  ).at(-1);
  if (!filterSource) expect.unreachable("페이지의 실제 PostList 조회 조건을 검사한다");
  // oxlint-disable-next-line typescript/no-implied-eval -- 글의 예제 코드를 실제로 실행해 검증한다
  const compiledFilters: unknown = new Function("query", "status", `return (${filterSource});`);
  const pageFilters = fn.parse(compiledFilters);
  for (const q of [undefined, "", "   ", " 신메뉴 "]) {
    for (const status of ["all", "draft"]) {
      const search = postsSearchSchema.parse({ view: "posts", q, status });
      expect(searchQuery.parse(search).q, "검증은 입력 중 공백을 지우지 않는다").toBe(q);
      const requests: unknown[] = [];
      // oxlint-disable-next-line no-await-in-loop -- 조건별 요청을 수집해 각각 검증한다.
      await loader({
        context: {
          orpc: {},
          queryClient: { infiniteQuery: (input: unknown) => requests.push(input) },
        },
        params: { workspaceId: "workspace-1" },
        deps: loaderDeps({ search }),
      });
      expect(requests).toStrictEqual([
        {
          workspaceId: "workspace-1",
          ...z.record(z.string(), z.unknown()).parse(pageFilters(q ?? "", status)),
          limit: 20,
        },
      ]);
      const { searchText, statuses } = listRequest.parse(requests[0]);
      expect(searchText).toBe(q?.trim() || undefined);
      expect(statuses).toStrictEqual(status === "all" ? undefined : ["draft"]);
    }
  }
  await loader({
    context: {
      queryClient: { infiniteQuery: () => expect.unreachable("다른 보기는 조회하지 않는다") },
    },
    params: { workspaceId: "workspace-1" },
    deps: loaderDeps({ search: postsSearchSchema.parse({}) }),
  });
});

it("목록의 select는 페이지 순서대로 게시물을 꺼내고 원본 페이지 정보를 보존한다", async () => {
  const { selectPosts } = z.object({ selectPosts: fn }).parse(
    await readExample("After: select로 목록에서 읽을 형태를 정한다", ["selectPosts"], {
      useSuspenseInfiniteQuery: () => ({}),
      postListInfiniteOptions: () => ({}),
      orpc: {},
      workspaceId: "workspace-1",
      filters: {},
      pageSize: 20,
    }),
  );
  const first = Object.freeze({ id: "post-1", text: "신메뉴 안내" });
  const second = Object.freeze({ id: "post-2", text: "신메뉴 출시" });
  const data = Object.freeze({
    pages: Object.freeze([
      Object.freeze({ items: Object.freeze([first]), nextCursor: "cursor-2" }),
      Object.freeze({ items: Object.freeze([second]), nextCursor: null }),
    ]),
    pageParams: Object.freeze([undefined, "cursor-2"]),
  });
  const original = structuredClone(data);
  expect(selectPosts(data)).toStrictEqual([first, second]);
  const [firstPost] = z.array(z.unknown()).parse(selectPosts(data));
  expect(firstPost).toBe(first);
  expect(selectPosts({ pages: [{ items: [] }], pageParams: [undefined] })).toStrictEqual([]);
  expect(data).toStrictEqual(original);
});

it("검색 상태만 바꾸면 검색어와 훅이 소유하지 않는 URL 값도 유지한다", async () => {
  const updateSearch = await readOptionCallback("검색어와 보기는 유지하고 상태만 바꾼다", "search");
  const previous = Object.freeze({
    view: "posts",
    q: "신메뉴 ",
    status: "all",
    selectedPostId: "post-1",
  });
  expect(updateSearch(previous)).toStrictEqual({ ...previous, status: "draft" });
  expect(previous.status).toBe("all");
});

it("본문의 AI 응답 적용 조건은 이후 편집과 채널 이동을 보호한다", async () => {
  const { resolveSuggestedText } = z
    .object({ resolveSuggestedText: fn })
    .parse(
      await readExample("After: 요청 당시의 초안과 같을 때만 제안을 적용한다", [
        "resolveSuggestedText",
      ]),
    );
  const requested = { text: "원문", channelId: "a" };
  expect(resolveSuggestedText(requested, { ...requested }, "제안")).toBe("제안");
  expect(resolveSuggestedText(requested, { ...requested, text: "편집 중" }, "제안")).toBe(
    "편집 중",
  );
  expect(resolveSuggestedText(requested, { ...requested, channelId: "b" }, "제안")).toBe("원문");
});

it("뉴욕의 중복 시각 도식에 사용한 두 UTC 시점은 같은 현지 01:30이다", () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const earlier = Date.parse("2026-11-01T05:30:00Z");
  const later = Date.parse("2026-11-01T06:30:00Z");
  expect(formatter.format(earlier)).toBe("01:30");
  expect(formatter.format(later)).toBe("01:30");
  expect(later - earlier).toBe(3_600_000);
});

it("금액 예제는 빈 값·0원·표시 문자·자릿수 제한을 구분한다", async () => {
  const { parseAmountText } = z
    .object({ parseAmountText: fn })
    .parse(await readExample("입력을 지운 것과 0원을 구분한다", ["parseAmountText"]));
  const cases: Array<[string, number | null]> = [
    ["", null],
    ["원", null],
    ["0", 0],
    ["12,900원", 12900],
    [" 1 200 ", 1200],
    ["9".repeat(20), 999999999999],
  ];
  for (const [input, expected] of cases) {
    expect(parseAmountText(input)).toBe(expected);
  }
});

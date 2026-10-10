import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { it } from "node:test";
import ts from "typescript";
import { z } from "astro/zod";
import { getStory, scenes } from "../../src/components/mdx/moyeo-frontend/story.ts";
import {
  buildFrame,
  centerInScene,
  sceneHeight,
} from "../../src/components/mdx/moyeo-frontend/graphics.ts";

it("리더 선정·공유·인계에서 서버 연결과 탭 간 신호를 구분한다", () => {
  const [individual, elected, broadcast, takeover, rotation] = getStory("leader-tab");
  assert.equal(individual.connections.filter(({ from }) => from === "server").length, 2);
  assert.deepEqual(
    elected.connections.map(({ from, to }) => [from, to]),
    [["server", "a"]],
  );
  assert.deepEqual(
    broadcast.transfers.map(({ from, to }) => [from, to]),
    [["a", "b"]],
  );
  assert.deepEqual(
    takeover.connections.map(({ from, to }) => [from, to]),
    [["server", "b"]],
  );
  assert.equal(rotation.connections.length, 2, "연결 교체 중의 중첩도 표시한다");
});

it("모든 단계는 정적 첫 화면과 전체 과정 텍스트를 제공한다", () => {
  assert.deepEqual(Object.keys(scenes), ["leader-tab"]);
  for (const [scene, definition] of Object.entries(scenes)) {
    const story = getStory(scene);
    assert.equal(definition.previewStep, 0);
    assert(story[definition.previewStep]);
    for (const step of story) {
      assert(step.title && step.detail && step.choice);
      const ids = new Set(step.cards.map(({ id }) => id));
      assert.equal(ids.size, step.cards.length);
      for (const transfer of [...(step.transfers ?? []), ...(step.connections ?? [])]) {
        assert(ids.has(transfer.from) && ids.has(transfer.to));
        assert.notEqual(transfer.from, transfer.to);
      }
    }
  }
});

it("모든 단계는 좁은 화면에서도 겹치지 않고 프레임 안에 머문다", () => {
  for (const scene of Object.keys(scenes)) {
    const story = getStory(scene);
    for (const width of [240, 264, 280, 320, 520, 664, 1000]) {
      const height = sceneHeight(story, width);
      for (const step of story) {
        for (const progress of [0, 0.5, 1]) {
          const frame = centerInScene(buildFrame(step, width, progress), height);
          assert(Number.isFinite(height) && height > 0);
          for (const mark of frame.marks) {
            const points = mark.kind === "line" ? mark.points : [[mark.x, mark.y]];
            for (const [x, y] of points) {
              assert(Number.isFinite(x) && Number.isFinite(y));
              assert(x >= 0 && x <= width, `${scene}: x=${x}`);
              assert(y >= 0 && y <= height, `${scene}: y=${y}`);
            }
            if (mark.kind === "rect") {
              assert(mark.x + mark.width <= width + 0.001);
              assert(mark.y + mark.height <= height);
            }
          }
          const boxes = frame.marks.filter((mark) => mark.kind === "rect" && mark.radius === 12);
          boxes.forEach((a, index) =>
            boxes.slice(index + 1).forEach((b) => {
              const overlap =
                a.x < b.x + b.width &&
                b.x < a.x + a.width &&
                a.y < b.y + b.height &&
                b.y < a.y + a.height;
              assert(!overlap, `${scene}/${width}: ${step.title}`);
            }),
          );
        }
      }
    }
  }
});

it("본문의 TS·TSX 예제에 문법 오류가 없다", async () => {
  const article = await readFile(
    new URL("../../src/content/post/blog/moyeo-frontend-architecture.mdx", import.meta.url),
    "utf8",
  );
  const fences = [...article.matchAll(/^```(\w+)([^\n]*)\n([\s\S]*?)^```/gm)];
  for (const [index, [, language, metadata, source]] of fences.entries()) {
    let code = source;
    if (language === "tsx" && metadata.includes("snippet")) {
      const jsxStart = source.search(/^</m);
      if (jsxStart >= 0) {
        code =
          source.slice(0, jsxStart) + "\nconst example = <>\n" + source.slice(jsxStart) + "\n</>;";
      }
    }
    if (language !== "ts" && language !== "tsx") continue;
    const file = ts.createSourceFile(
      `example-${index}.${language}`,
      code,
      ts.ScriptTarget.Latest,
      true,
      language === "tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    assert.deepEqual(
      file.parseDiagnostics.map(({ messageText }) => messageText),
      [],
      `예제 ${index + 1}`,
    );
  }
});

async function readExampleSource(title) {
  const article = await readFile(
    new URL("../../src/content/post/blog/moyeo-frontend-architecture.mdx", import.meta.url),
    "utf8",
  );
  const blocks = [
    ...article.matchAll(/^```(?:ts|tsx)[^\n]*title="([^"]+)"[^\n]*\n([\s\S]*?)^```/gm),
  ];
  const code = blocks.find((block) => block[1] === title)?.[2];
  assert(code, `${title} 예제가 없습니다`);
  return code;
}

async function readExample(title, names, bindings = {}) {
  const code = await readExampleSource(title);
  const { outputText } = ts.transpileModule(
    code
      .replace(/^export /gm, "")
      .replace(/^import \{ (?:z|postStatusSchema) \} from "[^"]+";\n/gm, ""),
    {
      compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS },
    },
  );
  return new Function(
    "exports",
    ...Object.keys(bindings),
    `${outputText}\nreturn {${names.join(",")}};`,
  )({}, ...Object.values(bindings));
}

async function readAnalyticsExamples() {
  const { analyticsEventSchema } = await readExample(
    "analytics-event.ts: 게시 요청 이벤트의 이름과 속성",
    ["analyticsEventSchema"],
    { z },
  );
  return readExample("create-analytics.ts: 검증과 전송을 분리한다", ["createAnalytics"], {
    analyticsEventSchema,
  });
}

it("분석 이벤트는 이름별 필수 속성을 검사하고 정의하지 않은 값은 전송하지 않는다", async () => {
  const { createAnalytics } = await readAnalyticsExamples();
  const calls = [];
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

  assert.deepEqual(calls, valid);
});

it("분석 provider를 바꿔도 같은 이벤트를 사용하고 호출 실패가 제품 동작을 막지 않는다", async () => {
  const { createAnalytics } = await readAnalyticsExamples();
  const event = { name: "post_schedule_submitted", mode: "fixed_time", channelCount: 2 };
  const firstCalls = [];
  const secondCalls = [];
  const first = createAnalytics({ track: (value) => firstCalls.push(value) });
  const second = createAnalytics({ track: (value) => secondCalls.push(value) });
  first.track(event);
  second.track(event);
  assert.deepEqual(firstCalls, secondCalls);

  const failing = createAnalytics({
    track() {
      throw new Error("SDK unavailable");
    },
  });
  let continued = false;
  assert.doesNotThrow(() => {
    failing.track(event);
    continued = true;
  });
  assert.equal(continued, true);
});

it("본문의 복구 정책은 경계 시각·완료·누락·빈 목록을 구분한다", async () => {
  const { PublicationPolicy } = await readExample("After: publication.model.ts에 판단을 모은다", [
    "PublicationPolicy",
  ]);
  const nowAt = Date.parse("2026-10-10T00:00:00Z");
  const publication = (status, offset) => ({
    status,
    schedule: offset == null ? null : { scheduledAt: new Date(nowAt + offset).toISOString() },
  });
  for (const status of ["publishing", "retry_wait", "unconfirmed"]) {
    assert.equal(PublicationPolicy.shouldPoll(publication(status), nowAt), true);
  }
  for (const offset of [-1, 0, 119_999]) {
    assert.equal(PublicationPolicy.shouldPoll(publication("scheduled", offset), nowAt), true);
  }
  for (const offset of [120_000, 120_001]) {
    assert.equal(PublicationPolicy.shouldPoll(publication("scheduled", offset), nowAt), false);
  }
  assert.equal(PublicationPolicy.shouldPoll(publication("scheduled"), nowAt), false);
  for (const status of ["published", "failed", "canceled"]) {
    assert.equal(PublicationPolicy.shouldPoll(publication(status, -1), nowAt), false);
  }
  assert.equal(
    [].some((item) => PublicationPolicy.shouldPoll(item, nowAt)),
    false,
  );
  const source = [publication("published"), publication("scheduled", 1)];
  const original = structuredClone(source);
  assert.equal(
    source.some((item) => PublicationPolicy.shouldPoll(item, nowAt)),
    true,
  );
  assert.deepEqual(source, original);
});

async function readOptionCallback(title, option, bindings = {}) {
  const source = await readExampleSource(title);
  const file = ts.createSourceFile(
    "example.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let callback;
  function visit(node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === option) {
      callback = node.initializer.getText(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert(callback, `${option} 콜백이 없습니다`);
  return new Function(...Object.keys(bindings), `return (${callback});`)(
    ...Object.values(bindings),
  );
}

it("URL 검증부터 loader와 화면의 조회 조건까지 빈 값과 초안 조건이 일치한다", async () => {
  const { postsSearchSchema } = await readExample(
    "URL에서 허용할 보기와 검색 조건을 정한다",
    ["postsSearchSchema"],
    { z, postStatusSchema: z.enum(["draft", "archived"]) },
  );
  assert.deepEqual(postsSearchSchema.parse({}), { view: "channel_posts", status: "all" });
  assert.deepEqual(postsSearchSchema.parse({ view: "unknown", status: "drafft", q: 42 }), {
    view: "channel_posts",
    status: "all",
    q: undefined,
  });
  assert.equal(postsSearchSchema.parse({ q: "a".repeat(201) }).q, undefined);

  const title = "loader도 목록과 같은 조건으로 조회한다";
  const loaderDeps = await readOptionCallback(title, "loaderDeps");
  const loader = await readOptionCallback(title, "loader", {
    postListInfiniteOptions: (_orpc, input) => input,
  });
  const pageSource = await readExampleSource("After: 제목·검색·목록 순서로 배치한다");
  const pageFile = ts.createSourceFile(
    "page.tsx",
    pageSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let filterSource;
  function findFilters(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(pageFile) === "filters") {
      filterSource = node.initializer.expression.getText(pageFile);
    }
    ts.forEachChild(node, findFilters);
  }
  findFilters(pageFile);
  assert(filterSource, "페이지의 실제 PostList 조회 조건을 검사한다");
  const pageFilters = new Function("query", "status", `return (${filterSource});`);
  for (const q of [undefined, "", "   ", " 신메뉴 "]) {
    for (const status of ["all", "draft"]) {
      const search = postsSearchSchema.parse({ view: "posts", q, status });
      assert.equal(search.q, q, "검증은 입력 중 공백을 지우지 않는다");
      const requests = [];
      // eslint-disable-next-line no-await-in-loop -- 조건별 요청을 수집해 각각 검증한다.
      await loader({
        context: { orpc: {}, queryClient: { infiniteQuery: (input) => requests.push(input) } },
        params: { workspaceId: "workspace-1" },
        deps: loaderDeps({ search }),
      });
      assert.deepEqual(requests, [
        {
          workspaceId: "workspace-1",
          ...pageFilters(q ?? "", status),
          limit: 20,
        },
      ]);
      assert.equal(requests[0].searchText, q?.trim() || undefined);
      assert.deepEqual(requests[0].statuses, status === "all" ? undefined : ["draft"]);
    }
  }
  await loader({
    context: { queryClient: { infiniteQuery: () => assert.fail("다른 보기는 조회하지 않는다") } },
    params: { workspaceId: "workspace-1" },
    deps: loaderDeps({ search: postsSearchSchema.parse({}) }),
  });
});

it("목록의 select는 페이지 순서대로 게시물을 꺼내고 원본 페이지 정보를 보존한다", async () => {
  const { selectPosts } = await readExample(
    "After: select로 목록에서 읽을 형태를 정한다",
    ["selectPosts"],
    {
      useSuspenseInfiniteQuery: () => ({}),
      postListInfiniteOptions: () => ({}),
      orpc: {},
      workspaceId: "workspace-1",
      filters: {},
      pageSize: 20,
    },
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
  assert.deepEqual(selectPosts(data), [first, second]);
  assert.equal(selectPosts(data)[0], first);
  assert.deepEqual(selectPosts({ pages: [{ items: [] }], pageParams: [undefined] }), []);
  assert.deepEqual(data, original);
});

it("검색 상태만 바꾸면 검색어와 훅이 소유하지 않는 URL 값도 유지한다", async () => {
  const updateSearch = await readOptionCallback("검색어와 보기는 유지하고 상태만 바꾼다", "search");
  const previous = Object.freeze({
    view: "posts",
    q: "신메뉴 ",
    status: "all",
    selectedPostId: "post-1",
  });
  assert.deepEqual(updateSearch(previous), { ...previous, status: "draft" });
  assert.equal(previous.status, "all");
});

it("본문의 AI 응답 적용 조건은 이후 편집과 채널 이동을 보호한다", async () => {
  const { resolveSuggestedText } = await readExample(
    "After: 요청 당시의 초안과 같을 때만 제안을 적용한다",
    ["resolveSuggestedText"],
  );
  const requested = { text: "원문", channelId: "a" };
  assert.equal(resolveSuggestedText(requested, { ...requested }, "제안"), "제안");
  assert.equal(
    resolveSuggestedText(requested, { ...requested, text: "편집 중" }, "제안"),
    "편집 중",
  );
  assert.equal(resolveSuggestedText(requested, { ...requested, channelId: "b" }, "제안"), "원문");
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
  assert.equal(formatter.format(earlier), "01:30");
  assert.equal(formatter.format(later), "01:30");
  assert.equal(later - earlier, 3_600_000);
});

it("금액 예제는 빈 값·0원·표시 문자·자릿수 제한을 구분한다", async () => {
  const { parseAmountText } = await readExample("입력을 지운 것과 0원을 구분한다", [
    "parseAmountText",
  ]);
  for (const [input, expected] of [
    ["", null],
    ["원", null],
    ["0", 0],
    ["12,900원", 12900],
    [" 1 200 ", 1200],
    ["9".repeat(20), 999999999999],
  ]) {
    assert.equal(parseAmountText(input), expected);
  }
});

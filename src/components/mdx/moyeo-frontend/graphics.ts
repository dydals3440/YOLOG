import type { Frame, Ink, Mark, Point } from "../moyeo-resource-budget/graphics";
import type { Card, StoryStep, Tone } from "./story";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
const padding = 12;
const ink = (tone: Tone): Ink => (tone === "muted" ? "muted" : tone);
const soft = (tone: Tone): Ink => (tone === "muted" ? "surface" : `${tone}Soft`);
const text = (
  x: number,
  y: number,
  value: string,
  size = 14,
  color: Ink = "text",
  bold = false,
  align: "start" | "middle" | "end" = "middle",
): Mark => ({ kind: "text", x, y, text: value, size, ink: color, bold, align });
const line = (points: Point[], stroke: Ink = "border", width = 2, dash = false): Mark => ({
  kind: "line",
  points,
  stroke,
  width,
  dash,
});
const estimate = (value: string, size: number) =>
  Array.from(value).reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? size : size * 0.56), 0);
function wrap(value: string, width: number, size: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of value.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimate(candidate, size) <= width) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = "";
    for (const char of Array.from(word)) {
      if (current && estimate(current + char, size) > width) {
        lines.push(current);
        current = "";
      }
      current += char;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}
const chrome = (card: Card) => (card.window ? 20 : 0);
const measure = (card: Card, width: number) =>
  wrap(card.title, width - 24, 15).length * 22 +
  card.lines.flatMap((value) => wrap(value, width - 24, 13)).length * 20 +
  36 +
  chrome(card);
// 좁은 화면에서 줄바꿈이 늘어도 글자가 카드 밖으로 나가지 않게 높이를 키운다.
const fit = (cards: Card[], width: number, base: number) =>
  Math.max(base, ...cards.map((card) => measure(card, width)));
function drawCard(marks: Mark[], card: Card, box: Box, active: boolean) {
  marks.push({ kind: "rect", ...box, radius: 12, fill: soft(card.tone), stroke: ink(card.tone) });
  if (active)
    marks.push({
      kind: "rect",
      x: box.x + 4,
      y: box.y + 4,
      width: box.width - 8,
      height: box.height - 8,
      radius: 9,
      fill: soft(card.tone),
      stroke: ink(card.tone),
      dash: true,
    });
  const top = chrome(card);
  if (top) {
    for (let index = 0; index < 3; index++)
      marks.push({
        kind: "circle",
        x: box.x + 16 + index * 10,
        y: box.y + 11,
        radius: 2.5,
        fill: ink(card.tone),
      });
    marks.push(
      line(
        [
          [box.x + 8, box.y + top],
          [box.x + box.width - 8, box.y + top],
        ],
        ink(card.tone),
        1,
      ),
    );
  }
  const titles = wrap(card.title, box.width - 24, 15);
  const body = card.lines.flatMap((value) => wrap(value, box.width - 24, 13));
  const total = titles.length * 22 + body.length * 20 + 8;
  let y = box.y + top + (box.height - top - total) / 2 + 17;
  for (const value of titles) {
    marks.push(text(box.x + box.width / 2, y, value, 15, ink(card.tone), true));
    y += 22;
  }
  y += 8;
  for (const value of body) {
    marks.push(text(box.x + box.width / 2, y, value, 13));
    y += 20;
  }
}
function caption(
  marks: Mark[],
  value: string,
  x: number,
  y: number,
  width: number,
  color: Ink,
  align: "start" | "middle" | "end",
  frameWidth: number,
  upward = false,
) {
  const lines = wrap(value, width, 13);
  const widest = Math.max(0, ...lines.map((item) => estimate(item, 13)));
  const anchor =
    align === "middle"
      ? Math.max(widest / 2 + padding, Math.min(frameWidth - widest / 2 - padding, x))
      : x;
  lines.forEach((item, index) =>
    marks.push(
      text(
        anchor,
        y + (upward ? index - lines.length + 1 : index) * 17,
        item,
        13,
        color,
        true,
        align,
      ),
    ),
  );
}
function arrow(marks: Mark[], points: Point[], color: Ink, progress: number, active: boolean) {
  marks.push(line(points, color, active ? 2.5 : 1.5, !active));
  const end = points[points.length - 1];
  const tail = points[points.length - 2];
  const angle = Math.atan2(end[1] - tail[1], end[0] - tail[0]);
  marks.push(
    line(
      [
        [end[0] - 6 * Math.cos(angle - 0.5), end[1] - 6 * Math.sin(angle - 0.5)],
        end,
        [end[0] - 6 * Math.cos(angle + 0.5), end[1] - 6 * Math.sin(angle + 0.5)],
      ],
      color,
      2,
    ),
  );
  if (!active) return;
  const lengths = points
    .slice(1)
    .map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  let distance =
    Math.max(0, Math.min(1, progress)) * lengths.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < lengths.length; index++) {
    if (distance <= lengths[index] || index === lengths.length - 1) {
      const fraction = lengths[index] ? distance / lengths[index] : 0;
      marks.push({
        kind: "circle",
        x: points[index][0] + (points[index + 1][0] - points[index][0]) * fraction,
        y: points[index][1] + (points[index + 1][1] - points[index][1]) * fraction,
        radius: 6,
        fill: color,
        stroke: "background",
      });
      break;
    }
    distance -= lengths[index];
  }
}
function connect(
  marks: Mark[],
  from: Box,
  to: Box,
  color: Ink,
  progress: number,
  active: boolean,
  label: string,
  frameWidth: number,
  under = false,
) {
  if (Math.abs(from.y - to.y) < 10) {
    const forward = from.x < to.x;
    const a: Point = [from.x + (forward ? from.width : 0), from.y + from.height / 2];
    const b: Point = [to.x + (forward ? 0 : to.width), to.y + to.height / 2];
    const adjacent = Math.abs(from.x - to.x) <= Math.max(from.width, to.width) + 29;
    if (!active && adjacent) return arrow(marks, [a, b], color, progress, false);
    const level = under ? from.y + from.height + 22 : from.y - 22;
    const offset = forward ? 10 : -10;
    arrow(
      marks,
      [
        a,
        [a[0] + offset, a[1]],
        [a[0] + offset, level],
        [b[0] - offset, level],
        [b[0] - offset, b[1]],
        b,
      ],
      color,
      progress,
      active,
    );
    const y = under ? level + 17 : level - 9;
    const width = Math.min(frameWidth - 24, 230);
    caption(marks, label, (a[0] + b[0]) / 2, y, width, color, "middle", frameWidth, !under);
    return;
  }
  // 사이에 카드가 있으면 가운데를 지나지 않고 왼쪽 여백으로 돌아간다.
  if (Math.abs(to.y - from.y) > from.height + 80) {
    const x = Math.max(4, from.x - 6);
    const start = from.y + from.height / 2;
    const end = to.y + to.height / 2;
    arrow(
      marks,
      [
        [from.x, start],
        [x, start],
        [x, end],
        [to.x, end],
      ],
      color,
      progress,
      active,
    );
    if (label)
      caption(marks, label, to.x + 4, to.y - 10, to.width, color, "start", frameWidth, true);
    return;
  }
  const forward = from.y < to.y;
  const a: Point = [from.x + from.width / 2, from.y + (forward ? from.height : 0)];
  const b: Point = [to.x + to.width / 2, to.y + (forward ? 0 : to.height)];
  const middle = (a[1] + b[1]) / 2;
  arrow(marks, [a, [a[0], middle], [b[0], middle], b], color, progress, active);
  if (!label) return;
  const x = a[0] + 12;
  const width = Math.max(44, Math.min(frameWidth - padding, to.x + to.width) - x - 4);
  const lines = wrap(label, width, 13).length;
  caption(marks, label, x, middle - (lines - 1) * 8 + 4, width, color, "start", frameWidth);
}
function grid(cards: Card[], width: number, top: number, narrow: boolean, boxes: Map<string, Box>) {
  const columns = narrow ? 1 : Math.min(4, Math.max(1, cards.length));
  const gap = narrow ? 66 : 28;
  const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
  const cardHeight = fit(cards, cardWidth, narrow ? 112 : 142);
  cards.forEach((card, index) =>
    boxes.set(card.id, {
      x: padding + (index % columns) * (cardWidth + gap),
      y: top + Math.floor(index / columns) * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    }),
  );
  return top + Math.ceil(cards.length / columns) * (cardHeight + gap) - gap;
}
export function buildFrame(step: StoryStep, width: number, progress = 1): Frame {
  const marks: Mark[] = [];
  const narrow = width < 540;
  const boxes = new Map<string, Box>();
  const height = grid(step.cards, width, 66, narrow, boxes) + 16;
  const route = (
    transfer: { from: string; to: string; label: string },
    color: Ink,
    active: boolean,
  ) => {
    const from = boxes.get(transfer.from);
    const to = boxes.get(transfer.to);
    if (from && to)
      connect(marks, from, to, color, progress, active, active ? transfer.label : "", width);
  };
  const connections =
    step.connections ??
    step.cards.slice(1).map((card, index) => ({
      from: step.cards[index].id,
      to: card.id,
      label: "",
    }));
  for (const connection of connections) route(connection, "border", false);
  for (const card of step.cards) {
    const box = boxes.get(card.id);
    if (box) drawCard(marks, card, box, step.active === card.id);
  }
  const transfers = step.transfers ?? [];
  for (const transfer of transfers)
    route(transfer, transfer.tone ? ink(transfer.tone) : "orange", true);
  return { width, height, marks };
}
// 단계마다 높이가 달라 재생 중 본문이 밀리지 않도록 장면에서 가장 높은 단계에 맞춘다.
export function sceneHeight(story: StoryStep[], width: number): number {
  return Math.max(...story.map((step) => buildFrame(step, width).height));
}
// 낮은 단계가 장면 높이를 채울 때 그림이 위로 쏠려 아래가 비지 않도록 세로 가운데에 둔다.
export function centerInScene(frame: Frame, height: number): Frame {
  const dy = Math.floor((height - frame.height) / 2);
  if (dy <= 0) return { ...frame, height };
  const marks = frame.marks.map((mark): Mark =>
    mark.kind === "line"
      ? { ...mark, points: mark.points.map(([x, y]): Point => [x, y + dy]) }
      : { ...mark, y: mark.y + dy },
  );
  return { width: frame.width, height, marks };
}

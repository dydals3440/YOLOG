import type { Frame, Ink, Mark, Point } from "../moyeo-resource-budget/graphics";
import type { Card, StoryStep, Tone, Transfer } from "./story";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
const ink = (tone: Tone): Ink => (tone === "muted" ? "muted" : tone);
const soft = (tone: Tone): Ink => (tone === "muted" ? "surface" : `${tone}Soft`);
const text = (
  x: number,
  y: number,
  value: string,
  size = 14,
  color: Ink = "text",
  bold = false,
  align: "start" | "middle" = "middle",
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
  const titles = wrap(card.title, box.width - 24, 15);
  const body = card.lines.flatMap((value) => wrap(value, box.width - 24, 13));
  const total = titles.length * 22 + body.length * 20 + 8;
  let y = box.y + (box.height - total) / 2 + 17;
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
function connect(
  marks: Mark[],
  from: Box,
  to: Box,
  color: Ink,
  progress: number,
  active: boolean,
  label = "",
  frameWidth = 664,
) {
  const horizontal = Math.abs(from.y - to.y) < 10;
  let points: Point[];
  if (horizontal) {
    const forward = from.x < to.x;
    const a: Point = [from.x + (forward ? from.width : 0), from.y + from.height / 2];
    const b: Point = [to.x + (forward ? 0 : to.width), to.y + to.height / 2];
    if (active) {
      const level = from.y - 22;
      const offset = forward ? 10 : -10;
      points = [
        a,
        [a[0] + offset, a[1]],
        [a[0] + offset, level],
        [b[0] - offset, level],
        [b[0] - offset, b[1]],
        b,
      ];
      const labelWidth = Math.min(frameWidth - 24, 230);
      const labelX = Math.max(
        labelWidth / 2 + 12,
        Math.min(frameWidth - labelWidth / 2 - 12, (a[0] + b[0]) / 2),
      );
      wrap(label, labelWidth, 13).forEach((value, index) =>
        marks.push(text(labelX, level - 9 - index * 17, value, 13, color, true)),
      );
    } else points = [a, b];
  } else {
    const forward = from.y < to.y;
    const a: Point = [from.x + from.width / 2, from.y + (forward ? from.height : 0)];
    const b: Point = [to.x + to.width / 2, to.y + (forward ? 0 : to.height)];
    const middle = (a[1] + b[1]) / 2;
    points = [a, [a[0], middle], [b[0], middle], b];
    if (label) {
      const x = a[0] + 12;
      const lines = wrap(label, Math.max(44, frameWidth - x - 12), 13);
      lines.forEach((value, index) =>
        marks.push(
          text(
            x,
            middle - (lines.length - 1) * 8 + index * 17 + 4,
            value,
            13,
            color,
            active,
            "start",
          ),
        ),
      );
    }
  }
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
export function buildFrame(step: StoryStep, width: number, progress = 1): Frame {
  const marks: Mark[] = [];
  const narrow = width < 540;
  const padding = 12;
  const boxes = new Map<string, Box>();
  let height = 240;
  if (step.layout === "hash") {
    const count = step.count ?? 1;
    marks.push(text(width / 2, 28, "동시 실행 중인 해시", 15, "orange", true));
    const columns = narrow ? 4 : 8;
    const gap = 8;
    const cellWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
    for (let index = 0; index < 16; index++) {
      const x = padding + (index % columns) * (cellWidth + gap);
      const y = 54 + Math.floor(index / columns) * 60;
      const active = index < count;
      marks.push({
        kind: "rect",
        x,
        y,
        width: cellWidth,
        height: 48,
        radius: 8,
        fill: active ? "orangeSoft" : "surface",
        stroke: active ? "orange" : "border",
        dash: !active,
      });
      if (active) marks.push(text(x + cellWidth / 2, y + 29, "64MiB", 12, "orange", true));
    }
    height = narrow ? 350 : 230;
    marks.push(
      text(width / 2, height - 20, `${count} × 64MiB = ${count * 64}MiB`, 16, "orange", true),
    );
  } else if (step.layout === "devices") {
    const columns = narrow ? 2 : 3;
    const gap = 12;
    const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
    const cardHeight = narrow ? 150 : 128;
    step.cards.forEach((card, index) =>
      boxes.set(card.id, {
        x: padding + (index % columns) * (cardWidth + gap),
        y: 48 + Math.floor(index / columns) * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight,
      }),
    );
    height = 48 + 3 * (cardHeight + gap); // Reserve the sixth slot, so login never shifts the page.
    if (!narrow) height = 48 + 2 * (cardHeight + gap);
    marks.push(text(width / 2, 25, `활성 세션 ${step.count ?? 5}개 / 최대 5개`, 15, "blue", true));
  } else if (step.layout === "comparison") {
    const columns = narrow ? 2 : 3;
    const gap = narrow ? 14 : 24;
    const cardWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
    const cardHeight = narrow ? 132 : 108;
    step.cards.forEach((card, index) => {
      const lane = index % 2;
      const stage = Math.floor(index / 2);
      boxes.set(card.id, {
        x: padding + (narrow ? lane : stage) * (cardWidth + gap),
        y: narrow ? 72 + stage * 188 : 80 + lane * 204,
        width: cardWidth,
        height: cardHeight,
      });
    });
    height = narrow ? 584 : 410;
    marks.push(
      text(narrow ? padding + cardWidth / 2 : width / 2, 26, "공유 DB 세션", 14, "purple", true),
    );
    const jwtHeading = wrap("철회 조회 없는 JWT", narrow ? cardWidth : width - 24, 13);
    jwtHeading.forEach((value, index) =>
      marks.push(
        text(
          narrow ? padding + cardWidth + gap + cardWidth / 2 : width / 2,
          (narrow ? 26 : 230) + index * 17,
          value,
          13,
          "green",
          true,
        ),
      ),
    );
    marks.push(
      narrow
        ? line(
            [
              [width / 2, 45],
              [width / 2, height - 8],
            ],
            "border",
            1,
            true,
          )
        : line(
            [
              [12, 210],
              [width - 12, 210],
            ],
            "border",
            1,
            true,
          ),
    );
  } else {
    const columns = narrow ? 1 : Math.min(4, step.cards.length);
    const gap = narrow ? 66 : 28;
    const cardWidth = (width - padding * 2 - gap * (columns - 1)) / Math.max(1, columns);
    const cardHeight = narrow ? 112 : 142;
    step.cards.forEach((card, index) =>
      boxes.set(card.id, {
        x: padding + (index % columns) * (cardWidth + gap),
        y: 66 + Math.floor(index / columns) * (cardHeight + gap),
        width: cardWidth,
        height: cardHeight,
      }),
    );
    height =
      66 + Math.ceil(step.cards.length / Math.max(1, columns)) * (cardHeight + gap) - gap + 16;
  }
  const connections: Transfer[] =
    step.connections ??
    (step.layout === "flow" || !step.layout
      ? step.cards
          .slice(1)
          .map((card, index) => ({ from: step.cards[index].id, to: card.id, label: "" }))
      : []);
  for (const connection of connections) {
    const from = boxes.get(connection.from);
    const to = boxes.get(connection.to);
    if (from && to) connect(marks, from, to, "border", 1, false, "", width);
  }
  for (const card of step.cards) {
    const box = boxes.get(card.id);
    if (box) drawCard(marks, card, box, step.active === card.id);
  }
  const transfers = step.transfers ?? (step.transfer ? [step.transfer] : []);
  for (const transfer of transfers) {
    const from = boxes.get(transfer.from);
    const to = boxes.get(transfer.to);
    if (from && to)
      connect(
        marks,
        from,
        to,
        transfer.tone ? ink(transfer.tone) : "orange",
        progress,
        true,
        transfer.label,
        width,
      );
  }
  return { width, height, marks };
}

export type Ink =
  | "text"
  | "muted"
  | "border"
  | "surface"
  | "background"
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "red"
  | "blueSoft"
  | "greenSoft"
  | "orangeSoft"
  | "purpleSoft"
  | "redSoft";
export type Palette = Record<Ink, string>;
export type Point = [number, number];
export type Mark =
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
      fill: Ink;
      stroke?: Ink;
      dash?: boolean;
    }
  | { kind: "line"; points: Point[]; stroke?: Ink; fill?: Ink; width?: number; dash?: boolean }
  | { kind: "circle"; x: number; y: number; radius: number; fill: Ink; stroke?: Ink }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      size: number;
      ink: Ink;
      bold?: boolean;
      align?: "start" | "middle" | "end";
    };

export interface Frame {
  width: number;
  height: number;
  marks: Mark[];
}

export const palettes: Record<"light" | "dark", Palette> = {
  light: {
    text: "#334155",
    muted: "#606d7c",
    border: "#d8e0e8",
    surface: "#f6f8fa",
    background: "#ffffff",
    blue: "#1d73be",
    green: "#237c4c",
    orange: "#ac5b10",
    purple: "#7952bc",
    red: "#cf4146",
    blueSoft: "#eaf3fb",
    greenSoft: "#eaf5ee",
    orangeSoft: "#fcf2e7",
    purpleSoft: "#f0ebf8",
    redSoft: "#fdf0f0",
  },
  dark: {
    text: "#e2e8f0",
    muted: "#aab7c7",
    border: "#404c5b",
    surface: "#202935",
    background: "#171e28",
    blue: "#7bbcf4",
    green: "#83cfaa",
    orange: "#f1b06c",
    purple: "#bea5f2",
    red: "#ff969b",
    blueSoft: "#25384b",
    greenSoft: "#263b33",
    orangeSoft: "#423325",
    purpleSoft: "#343049",
    redSoft: "#442a33",
  },
};

const token = (ink: Ink) => `var(--mr-${ink})`;

export function FrameSvg({ frame, className }: { frame: Frame; className?: string }) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {frame.marks.map((mark, index) => {
        // Order is stable within a frame; these stateless primitives have no item identity.
        const key = `${mark.kind}-${index}`;
        if (mark.kind === "rect")
          return (
            <rect
              key={key}
              x={mark.x}
              y={mark.y}
              width={mark.width}
              height={mark.height}
              rx={mark.radius}
              fill={token(mark.fill)}
              stroke={mark.stroke ? token(mark.stroke) : undefined}
              strokeDasharray={mark.dash ? "5 5" : undefined}
            />
          );
        if (mark.kind === "circle")
          return (
            <circle
              key={key}
              cx={mark.x}
              cy={mark.y}
              r={mark.radius}
              fill={token(mark.fill)}
              stroke={mark.stroke ? token(mark.stroke) : undefined}
              strokeWidth={mark.stroke ? 2 : undefined}
            />
          );
        if (mark.kind === "line")
          return (
            <polyline
              key={key}
              points={mark.points.map((point) => point.join(",")).join(" ")}
              fill={mark.fill ? token(mark.fill) : "none"}
              stroke={mark.stroke ? token(mark.stroke) : undefined}
              strokeWidth={mark.width ?? 1}
              strokeDasharray={mark.dash ? "5 5" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        return (
          <text
            key={key}
            x={mark.x}
            y={mark.y}
            fill={token(mark.ink)}
            fontSize={mark.size}
            fontWeight={mark.bold ? 650 : 400}
            textAnchor={mark.align ?? "start"}
            fontFamily="sans-serif"
          >
            {mark.text}
          </text>
        );
      })}
    </svg>
  );
}

export function paintFrame(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  palette: Palette,
  dpr: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, frame.width, frame.height);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const mark of frame.marks) {
    if (mark.kind === "text") {
      ctx.font = `${mark.bold ? 650 : 400} ${mark.size}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = mark.align === "middle" ? "center" : mark.align === "end" ? "right" : "left";
      ctx.fillStyle = palette[mark.ink];
      ctx.fillText(mark.text, mark.x, mark.y);
      continue;
    }
    ctx.beginPath();
    ctx.setLineDash("dash" in mark && mark.dash ? [5, 5] : []);
    if (mark.kind === "rect") ctx.roundRect(mark.x, mark.y, mark.width, mark.height, mark.radius);
    else if (mark.kind === "circle") ctx.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
    else
      mark.points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    if (mark.fill) {
      ctx.fillStyle = palette[mark.fill];
      ctx.fill();
    }
    if (mark.stroke && !(mark.kind === "line" && mark.width === 0)) {
      ctx.strokeStyle = palette[mark.stroke];
      ctx.lineWidth = mark.kind === "line" ? (mark.width ?? 1) : mark.kind === "circle" ? 2 : 1;
      ctx.stroke();
    }
  }
}

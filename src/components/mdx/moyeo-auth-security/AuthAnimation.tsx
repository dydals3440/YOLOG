import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FrameSvg, paintFrame, palettes, type Palette } from "../moyeo-resource-budget/graphics";
import { buildFrame } from "./graphics";
import { getStory, scenes, type SceneName } from "./story";

export default function AuthAnimation({ scene }: { scene: SceneName }) {
  const definition = scenes[scene];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [revision, setRevision] = useState(0);
  const figureRef = useRef<HTMLElement>(null);
  const graphicRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clock = useRef({ identity: "", elapsed: 0, started: false });
  const titleId = useId();
  const story = useMemo(() => getStory(scene), [scene]);
  const autoStarted = useRef(false);
  const current = story[index];
  const snapshot = story[story.length - 1];

  useEffect(() => {
    const figure = figureRef.current;
    const graphic = graphicRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!figure || !graphic || !canvas || !ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let visible = false;
    const identity = `${scene}:${index}:${revision}`;
    if (clock.current.identity !== identity) {
      clock.current = { identity, elapsed: 0, started: false };
    }
    if (playing) clock.current.started = true;
    let elapsed = clock.current.elapsed;
    let previous = 0;
    let frameId = 0;
    let disposed = false;
    let finished = false;
    let painted = false;
    let palette = palettes.light;
    const readPalette = () => {
      const style = getComputedStyle(figure);
      palette = Object.fromEntries(
        Object.keys(palettes.light).map((name) => [
          name,
          style.getPropertyValue(`--mr-${name}`).trim(),
        ]),
      ) as Palette;
    };
    const draw = (progress: number) => {
      if (!width) return;
      const frame = buildFrame(current, width, progress);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(frame.height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      canvas.style.height = `${frame.height}px`;
      paintFrame(ctx, frame, palette, dpr);
      if (!painted) {
        painted = true;
        setReady(true);
      }
    };
    const tick = (now: number) => {
      frameId = 0;
      if (disposed) return;
      const active = playing && visible && !document.hidden && !motion.matches && !finished;
      if (active && previous) {
        elapsed += Math.min(80, now - previous);
        clock.current.elapsed = elapsed;
      }
      previous = active ? now : 0;
      draw(!motion.matches && clock.current.started ? Math.min(1, elapsed / 2400) : 1);
      if (active && elapsed >= 2400) {
        finished = true;
        if (index === story.length - 1) setPlaying(false);
        else setIndex((value) => value + 1);
      } else if (active) frameId = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!disposed && !frameId) frameId = requestAnimationFrame(tick);
    };
    const viewport = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (visible && !autoStarted.current && !motion.matches) {
          autoStarted.current = true;
          setPlaying(true);
        }
        previous = 0;
        if (!visible && frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
        wake();
      },
      { threshold: [0, 0.5] },
    );
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      wake();
    });
    const theme = new MutationObserver(() => {
      readPalette();
      wake();
    });
    const onMotion = () => {
      setReduced(motion.matches);
      if (motion.matches) setPlaying(false);
      previous = 0;
      wake();
    };
    const onVisibility = () => {
      previous = 0;
      wake();
    };
    readPalette();
    viewport.observe(graphic);
    resize.observe(graphic);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    setReduced(motion.matches);
    void document.fonts.ready.then(() => {
      if (!disposed) wake();
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      viewport.disconnect();
      resize.disconnect();
      theme.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [current, index, playing, revision, scene, story.length]);

  const display = ready ? current : snapshot;
  const moveTo = (nextIndex: number) => {
    autoStarted.current = true;
    clock.current = { identity: "", elapsed: 0, started: false };
    setRevision((value) => value + 1);
    setPlaying(false);
    setIndex(nextIndex);
  };
  const play = () => {
    autoStarted.current = true;
    if (index === story.length - 1 && !playing) {
      clock.current = { identity: "", elapsed: 0, started: false };
      setRevision((value) => value + 1);
      setIndex(0);
    }
    setPlaying(!playing);
  };
  return (
    <figure
      ref={figureRef}
      className={`ma-demo${ready ? " is-ready" : ""}`}
      data-scene={scene}
      aria-labelledby={titleId}
    >
      <div className="ma-heading">
        <strong id={titleId}>{definition.title}</strong>
        <span>{definition.badge}</span>
      </div>
      <div className="ma-graphic" ref={graphicRef}>
        <div className="ma-fallback">
          <FrameSvg frame={buildFrame(snapshot, 664)} className="ma-desktop" />
          <FrameSvg frame={buildFrame(snapshot, 320)} className="ma-mobile" />
        </div>
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <div className="ma-status" aria-live={playing ? "off" : "polite"} aria-atomic="true">
        <span className="ma-step">{ready ? `${index + 1} / ${story.length}` : "과정 요약"}</span>
        <strong>{display.title}</strong>
        <p>{display.detail}</p>
        {display.note && <span className="ma-note">{display.note}</span>}
      </div>
      <div className="ma-controls">
        <span>{reduced ? "단계별로 살펴보기" : "한 번 재생한 뒤 결과에서 멈춥니다"}</span>
        <button type="button" disabled={!ready || index === 0} onClick={() => moveTo(index - 1)}>
          이전
        </button>
        <button type="button" disabled={!ready || reduced} onClick={play} aria-pressed={playing}>
          {playing ? "일시정지" : index === story.length - 1 ? "다시 보기" : "재생"}
        </button>
        <button
          type="button"
          disabled={!ready || index === story.length - 1}
          onClick={() => moveTo(index + 1)}
        >
          다음
        </button>
      </div>
      <details className="ma-transcript">
        <summary>전체 과정을 글로 보기</summary>
        <ol>
          {story.map((item) => (
            <li key={`${scene}-${item.title}`}>
              <strong>{item.title.replace(/^\d+\.\s*/, "")}</strong>
              <p>{item.detail}</p>
            </li>
          ))}
        </ol>
      </details>
      <figcaption>{definition.description}</figcaption>
    </figure>
  );
}

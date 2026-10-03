import { useEffect, useRef, useState } from "react";
import { FrameSvg, paintFrame, palettes, type Palette } from "./graphics";
import { buildScene, scenes, type SceneName } from "./scenes";

export default function ResourceAnimation({ scene }: { scene: SceneName }) {
  const definition = scenes[scene];
  const figureRef = useRef<HTMLElement>(null);
  const graphicRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useRef({ paused: false, restart: false });
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const figure = figureRef.current;
    const graphic = graphicRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!figure || !graphic || !canvas || !ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let elapsed = 0;
    let previous = 0;
    let frameId = 0;
    let width = 0;
    let visible = false;
    let disposed = false;
    let firstFramePainted = false;
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
    const draw = () => {
      if (!width) return;
      const progress = motion.matches
        ? definition.snapshot
        : Math.min(1, (elapsed % (definition.duration + 2)) / definition.duration);
      const frame = buildScene(scene, progress, width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(frame.height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(frame.height * dpr);
      }
      canvas.style.height = `${frame.height}px`;
      paintFrame(ctx, frame, palette, dpr);
      if (!firstFramePainted) {
        firstFramePainted = true;
        setReady(true);
      }
    };
    const animate = (now: number) => {
      frameId = 0;
      if (disposed) return;
      if (player.current.restart) {
        elapsed = 0;
        previous = 0;
        player.current.restart = false;
      }
      const active = visible && !document.hidden && !player.current.paused && !motion.matches;
      if (active && previous) elapsed += Math.min(0.1, (now - previous) / 1000);
      previous = active ? now : 0;
      draw();
      if (active) frameId = requestAnimationFrame(animate);
    };
    const wake = () => {
      if (!disposed && !frameId) frameId = requestAnimationFrame(animate);
    };
    const viewport = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        previous = 0;
        if (!visible && frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
        wake();
      },
      { threshold: 0.05 },
    );
    const resize = new ResizeObserver(([entry]) => {
      if (width !== entry.contentRect.width) {
        width = entry.contentRect.width;
        wake();
      }
    });
    const onTheme = () => {
      readPalette();
      wake();
    };
    const theme = new MutationObserver(onTheme);
    const onMotion = () => {
      setReduced(motion.matches);
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
    figure.addEventListener("moyeo-playback", wake);
    void document.fonts.ready.then(() => {
      if (!disposed) wake();
    });
    setReduced(motion.matches);
    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      viewport.disconnect();
      resize.disconnect();
      theme.disconnect();
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      figure.removeEventListener("moyeo-playback", wake);
    };
  }, [scene, definition.duration, definition.snapshot]);

  const toggle = () => {
    player.current.paused = !paused;
    setPaused(!paused);
    figureRef.current?.dispatchEvent(new Event("moyeo-playback"));
  };
  const replay = () => {
    player.current = { paused: false, restart: true };
    setPaused(false);
    figureRef.current?.dispatchEvent(new Event("moyeo-playback"));
  };
  return (
    <figure ref={figureRef} data-scene={scene} className={`moyeo-demo${ready ? " is-ready" : ""}`}>
      <div className="mr-heading">
        <strong>{definition.title}</strong>
        <span>개념 예시</span>
      </div>
      <div className="mr-graphic" ref={graphicRef}>
        <div className="mr-fallback">
          <FrameSvg frame={buildScene(scene, definition.snapshot, 664)} className="mr-desktop" />
          <FrameSvg frame={buildScene(scene, definition.snapshot, 320)} className="mr-mobile" />
        </div>
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <div className="mr-controls">
        {reduced && <span>동작 줄이기 설정에 따라 정지 그림으로 표시합니다.</span>}
        <button type="button" disabled={!ready || reduced} onClick={toggle} aria-pressed={paused}>
          {paused ? "재생" : "일시정지"}
        </button>
        <button type="button" disabled={!ready || reduced} onClick={replay}>
          다시 보기
        </button>
      </div>
      <figcaption className="mr-description">{definition.description}</figcaption>
    </figure>
  );
}

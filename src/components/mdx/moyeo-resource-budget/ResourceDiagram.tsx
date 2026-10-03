import { FrameSvg } from "./graphics";
import { buildDiagram, diagrams, type DiagramName } from "./scenes";

export default function ResourceDiagram({ kind }: { kind: DiagramName }) {
  const definition = diagrams[kind];
  return (
    <figure className="moyeo-demo" data-diagram={kind}>
      <div className="mr-heading">
        <strong>{definition.title}</strong>
        <span>
          {kind === "experiment"
            ? "실제 측정"
            : kind === "transaction" || kind === "deadlock"
              ? "개념 예시"
              : kind === "jobs" || kind === "collection" || kind === "freshness"
                ? "동작 흐름"
                : "현재 설정"}
        </span>
      </div>
      <div className="mr-graphic">
        <FrameSvg frame={buildDiagram(kind, 664)} className="mr-desktop" />
        <FrameSvg frame={buildDiagram(kind, 320)} className="mr-mobile" />
      </div>
      <figcaption className="mr-description">{definition.description}</figcaption>
    </figure>
  );
}

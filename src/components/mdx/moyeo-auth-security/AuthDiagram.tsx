import { FrameSvg } from "../moyeo-resource-budget/graphics";
import { buildFrame } from "./graphics";
import type { StoryStep } from "./story";

const diagrams: Record<
  "security" | "infra",
  { title: string; description: string; step: StoryStep }
> = {
  security: {
    title: "로그인 상태와 요청의 출처를 각각 확인한다",
    description:
      "NestJS는 세션, 변경 요청의 출처, 작업 권한을 확인한다. 쿠키 하나만 보고 변경을 허용하지 않는다.",
    step: {
      title: "변경 요청 확인",
      detail: "",
      note: "",
      cards: [
        { id: "browser", title: "브라우저", lines: ["쿠키를 포함한", "변경 요청"], tone: "blue" },
        {
          id: "api",
          title: "NestJS",
          lines: ["세션 유효성", "Origin · 요청 헤더", "사용자 작업 권한"],
          tone: "orange",
        },
        {
          id: "action",
          title: "작업 실행",
          lines: ["필요한 검사를", "통과한 요청"],
          tone: "green",
        },
      ],
    },
  },
  infra: {
    title: "인터넷에서 DB까지 곧바로 들어갈 수 없게",
    description:
      "웹 요청은 TanStack Start와 공개 API 도메인을 거친다. API는 Tunnel로 EC2에 연결하고 DB는 앱 보안 그룹만 허용한다.",
    step: {
      title: "운영 요청 경로",
      detail: "",
      note: "",
      cards: [
        { id: "browser", title: "브라우저", lines: ["moyeo.io"], tone: "blue" },
        {
          id: "edge",
          title: "Cloudflare",
          lines: ["TanStack Start", "API 도메인 · Tunnel"],
          tone: "green",
        },
        {
          id: "api",
          title: "NestJS · EC2",
          lines: ["직접 인바운드 차단", "세션 · 권한 확인"],
          tone: "orange",
        },
        {
          id: "db",
          title: "비공개 RDS",
          lines: ["앱에서만 접속", "세션 데이터 저장"],
          tone: "purple",
        },
      ],
    },
  },
};
export default function AuthDiagram({ kind }: { kind: "security" | "infra" }) {
  const diagram = diagrams[kind];
  return (
    <figure className="ma-demo ma-static">
      <div className="ma-heading">
        <strong>{diagram.title}</strong>
      </div>
      <div className="ma-graphic">
        <FrameSvg frame={buildFrame(diagram.step, 664)} className="ma-desktop" />
        <FrameSvg frame={buildFrame(diagram.step, 320)} className="ma-mobile" />
      </div>
      <figcaption>{diagram.description}</figcaption>
    </figure>
  );
}

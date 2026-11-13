export type VercelEnvironment = "production" | "preview" | "development";

/** Vercel 운영 배포(또는 Vercel 밖의 운영 빌드)에서만 분석·광고 스크립트를 넣는다. */
export function isProductionDeployment({
  isProductionBuild,
  vercelEnvironment,
}: {
  isProductionBuild: boolean;
  vercelEnvironment?: VercelEnvironment | undefined;
}) {
  return (
    isProductionBuild && (vercelEnvironment === undefined || vercelEnvironment === "production")
  );
}

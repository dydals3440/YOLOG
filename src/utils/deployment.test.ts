import { describe, expect, it } from "bun:test";

import { isProductionDeployment } from "./deployment";

describe("isProductionDeployment", () => {
  it("Vercel 운영 배포면 true를 반환한다", () => {
    // When
    const result = isProductionDeployment({
      isProductionBuild: true,
      vercelEnvironment: "production",
    });

    // Then
    expect(result).toBe(true);
  });

  it("Vercel 밖의 운영 빌드면 true를 반환한다", () => {
    // When
    const result = isProductionDeployment({ isProductionBuild: true });

    // Then
    expect(result).toBe(true);
  });

  it("Vercel 미리보기 배포면 false를 반환한다", () => {
    // When
    const result = isProductionDeployment({
      isProductionBuild: true,
      vercelEnvironment: "preview",
    });

    // Then
    expect(result).toBe(false);
  });

  it("개발 서버면 false를 반환한다", () => {
    // When
    const result = isProductionDeployment({ isProductionBuild: false });

    // Then
    expect(result).toBe(false);
  });
});

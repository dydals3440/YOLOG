/** Vercel Preview/Development 빌드는 분석과 광고를 제외한다. */
export const isLiveBuild =
  import.meta.env.PROD && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

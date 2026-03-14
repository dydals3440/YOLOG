export const WEBSITE_CONFIG = {
  TITLE: "개발자 매튜",
  TITLE_TEMPLATE: "개발자 매튜 | %s",
  DESCRIPTION:
    "소프트웨어 개발자 매튜입니다. 에듀테크 장학카드 관리 서비스를 만들고, 사이드로 친구와 함께 성장하는 AI 투두 플래너 아이두를 개발하고 있습니다. 개발 경험과 생각을 기록합니다.",
  OG_IMAGE: "/images/og.png",
  AUTHOR: "매튜",
  SOCIAL_LINKS: {
    YOUTUBE: "https://www.youtube.com/@yongcoding",
  },
} as const;

export const BLOG_CATEGORIES = {
  ALL: "전체",
  DEVELOPMENT: "개발",
  REVIEW: "회고",
  HTTP: "HTTP",
  STORY: "이야기",
  DESIGN_PATTERN: "디자인 패턴",
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;

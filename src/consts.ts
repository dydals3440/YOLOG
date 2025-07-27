export const WEBSITE_CONFIG = {
  TITLE: '개발자 매튜',
  TITLE_TEMPLATE: '개발자 매튜 | %s',
  DESCRIPTION:
    '웹 프론트엔드 개발자 매튜입니다. 다양한 문제를 분석하고 해결책을 찾는 과정에서 큰 성취감을 느낍니다. 문제 해결에 그치지 않고 이를 통해 서비스의 품질을 높여 더 나은 사용자 경험을 제공하고자 노력합니다.',
  OG_IMAGE: '/images/og.png',
} as const;

export const BLOG_CATEGORIES = {
  ALL: '전체',
  DEVELOPMENT: '개발',
  REVIEW: '회고',
  HTTP: 'HTTP',
  STORY: '이야기',
} as const;

export type BlogCategory = keyof typeof BLOG_CATEGORIES;

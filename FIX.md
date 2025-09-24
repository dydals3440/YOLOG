# YOLOG 코드 개선 사항

## 📌 우선순위: 높음

### 1. TypeScript 타입 안전성 개선

#### 1.1 `any` 타입 제거
**파일**: `src/types/global.d.ts`
```typescript
// 현재
interface Window {
  adsbygoogle: any[];
}
declare var adsbygoogle: any[];

// 개선안
interface AdsByGoogle {
  push(params: object): void;
}
interface Window {
  adsbygoogle: AdsByGoogle[];
}
declare var adsbygoogle: AdsByGoogle[];
```

#### 1.2 이벤트 리스너 타입 개선
**파일**: `src/lib/stores/theme.ts`
```typescript
// 현재
const handleMediaQuery = (query: { matches: boolean }) => {
  applyTheme(query.matches ? THEME_MAP.dark : THEME_MAP.light)
}

// 개선안
const handleMediaQuery = (event: MediaQueryListEvent) => {
  applyTheme(event.matches ? THEME_MAP.dark : THEME_MAP.light)
}
```

### 2. 성능 최적화

#### 2.1 TableOfContent 스크롤 이벤트 최적화
**파일**: `src/components/post/TableOfContent.tsx`
- 현재 `throttle` 지연시간이 10ms로 너무 짧음
- **개선안**: 50-100ms로 늘려서 성능 개선
```typescript
// 현재
const onScroll = throttle(() => { ... }, 10);

// 개선안
const onScroll = throttle(() => { ... }, 50);
```

#### 2.2 React 19 최적화 기능 활용
- `useMemo`, `useCallback` 활용 부재
- **개선 대상 컴포넌트**:
  - `TableOfContent`: headings 계산 로직 메모이제이션
  - `SocialShare`: URL 생성 로직 메모이제이션

### 3. 접근성(a11y) 개선

#### 3.1 ActionButton 컴포넌트 개선
**파일**: `src/components/post/ActionButton.tsx`
- `aria-label` 속성 누락
- **개선안**: children이 아이콘만 있을 때 aria-label 필수화

#### 3.2 Toast 알림 접근성
**파일**: `src/components/ui/toaster.tsx`
- ARIA live region 설정 부재
- **개선안**: `role="alert"` 또는 `aria-live="polite"` 추가

## 📌 우선순위: 중간

### 4. 코드 일관성 개선

#### 4.1 컴포넌트 네이밍 통일
- 일부는 default export (`TableOfContent`)
- 일부는 named export (`ActionButton`, `CopyLinkButton`)
- **개선안**: 프로젝트 전체에서 일관된 export 패턴 사용

#### 4.2 이벤트 핸들러 네이밍 규칙
- 혼재된 네이밍: `handleCopyLink`, `handleShare`, `onScroll`
- **개선안**: `handle*` 또는 `on*` 중 하나로 통일

### 5. 에러 처리 강화

#### 5.1 GiscusComment 스크립트 로딩 에러 처리
**파일**: `src/components/post/GiscusComment.tsx`
```typescript
// 개선안
giscusScript.onerror = () => {
  console.error('Failed to load Giscus comments');
  // 사용자에게 에러 상태 표시
};
```

#### 5.2 clipboard API 폴백
**파일**: `src/components/post/CopyLinkButton.tsx`
- 구형 브라우저 지원 부재
- **개선안**: `navigator.clipboard` 미지원 시 폴백 구현

### 6. 번들 사이즈 최적화

#### 6.1 중복 의존성 정리
- `clsx`와 `tailwind-merge`를 모두 사용 중
- 이미 `cn` 유틸리티로 통합되어 있으므로 직접 import 최소화

#### 6.2 Tree-shaking 개선
- `lucide-react`에서 개별 아이콘 import 권장
```typescript
// 현재
import { Icon } from 'lucide-react';

// 개선안
import Icon from 'lucide-react/dist/esm/icons/icon-name';
```

## 📌 우선순위: 낮음

### 7. 개발자 경험(DX) 개선

#### 7.1 JSDoc 주석 추가
- 유틸리티 함수들은 JSDoc이 잘 작성되어 있으나 컴포넌트는 부족
- Props interface에 JSDoc 추가 권장

#### 7.2 Storybook 도입 고려
- UI 컴포넌트 독립적 개발/테스트 환경 구축
- 특히 Button, Toast 등 재사용 컴포넌트

### 8. SEO 및 메타데이터

#### 8.1 구조화된 데이터 추가
- JSON-LD 스키마 마크업 추가
- 블로그 포스트에 Article 스키마 적용

#### 8.2 Open Graph 이미지 최적화
- 동적 OG 이미지 생성 시스템 구축 고려

### 9. 테스트 코드 추가

#### 9.1 유틸리티 함수 단위 테스트
- `blog-utils.ts`의 함수들에 대한 테스트 필요
- Vitest 또는 Jest 도입 권장

#### 9.2 컴포넌트 테스트
- React Testing Library를 활용한 컴포넌트 테스트
- 특히 상태 관리가 있는 컴포넌트 우선

## 🔧 즉시 수정 가능한 항목

1. **throttle 지연시간 조정** - 1줄 수정
2. **any 타입 제거** - 타입 정의만 수정
3. **이벤트 리스너 메모리 누수 방지** - cleanup 함수 확인
4. **에러 메시지 한글화 통일** - 일부는 한글, 일부는 영문

## 📊 예상 효과

- **성능**: 스크롤 이벤트 최적화로 10-20% 성능 향상
- **번들 사이즈**: Tree-shaking 개선으로 5-10% 크기 감소
- **유지보수성**: TypeScript 타입 안전성으로 런타임 에러 감소
- **접근성**: 스크린 리더 사용자 경험 개선

## 💡 추가 권장사항

1. **ESLint 규칙 강화**
   - `@typescript-eslint/no-explicit-any` 활성화
   - `react-hooks/exhaustive-deps` 엄격 모드

2. **Prettier 설정 통일**
   - 세미콜론, 따옴표 스타일 일관성

3. **Git hooks 설정**
   - lefthook이 이미 설치되어 있으니 pre-commit 훅 활용
   - 타입 체크, 린팅 자동화

4. **성능 모니터링**
   - Vercel Analytics가 이미 설치되어 있으니 Core Web Vitals 추적
   - 특히 LCP, CLS 지표 개선 필요
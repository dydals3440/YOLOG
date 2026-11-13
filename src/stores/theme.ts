import { persistentAtom } from "@nanostores/persistent";

export const THEME_MAP = {
  light: "light",
  dark: "dark",
  system: undefined,
} as const;

export type ThemeValue = (typeof THEME_MAP)[keyof typeof THEME_MAP];
export type ResolvedTheme = Exclude<ThemeValue, undefined>;

export const STORAGE_THEME_KEY = "theme";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

export const themeStore = persistentAtom<ThemeValue>(STORAGE_THEME_KEY, THEME_MAP.system);

const applyTheme = (theme: ResolvedTheme) => {
  document.documentElement.dataset.theme = theme;
};

const resolveSystemTheme = (query: MediaQueryList | MediaQueryListEvent): ResolvedTheme =>
  query.matches ? THEME_MAP.dark : THEME_MAP.light;

/** 저장한 테마(없으면 OS 설정)를 html의 data-theme에 반영하고, 바뀔 때마다 다시 반영한다. */
export function syncTheme() {
  const systemQuery = window.matchMedia(SYSTEM_DARK_QUERY);
  const followSystemTheme = (event: MediaQueryListEvent) => {
    if (themeStore.get() === THEME_MAP.system) {
      applyTheme(resolveSystemTheme(event));
    }
  };

  systemQuery.addEventListener("change", followSystemTheme);
  const unsubscribe = themeStore.subscribe((theme) => {
    applyTheme(theme ?? resolveSystemTheme(systemQuery));
  });

  return () => {
    systemQuery.removeEventListener("change", followSystemTheme);
    unsubscribe();
  };
}

/** 저장값이 없으면 OS 설정을 따르므로, 화면에 실제 적용된 테마를 기준으로 뒤집는다. */
export function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === THEME_MAP.dark;
  themeStore.set(isDark ? THEME_MAP.light : THEME_MAP.dark);
}

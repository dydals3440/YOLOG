import { persistentAtom } from "@nanostores/persistent";
import { onMount } from "nanostores";

export const THEME_MAP = {
  light: "light",
  dark: "dark",
  system: undefined,
} as const;

export type ThemeKey = keyof typeof THEME_MAP;
export type ThemeValue = (typeof THEME_MAP)[ThemeKey];
export type ResolvedTheme = Exclude<ThemeValue, undefined>;

export const STORAGE_THEME_KEY = "theme";

export const themeStore = persistentAtom<ThemeValue>(STORAGE_THEME_KEY, THEME_MAP.system);

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

const applyTheme = (theme: ResolvedTheme) => {
  document.documentElement.dataset.theme = theme;
};

const resolveSystemTheme = (query: MediaQueryList | MediaQueryListEvent): ResolvedTheme =>
  query.matches ? THEME_MAP.dark : THEME_MAP.light;

const subscribeTheme = () => {
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
};

if (typeof window !== "undefined") {
  onMount(themeStore, subscribeTheme);
}

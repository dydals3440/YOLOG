import { useStore } from "@nanostores/react";
import { Moon, Sun } from "lucide-react";
import { THEME_MAP, type ThemeKey, themeStore } from "@/lib/stores/theme";

const ThemeToggle = () => {
  // 구독자가 있어야 themeStore의 onMount가 실행되어 테마가 화면에 적용된다.
  useStore(themeStore);

  // 저장값이 없으면 OS 설정을 따르므로, 화면에 실제 적용된 테마를 기준으로 뒤집는다.
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const themeKey: ThemeKey = isDark ? "light" : "dark";
    themeStore.set(THEME_MAP[themeKey]);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-selection hover:text-heading focus-visible:ring-1 focus-visible:ring-gray-200 focus-visible:outline-none"
    >
      <Sun
        strokeWidth={1.75}
        className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <Moon
        strokeWidth={1.75}
        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">테마 변경</span>
    </button>
  );
};

export default ThemeToggle;

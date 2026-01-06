import { useStore } from "@nanostores/react";

import { THEME_MAP, type ThemeKey, themeStore } from "@/lib/stores/theme";

import { Button } from "@/components/ui/Button";
import { MoonIcon, SunIcon } from "@/components/ui/Icons";

const ThemeToggle = () => {
  const theme = useStore(themeStore);

  const toggleTheme = () => {
    const themeKey: ThemeKey = theme === "dark" ? "light" : "dark";
    themeStore.set(THEME_MAP[themeKey]);
  };

  return (
    <Button onClick={toggleTheme} variant="ghost" size="icon">
      <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">테마 변경</span>
    </Button>
  );
};

export default ThemeToggle;

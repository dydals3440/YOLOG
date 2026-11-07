import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

/** html의 dark 클래스를 구독해 화면에 실제 적용된 테마를 알려 준다. */
export const useIsDark = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

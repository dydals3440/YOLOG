import { Toaster as Sonner } from "sonner";

import { useIsDark } from "@/hooks/use-is-dark";
import { TOAST } from "@/lib/config";

export function Toaster() {
  const isDark = useIsDark();

  return (
    <Sonner position="top-center" theme={isDark ? "dark" : "light"} duration={TOAST.DURATION_MS} />
  );
}

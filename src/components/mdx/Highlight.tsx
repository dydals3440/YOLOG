import type { ReactNode } from "react";

type HighlightColor = "yellow" | "pink" | "blue" | "green" | "orange";

interface HighlightProps {
  children: ReactNode;
  color?: HighlightColor;
}

const colorClasses: Record<HighlightColor, string> = {
  yellow: "",
  pink: "pink",
  blue: "blue",
  green: "green",
  orange: "orange",
};

const Highlight = ({ children, color = "yellow" }: HighlightProps) => {
  return <mark className={colorClasses[color]}>{children}</mark>;
};

export default Highlight;

import { throttle } from "es-toolkit";
import { useEffect, useState, useMemo } from "react";

import type { TOCSectionModel } from "@/lib/mdx";
import { cn } from "@/lib/utils";

const TableOfContent = ({
  toc,
  className,
  ...props
}: {
  toc: TOCSectionModel[];
  className?: string;
}) => {
  const { currentSectionSlug } = useTocScroll(toc);

  return (
    <ul {...props} className={cn("space-y-1.5 text-sm", className)}>
      {toc.map((section, index) => (
        <li key={index} className="flex">
          <a
            className={cn(
              "link text-[13px] text-third transition-colors hover:text-primary",
              currentSectionSlug === section.slug && "text-primary font-medium",
            )}
            href={`#${section.slug}`}
          >
            {section.text}
          </a>
        </li>
      ))}
    </ul>
  );
};

const HEADING_OFFSET = 30;
const SCROLL_THROTTLE_MS = 50;

const useTocScroll = (tableOfContents: TOCSectionModel[]) => {
  const [currentSectionSlug, setCurrentSectionSlug] = useState<string>();

  const hasContent = useMemo(
    () => tableOfContents.length > 0,
    [tableOfContents],
  );

  useEffect(() => {
    if (!hasContent) return;

    let headings: { id: string; top: number }[] = [];
    let pageTop = 0;

    const updateHeadings = () => {
      const headingElements = document.querySelectorAll<HTMLElement>(".mdx h2");
      headings = Array.from(headingElements).map((element) => ({
        id: element.id,
        top: element.offsetTop,
      }));
    };

    const updatePageTop = () => {
      pageTop = parseFloat(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue("--page-top")
          .match(/[\d.]+/)?.[0] ?? "0",
      );
    };

    const onResize = () => {
      updateHeadings();
      updatePageTop();
    };

    const onScroll = throttle(() => {
      if (headings.length === 0) return;

      let current: typeof currentSectionSlug = undefined;
      const top = window.scrollY + pageTop;

      headings.forEach((heading) => {
        if (top >= heading.top - HEADING_OFFSET) {
          current = heading.id;
        }
      });

      setCurrentSectionSlug(current);
    }, SCROLL_THROTTLE_MS);

    // 초기 설정
    updateHeadings();
    updatePageTop();
    onScroll();

    window.addEventListener("scroll", onScroll, { capture: true });
    window.addEventListener("resize", onResize, { capture: true });

    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize, { capture: true });
    };
  }, [hasContent]);

  return { currentSectionSlug };
};

export default TableOfContent;

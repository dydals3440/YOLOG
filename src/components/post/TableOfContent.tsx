import { throttle } from "es-toolkit";
import { useEffect, useState } from "react";

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
    <nav {...props} className={cn("relative", className)}>
      <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-px bg-gray-200" />
      <ul className="relative">
        {toc.map((section) => {
          const isActive = currentSectionSlug === section.slug;
          return (
            <li key={section.slug}>
              <a
                href={`#${section.slug}`}
                className={cn(
                  "relative block py-1.5 pl-4 text-[13px] leading-snug transition-colors duration-200",
                  "before:absolute before:top-0 before:left-0 before:h-full before:w-px before:transition-colors",
                  isActive
                    ? "font-medium text-heading before:bg-heading"
                    : "text-disabled before:bg-transparent hover:text-body",
                )}
              >
                {section.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const HEADING_OFFSET = 30;
const SCROLL_THROTTLE_MS = 50;

const useTocScroll = (tableOfContents: TOCSectionModel[]) => {
  const [currentSectionSlug, setCurrentSectionSlug] = useState<string>();

  const hasContent = tableOfContents.length > 0;

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

      let current: typeof currentSectionSlug;
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

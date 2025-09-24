import { throttle } from 'es-toolkit';
import { useEffect, useState, useMemo } from 'react';

import type { TOCSectionModel } from '@/lib/mdx';
import { cn } from '@/lib/utils';

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
    <ul {...props} className={cn('space-y-2.5 pr-4 text-sm', className)}>
      {toc.map((section, index) => (
        <li key={index} className='flex'>
          <a
            className={cn(
              'link text-[13px] text-second',
              currentSectionSlug === section.slug && 'font-semibold text-body'
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

const useTocScroll = (tableOfContents: TOCSectionModel[]) => {
  const [currentSectionSlug, setCurrentSectionSlug] = useState<string>();

  const hasContent = useMemo(() => tableOfContents.length > 0, [tableOfContents]);

  useEffect(() => {
    if (!hasContent) return;

    let headings: { id: string; top: number }[];
    let pageTop = 0;

    const onResize = () => {
      headings = Array.from(
        document.querySelectorAll<HTMLElement>('.mdx h2')
      ).map((element) => ({
        id: element.id,
        top: element.offsetTop,
      }));

      pageTop = parseFloat(
        window
          .getComputedStyle(document.documentElement)
          .getPropertyValue('--page-top')
          .match(/[\d.]+/)?.[0] ?? '0'
      );
    };

    const onScroll = throttle(() => {
      if (!headings) return;

      let current: typeof currentSectionSlug = undefined;
      const top = window.scrollY + pageTop;
      const HEADING_OFFSET = 30;

      headings.forEach((heading) => {
        if (top >= heading.top - HEADING_OFFSET) {
          current = heading.id;
        }
      });

      setCurrentSectionSlug(current);
    }, 50);

    onResize();
    onScroll();
    window.addEventListener('scroll', onScroll, { capture: true });
    window.addEventListener('resize', onResize, { capture: true });

    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize, { capture: true });
    };
  }, [hasContent]);

  return { currentSectionSlug };
};

export default TableOfContent;

'use client';

import NotionBlocks from 'notion-block-renderer';
import {
  monokaiSublime,
  atomOneDarkReasonable,
} from 'react-syntax-highlighter/dist/cjs/styles/hljs';

export function NotionDetailPost({ blocks }: any) {
  return (
    <>
      <NotionBlocks
        blocks={blocks}
        isCodeHighlighter={true}
        syntaxHighlighterCSS={atomOneDarkReasonable}
      />
    </>
  );
}

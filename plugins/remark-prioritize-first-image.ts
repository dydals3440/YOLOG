import type { Image, Root } from "mdast";
import { EXIT, visit } from "unist-util-visit";

// 첫 화면에 들어올 가능성이 있는 본문 앞부분의 이미지만 우선 로드한다.
const ABOVE_THE_FOLD_BLOCKS = 4;
const METADATA_NODE_TYPES = new Set(["yaml", "mdxjsEsm"]);

function findFirstImage(blocks: Root["children"]) {
  let firstImage: Image | undefined;

  for (const block of blocks) {
    visit(block, "image", (image) => {
      firstImage = image;
      return EXIT;
    });
    if (firstImage) break;
  }

  return firstImage;
}

/** 본문 첫 이미지는 LCP 후보이므로 lazy 대신 우선 로드하도록 표시한다. */
export function remarkPrioritizeFirstImage() {
  return (tree: Root) => {
    const contentBlocks = tree.children.filter(({ type }) => !METADATA_NODE_TYPES.has(type));
    const firstImage = findFirstImage(contentBlocks.slice(0, ABOVE_THE_FOLD_BLOCKS));
    if (!firstImage) return;

    firstImage.data = { ...firstImage.data, hProperties: { priority: true } };
  };
}

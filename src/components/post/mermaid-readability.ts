// 이보다 작게 줄이면 글자를 읽을 수 없으므로, 넘치는 만큼은 가로 스크롤로 보여 준다.
const MIN_DIAGRAM_SCALE = 0.6;

function keepDiagramReadable(block: Element) {
  const diagram = block.querySelector("svg");
  if (!diagram) {
    return;
  }

  const minWidth = diagram.viewBox.baseVal.width * MIN_DIAGRAM_SCALE;
  diagram.style.minWidth = `${Math.round(minWidth)}px`;
}

/** astro-mermaid가 다이어그램을 그릴 때마다(테마 전환 포함) 최소 크기를 지정한다. */
export function setupMermaidReadability() {
  const blocks = document.querySelectorAll("pre.mermaid");
  if (blocks.length === 0) {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    for (const { target } of mutations) {
      if (target instanceof Element && target.hasAttribute("data-processed")) {
        keepDiagramReadable(target);
      }
    }
  });

  for (const block of blocks) {
    observer.observe(block, { attributes: true, attributeFilter: ["data-processed"] });
  }
}

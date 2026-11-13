declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

/** GA 태그가 없는 개발·미리보기 환경에서도 공유 동작은 그대로 동작한다. */
export function trackShare(method: string) {
  const postId = document.querySelector<HTMLElement>("[data-post-id]")?.dataset.postId ?? "";
  window.gtag?.("event", "share", { method, content_type: "article", item_id: postId });
}

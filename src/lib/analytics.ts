declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

/** 태그가 없는 개발/미리보기 환경에서도 UI는 그대로 동작한다. */
export function trackShare(method: string): void {
  const article = document.querySelector<HTMLElement>("[data-post-id]");
  if (!article) return;
  window.gtag?.("event", "share", {
    method,
    content_type: "article",
    item_id: article.dataset.postId ?? "",
  });
}

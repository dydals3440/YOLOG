export function getSamePageSectionId(href: string, currentHref: string): string | null {
  if (!href.trim()) return null;
  try {
    const current = new URL(currentHref);
    const destination = new URL(href, current);
    if (
      destination.origin !== current.origin ||
      destination.pathname !== current.pathname ||
      destination.search !== current.search ||
      !destination.hash
    ) {
      return null;
    }
    return decodeURIComponent(destination.hash.slice(1));
  } catch {
    return null;
  }
}

export function isPlainNavigationClick(
  event: Pick<
    MouseEvent,
    "button" | "altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "defaultPrevented"
  >,
): boolean {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.defaultPrevented
  );
}

export function setupPostNavigation(): void {
  document.addEventListener("click", (event) => {
    if (!isPlainNavigationClick(event) || !(event.target instanceof Element)) return;

    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

    if (link.hasAttribute("data-post-back")) {
      if (document.referrer && history.length > 1) {
        event.preventDefault();
        history.back();
      }
      return;
    }

    const sectionId = getSamePageSectionId(link.getAttribute("href") ?? "", location.href);
    if (!sectionId) return;
    const section = document.getElementById(sectionId);
    if (!section) return;

    // 목차·제목·각주 이동을 새 방문으로 쌓지 않아 한 번에 이전 페이지로 돌아간다.
    history.replaceState(history.state, "", link.href);
    event.preventDefault();

    if (section.tabIndex < 0 && !section.hasAttribute("tabindex")) {
      section.setAttribute("tabindex", "-1");
      section.addEventListener("blur", () => section.removeAttribute("tabindex"), { once: true });
    }
    section.focus({ preventScroll: true });
    section.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  });
}

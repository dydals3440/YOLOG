const COPIED_FEEDBACK_MS = 2000;
const COPIED_MESSAGE = "클립보드에 복사했어요";

function getCanonicalUrl() {
  return document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href;
}

function announce(message: string) {
  const status = document.querySelector("[data-copy-status]");
  if (status) {
    status.textContent = message;
  }
}

async function copyText(button: HTMLElement) {
  const text = button.dataset.copyText ?? getCanonicalUrl();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }

  button.toggleAttribute("data-copied", true);
  announce(COPIED_MESSAGE);
  setTimeout(() => button.toggleAttribute("data-copied", false), COPIED_FEEDBACK_MS);
}

/**
 * data-copy-text가 있으면 그 값을, 없으면 이 페이지의 대표 URL을 복사한다.
 * 복사하는 동안 버튼에 data-copied를 붙여 아이콘으로 결과를 알린다.
 */
export function setupCopyButtons() {
  for (const button of document.querySelectorAll<HTMLElement>("[data-copy-button]")) {
    if (button.dataset.copyReady) continue;
    button.dataset.copyReady = "true";
    button.addEventListener("click", () => void copyText(button));
  }
}

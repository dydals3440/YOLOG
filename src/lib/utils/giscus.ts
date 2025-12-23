export const giscusThemes = {
  light: 'https://giscus.app/themes/light.css',
  dark: 'https://giscus.app/themes/transparent_dark.css',
} as const;

export type GiscusTheme = keyof typeof giscusThemes;

export const changeGiscusTheme = (theme: GiscusTheme) => {
  const sendMessage = (config: unknown) => {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe.giscus-frame'
    );
    iframe?.contentWindow?.postMessage(
      { giscus: config },
      'https://giscus.app'
    );
  };

  sendMessage({
    setConfig: {
      theme: giscusThemes[theme],
    },
  });
};

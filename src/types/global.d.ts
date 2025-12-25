interface AdsByGoogleParams {
  push(params: {
    google_ad_client?: string;
    enable_page_level_ads?: boolean;
    overlays?: { bottom: boolean };
  }): void;
}

interface Window {
  adsbygoogle: AdsByGoogleParams[];
}

declare var adsbygoogle: AdsByGoogleParams[];

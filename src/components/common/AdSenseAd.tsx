// src/components/AdSenseAd.tsx
import React, { useEffect, useRef } from 'react';

// window.adsbygoogle 타입 선언
declare global {
  interface Window {
    adsbygoogle?: { push: (params: object) => void }[] & {
      push: (params: object) => void;
    };
  }
}

interface AdSenseAdProps {
  /** AdSense 클라이언트 ID (예: "ca-pub-3296643559689345") */
  adClient?: string;
  /** AdSense 슬롯 ID (예: "7152656113") */
  adSlot?: string;
  /** 광고 영역 스타일 (기본: display:block) */
  style?: React.CSSProperties;
  /** data-ad-format 값 (기본: "auto") */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  /** 반응형 여부 (data-full-width-responsive) 기본: true */
  fullWidthResponsive?: boolean;
}

/**
 * React 컴포넌트로 감싼 AdSense 광고 영역.
 * - adClient: 반드시 자신의 ca-pub-... 형태 Client ID를 넣어야 합니다.
 * - adSlot: AdSense 관리자에서 발급받은 슬롯 ID를 넣어야 합니다.
 *
 * 사용 예)
 * <AdSenseAd
 *    adClient="ca-pub-3296643559689345"
 *    adSlot="7152656113"
 *    style={{ display: 'block', width: '100%', height: '90px' }}
 *    format="auto"
 * />
 */
const AdSenseAd: React.FC<AdSenseAdProps> = ({
  adClient = 'ca-pub-3296643559689345',
  adSlot = '7152656113',
  style = { display: 'block' },
  format = 'auto',
  fullWidthResponsive = true,
}) => {
  const insRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // 광고 스크립트가 이미 있는지 확인
    const scriptId = `adsbygoogle-js-${adClient}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);

      script.onload = () => {
        if (window.adsbygoogle && insRef.current) {
          try {
            (window.adsbygoogle as any).push({});
          } catch (e) {
            // 광고 푸시 실패 시 무시 (중복 푸시 등)
          }
        }
      };
    } else {
      // 이미 스크립트가 로드된 상태라면 바로 광고 푸시
      if (window.adsbygoogle && insRef.current) {
        try {
          (window.adsbygoogle as any).push({});
        } catch (e) {
          // 광고 푸시 실패 시 무시
        }
      }
    }
  }, [adClient]);

  return (
    <ins
      ref={insRef as React.RefObject<HTMLModElement>}
      className='adsbygoogle'
      style={style}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  );
};

export default AdSenseAd;

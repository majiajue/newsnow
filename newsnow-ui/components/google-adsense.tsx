'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

// Google AdSense 客户端ID
const ADSENSE_CLIENT_ID = 'ca-pub-2044354603819805';

export default function GoogleAdsense() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // 只有在脚本加载完成且未配置过的情况下才配置自动广告
    if (!isScriptLoaded || isConfigured) {
      return;
    }

    // 检查用户是否已经接受了Cookie政策
    const hasConsent = localStorage.getItem('cookie-consent');
    const disableAds = localStorage.getItem('disable-ads');
    
    // 如果用户拒绝了Cookie，不加载广告
    if (disableAds === 'true') {
      return;
    }
    
    // 如果用户接受了Cookie，启用自动广告
    if (hasConsent === 'accepted') {
      try {
        // 检查是否已经配置过
        if (window.adsbygoogle && !isConfigured) {
          // 启用自动广告
          (window.adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: ADSENSE_CLIENT_ID,
            enable_page_level_ads: true,
            overlays: {bottom: true}
          });
          setIsConfigured(true);
          console.log('AdSense 自动广告已配置');
        }
      } catch (error) {
        console.error('AdSense 自动广告错误:', error);
      }
    }
  }, [isScriptLoaded, isConfigured]);

  const handleScriptLoad = () => {
    console.log('AdSense 脚本加载完成');
    setIsScriptLoaded(true);
  };

  const handleScriptError = () => {
    console.error('AdSense 脚本加载失败');
  };

  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      crossOrigin="anonymous"
      onLoad={handleScriptLoad}
      onError={handleScriptError}
    />
  );
}

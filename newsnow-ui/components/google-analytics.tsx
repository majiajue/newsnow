'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

// Google Analytics测量ID
const GA_MEASUREMENT_ID = 'G-EL9HHYE5LC';

function GoogleAnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  // 检查用户是否接受了分析跟踪
  useEffect(() => {
    // 在客户端运行
    if (typeof window === 'undefined') return;
    
    const hasConsent = localStorage.getItem('cookie-consent');
    const disableAnalytics = localStorage.getItem('disable-analytics');
    
    // 如果用户接受了Cookie且没有禁用分析
    setAnalyticsEnabled(hasConsent === 'accepted' && disableAnalytics !== 'true');
  }, []);

  // 跟踪页面浏览
  useEffect(() => {
    if (!analyticsEnabled || !GA_MEASUREMENT_ID || !window.gtag) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // 发送页面浏览事件
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams, analyticsEnabled]);

  // 如果用户不允许跟踪，不加载脚本
  if (!analyticsEnabled) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 脚本 */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

export default function GoogleAnalytics() {
  return (
    <Suspense fallback={null}>
      <GoogleAnalyticsContent />
    </Suspense>
  );
}

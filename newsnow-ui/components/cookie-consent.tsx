'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入X图标
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // 检查用户是否已经接受了Cookie政策
    const hasConsent = localStorage.getItem('cookie-consent');
    if (!hasConsent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
    
    // 如果使用自动广告，接受后重新加载页面以显示广告
    window.location.reload();
  };

  const declineCookies = () => {
    // 设置为拒绝，但仍然记录用户已经做出了选择
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);
    
    // 这里可以添加禁用非必要Cookie的逻辑
    // 例如，可以设置一个全局变量，指示不加载广告和分析脚本
    window.localStorage.setItem('disable-analytics', 'true');
    window.localStorage.setItem('disable-ads', 'true');
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg z-50 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="flex-1 pr-4 mb-4 md:mb-0">
          <h3 className="text-lg font-semibold mb-2">隐私与Cookie政策</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            我们使用Cookie和类似技术来提供、维护和改进我们的服务。通过点击"接受"，您同意我们使用这些工具进行分析、个性化内容和广告。
            您可以随时在<a href="/privacy" className="text-blue-500 hover:underline">隐私设置</a>中更改您的选择。
          </p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            仅必要Cookie
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            接受所有Cookie
          </button>
        </div>
        <button 
          onClick={declineCookies} 
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

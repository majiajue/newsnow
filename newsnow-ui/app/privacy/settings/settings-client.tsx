'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function PrivacySettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState({
    analytics: false,
    ads: false,
    functional: false,
  });
  const [saved, setSaved] = useState(false);

  // 加载当前设置
  useEffect(() => {
    // 只在客户端运行
    if (typeof window === 'undefined') return;
    
    const hasConsent = localStorage.getItem('cookie-consent');
    const disableAnalytics = localStorage.getItem('disable-analytics') === 'true';
    const disableAds = localStorage.getItem('disable-ads') === 'true';
    
    // 如果用户接受了所有Cookie
    if (hasConsent === 'accepted') {
      setSettings({
        analytics: !disableAnalytics,
        ads: !disableAds,
        functional: true,
      });
    } else {
      setSettings({
        analytics: false,
        ads: false,
        functional: false,
      });
    }
  }, []);

  // 保存设置
  const saveSettings = () => {
    // 如果用户接受了任何非必要Cookie，则设置为已接受
    if (settings.analytics || settings.ads || settings.functional) {
      localStorage.setItem('cookie-consent', 'accepted');
    } else {
      localStorage.setItem('cookie-consent', 'declined');
    }
    
    // 设置各项功能的启用状态
    localStorage.setItem('disable-analytics', settings.analytics ? 'false' : 'true');
    localStorage.setItem('disable-ads', settings.ads ? 'false' : 'true');
    
    // 显示保存成功消息
    setSaved(true);
    
    // 3秒后刷新页面以应用新设置
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  // 接受所有Cookie
  const acceptAll = () => {
    setSettings({
      analytics: true,
      ads: true,
      functional: true,
    });
    
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('disable-analytics', 'false');
    localStorage.setItem('disable-ads', 'false');
    
    setSaved(true);
    
    // 3秒后刷新页面以应用新设置
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  // 拒绝所有非必要Cookie
  const rejectAll = () => {
    setSettings({
      analytics: false,
      ads: false,
      functional: false,
    });
    
    localStorage.setItem('cookie-consent', 'declined');
    localStorage.setItem('disable-analytics', 'true');
    localStorage.setItem('disable-ads', 'true');
    
    setSaved(true);
    
    // 3秒后刷新页面以应用新设置
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">隐私设置</h1>
      
      <div className="mb-6">
        <Link href="/privacy" className="text-blue-500 hover:underline">
          ← 返回隐私政策
        </Link>
      </div>
      
      {saved && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p className="font-bold">设置已保存</p>
          <p>您的隐私偏好已更新，页面将在几秒钟后刷新以应用新设置。</p>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Cookie偏好设置</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          您可以选择启用或禁用不同类型的Cookie。请注意，禁用某些Cookie可能会影响网站的功能和您的体验。
        </p>
        
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="necessary"
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="necessary" className="font-medium text-gray-900 dark:text-gray-300">
                必要Cookie
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                这些Cookie对于网站的基本功能是必需的，无法禁用。它们通常只在响应您的操作时设置，
                例如设置您的隐私偏好、登录或填写表单。
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="analytics"
                type="checkbox"
                checked={settings.analytics}
                onChange={(e) => setSettings({...settings, analytics: e.target.checked})}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="analytics" className="font-medium text-gray-900 dark:text-gray-300">
                分析Cookie
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                这些Cookie帮助我们了解用户如何与网站互动，收集和报告信息以帮助我们改进网站。
                它们不会直接收集您的个人信息，但可以识别您的浏览器和互联网设备。
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="ads"
                type="checkbox"
                checked={settings.ads}
                onChange={(e) => setSettings({...settings, ads: e.target.checked})}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="ads" className="font-medium text-gray-900 dark:text-gray-300">
                广告Cookie
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                这些Cookie用于向您展示相关广告，并衡量广告活动的效果。它们可能会跟踪您在不同网站上的活动，
                以便向您展示个性化广告。
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="functional"
                type="checkbox"
                checked={settings.functional}
                onChange={(e) => setSettings({...settings, functional: e.target.checked})}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="functional" className="font-medium text-gray-900 dark:text-gray-300">
                功能Cookie
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                这些Cookie使网站能够记住您的偏好设置，提供增强的个性化功能。它们可能由我们或我们放置在网站上的
                第三方服务提供商设置。
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            保存设置
          </button>
          <button
            onClick={acceptAll}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            接受所有Cookie
          </button>
          <button
            onClick={rejectAll}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            仅接受必要Cookie
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">其他隐私控制</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-medium mb-3">浏览器设置</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            您可以通过浏览器设置来管理或删除Cookie。以下是常见浏览器的Cookie管理指南链接：
          </p>
          <ul className="list-disc pl-6 space-y-2 text-blue-500">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/zh-CN/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/zh-cn/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="hover:underline">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/zh-cn/microsoft-edge/microsoft-edge-%E4%B8%AD%E7%9A%84-cookie-a7f95376-f761-4651-96ff-165a60c77a1f" target="_blank" rel="noopener noreferrer" className="hover:underline">Microsoft Edge</a></li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-xl font-medium mb-3">数据删除请求</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            如果您想请求删除我们可能收集的关于您的数据，请发送电子邮件至：
            <a href="mailto:privacy@shishixinwen.news" className="text-blue-500 hover:underline ml-1">
              privacy@shishixinwen.news
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

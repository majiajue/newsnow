'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { event, ANALYTICS_EVENTS } from '@/lib/analytics';
import AdUnit from '@/components/ad-unit';
import { useSearchParams } from 'next/navigation';

export function PrivacyTestContent() {
  // 显式使用useSearchParams以确保它被包装在Suspense中
  const searchParams = useSearchParams();
  
  const [settings, setSettings] = useState({
    analyticsEnabled: false,
    adsEnabled: false,
    hasConsent: false,
  });
  const [eventSent, setEventSent] = useState(false);
  const [eventType, setEventType] = useState('');

  // 加载当前设置
  useEffect(() => {
    // 只在客户端运行
    if (typeof window === 'undefined') return;
    
    const hasConsent = localStorage.getItem('cookie-consent');
    const disableAnalytics = localStorage.getItem('disable-analytics') === 'true';
    const disableAds = localStorage.getItem('disable-ads') === 'true';
    
    setSettings({
      analyticsEnabled: hasConsent === 'accepted' && !disableAnalytics,
      adsEnabled: hasConsent === 'accepted' && !disableAds,
      hasConsent: hasConsent === 'accepted' || hasConsent === 'declined',
    });
  }, []);

  // 测试事件跟踪
  const testAnalyticsEvent = (eventCategory: string) => {
    setEventType(eventCategory);
    
    event({
      action: 'test_event', // 直接使用字符串，避免使用不存在的ANALYTICS_EVENTS.TEST
      category: eventCategory,
      label: '测试事件',
    });
    
    setEventSent(true);
    
    // 3秒后重置状态
    setTimeout(() => {
      setEventSent(false);
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">隐私设置测试</h1>
      
      <div className="mb-6">
        <Link href="/privacy/settings" className="text-blue-500 hover:underline">
          ← 返回隐私设置
        </Link>
      </div>
      
      {/* 当前设置状态 */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">当前隐私设置状态</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Cookie同意状态:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${settings.hasConsent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {settings.hasConsent ? '已设置' : '未设置'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Google Analytics:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${settings.analyticsEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {settings.analyticsEnabled ? '已启用' : '已禁用'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Google AdSense:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${settings.adsEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {settings.adsEnabled ? '已启用' : '已禁用'}
            </span>
          </div>
        </div>
      </div>
      
      {/* 测试Google Analytics */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">测试Google Analytics</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          点击下面的按钮发送测试事件到Google Analytics。如果Analytics已启用，事件将被记录。
          您可以在Google Analytics实时报告中查看这些事件。
        </p>
        
        {eventSent && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6" role="alert">
            <p className="font-bold">已发送事件</p>
            <p>类型: {eventType}</p>
            <p>
              {settings.analyticsEnabled 
                ? '分析已启用，事件应该已被记录。' 
                : '分析已禁用，事件不会被记录。'}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => testAnalyticsEvent('页面')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            发送页面事件
          </button>
          <button
            onClick={() => testAnalyticsEvent('按钮')}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            发送按钮事件
          </button>
          <button
            onClick={() => testAnalyticsEvent('搜索')}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            发送搜索事件
          </button>
        </div>
      </div>
      
      {/* 测试Google AdSense */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">测试Google AdSense</h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          下面是一个测试广告单元。如果AdSense已启用，广告将显示在这里。
          在开发环境中，您可能看不到实际广告，但可以检查网络请求确认是否加载了AdSense脚本。
        </p>
        
        <div className="border border-dashed border-gray-300 p-4 rounded-lg">
          <p className="text-sm text-gray-500 mb-2">测试广告单元</p>
          <AdUnit 
            slot="1234567890" 
            format="horizontal"
            className="bg-gray-100 rounded-lg min-h-[90px]"
          />
        </div>
        
        <div className="mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            如果您看不到广告，可能是因为：
          </p>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <li>您已禁用广告Cookie</li>
            <li>您正在使用广告拦截器</li>
            <li>您在开发环境中（AdSense在开发环境中不显示实际广告）</li>
            <li>AdSense账户尚未批准该网站</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 移除PrivacyTestWithSuspense组件，只导出PrivacyTestContent组件

'use client';

import { useEffect, useRef } from 'react';
import { event, ANALYTICS_EVENTS } from '@/lib/analytics';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onAdLoad?: () => void;
}

export default function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
  onAdLoad
}: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adLoaded = useRef(false);

  useEffect(() => {
    // 确保只在客户端渲染
    if (typeof window === 'undefined') return;
    
    // 确保AdSense已加载
    if (window.adsbygoogle === undefined) {
      console.warn('AdSense not loaded yet');
      return;
    }

    // 确保广告只加载一次
    if (adLoaded.current) return;
    
    try {
      // 创建新的广告插槽
      const adElement = adRef.current;
      if (!adElement) return;
      
      // 清空现有内容
      while (adElement.firstChild) {
        adElement.removeChild(adElement.firstChild);
      }
      
      // 创建ins元素
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      
      // 设置广告属性
      ins.setAttribute('data-ad-client', 'ca-pub-2044354603819805');
      ins.setAttribute('data-ad-slot', slot);
      
      if (responsive) {
        ins.setAttribute('data-ad-format', format);
        ins.setAttribute('data-full-width-responsive', 'true');
      }
      
      // 添加到DOM
      adElement.appendChild(ins);
      
      // 加载广告
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      
      // 标记为已加载
      adLoaded.current = true;
      
      // 触发回调
      if (onAdLoad) onAdLoad();
      
      // 记录广告展示事件
      event({
        action: ANALYTICS_EVENTS.AD.IMPRESSION,
        category: '广告',
        label: `广告位-${slot}`
      });
    } catch (error) {
      console.error('AdSense error:', error);
    }
    
    // 组件卸载时清理
    return () => {
      adLoaded.current = false;
    };
  }, [slot, format, responsive, onAdLoad]);

  return (
    <div 
      ref={adRef} 
      className={`ad-container ${className}`}
      style={{ 
        minHeight: '100px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '1rem 0',
        ...style
      }}
      onClick={() => {
        // 记录广告点击事件
        event({
          action: ANALYTICS_EVENTS.AD.CLICK,
          category: '广告',
          label: `广告位-${slot}`
        });
      }}
    />
  );
}

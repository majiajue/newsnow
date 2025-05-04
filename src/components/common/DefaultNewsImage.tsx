import React from 'react';

interface DefaultNewsImageProps {
  title?: string;
  className?: string;
}

/**
 * 默认新闻图片组件 - 当文章没有图片时显示的SVG图像
 * 使用现代化设计风格
 */
const DefaultNewsImage: React.FC<DefaultNewsImageProps> = ({ title, className = "w-full h-full" }) => {
  // 从标题生成随机颜色，使不同文章的默认图像有所区别
  const getGradientFromTitle = (title?: string): {start: string, end: string} => {
    if (!title) return { start: '#4F46E5', end: '#7C3AED' }; // 默认渐变
    
    // 从标题生成一个数字
    const hash = title.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // 预定义一组现代感强的渐变色组合
    const gradients = [
      { start: '#4F46E5', end: '#7C3AED' }, // 蓝紫
      { start: '#2563EB', end: '#3B82F6' }, // 蓝色
      { start: '#0891B2', end: '#06B6D4' }, // 青色
      { start: '#0D9488', end: '#14B8A6' }, // 蓝绿
      { start: '#059669', end: '#10B981' }, // 绿色
      { start: '#6366F1', end: '#8B5CF6' }, // 靛蓝紫
      { start: '#EC4899', end: '#F472B6' }, // 粉红
      { start: '#F97316', end: '#FB923C' }, // 橙色
      { start: '#EF4444', end: '#F87171' }, // 红色
      { start: '#8B5CF6', end: '#A78BFA' }, // 紫色
    ];
    
    // 根据hash选择一组渐变色
    const colorIndex = hash % gradients.length;
    return gradients[colorIndex];
  };
  
  const gradient = getGradientFromTitle(title);
  const uniqueId = `gradient-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={`bg-gray-50 flex items-center justify-center ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 400 225" 
        xmlns="http://www.w3.org/2000/svg"
        className="max-w-full max-h-full"
      >
        <defs>
          <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
          
          {/* 波浪图案 */}
          <pattern id="wave-pattern" patternUnits="userSpaceOnUse" width="100" height="20" patternTransform="rotate(10)">
            <path d="M0,10 C15,0 35,20 50,10 C65,0 85,20 100,10 L100,0 L0,0 Z" fill={gradient.start} opacity="0.1" />
          </pattern>
          
          {/* 点阵图案 */}
          <pattern id="dots-pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
            <circle cx="5" cy="5" r="1" fill={gradient.end} opacity="0.2" />
          </pattern>
          
          {/* 剪裁路径 */}
          <clipPath id="rounded-clip">
            <rect x="30" y="30" width="340" height="165" rx="15" />
          </clipPath>
        </defs>
        
        {/* 背景 */}
        <rect width="400" height="225" fill="#f9fafb" />
        <rect width="400" height="225" fill="url(#dots-pattern)" />
        
        {/* 主要设计元素 */}
        <g clipPath="url(#rounded-clip)">
          {/* 波浪背景 */}
          <rect x="0" y="0" width="400" height="225" fill="url(#wave-pattern)" />
          
          {/* 现代几何形状 */}
          <circle cx="320" cy="50" r="80" fill={`url(#${uniqueId})`} opacity="0.1" />
          <circle cx="80" cy="180" r="60" fill={`url(#${uniqueId})`} opacity="0.15" />
          
          {/* 主要图形 */}
          <rect x="150" y="70" width="100" height="5" rx="2.5" fill={`url(#${uniqueId})`} opacity="0.7" />
          <rect x="150" y="85" width="140" height="5" rx="2.5" fill={`url(#${uniqueId})`} opacity="0.5" />
          <rect x="150" y="100" width="80" height="5" rx="2.5" fill={`url(#${uniqueId})`} opacity="0.3" />
          
          {/* 装饰元素 */}
          <circle cx="120" cy="90" r="25" fill={`url(#${uniqueId})`} />
          
          {/* 抽象图形 */}
          <path d="M300,120 L340,160 L300,160 Z" fill={`url(#${uniqueId})`} opacity="0.6" />
          <path d="M60,60 L100,60 L80,100 Z" fill={`url(#${uniqueId})`} opacity="0.4" />
        </g>
        
        {/* 底部文字 */}
        <g transform="translate(200, 180)">
          <rect x="-80" y="-15" width="160" height="30" rx="15" fill={`url(#${uniqueId})`} opacity="0.9" />
          <text 
            x="0" 
            y="5" 
            fontFamily="'Segoe UI', Arial, sans-serif" 
            fontSize="14" 
            fontWeight="bold"
            textAnchor="middle" 
            fill="white"
            letterSpacing="0.5"
            style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}
          >
            财经新闻
          </text>
        </g>
      </svg>
    </div>
  );
};

export default DefaultNewsImage;

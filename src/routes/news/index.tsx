/**
 * 新闻模块首页
 */
import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/news/')({
  component: NewsIndexPage,
});

function NewsIndexPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-10">新闻聚合平台</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <Link
          to="/news/flash"
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">财联社快讯</h2>
          <p className="text-gray-600 mb-4">
            实时获取财联社最新快讯，掌握市场动态和热点事件。
          </p>
          <div className="text-blue-500 font-medium">
            查看快讯 →
          </div>
        </Link>
        
        <Link
          to="/news/articles"
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">财联社文章</h2>
          <p className="text-gray-600 mb-4">
            浏览财联社深度文章，了解行业分析和专业观点。
          </p>
          <div className="text-blue-500 font-medium">
            浏览文章 →
          </div>
        </Link>
        
        <Link
          to="/news/ai"
          className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">AI新闻分析</h2>
          <p className="text-gray-600 mb-4">
            使用AI技术抓取新闻内容，自动生成深度分析和专业评论。
          </p>
          <div className="text-blue-500 font-medium">
            体验AI分析 →
          </div>
        </Link>
      </div>
      
      <div className="mt-12 text-center">
        <Link
          to="/"
          className="text-blue-500 hover:text-blue-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

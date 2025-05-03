/**
 * AI新闻页面
 * 展示AI抓取和分析的新闻内容
 */
import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

export const Route = createFileRoute('/news/ai')({
  component: AINewsPage,
});

// 定义新闻分析结果类型
interface NewsAnalysis {
  summary: string;
  background: string;
  impact: string;
  opinion: string;
  suggestions: string;
  keywords?: string[];
  sentiment?: string;
  generatedAt: string;
}

// 定义新闻文章类型
interface NewsArticle {
  url: string;
  title: string;
  content: string;
  source?: string;
  publishDate?: string;
  analysis?: NewsAnalysis;
}

function AINewsPage() {
  const [url, setUrl] = useState('');
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [activeTab, setActiveTab] = useState('content');

  // 使用useMutation处理API请求
  const fetchArticleMutation = useMutation({
    mutationFn: async (articleUrl: string) => {
      const response = await axios.post('/api/aiNews/fetch', { url: articleUrl });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setArticle(data.data);
      }
    },
  });

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      fetchArticleMutation.mutate(url);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">AI新闻分析</h1>
      
      {/* 输入表单 */}
      <form onSubmit={handleSubmit} className="mb-8 max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入新闻文章URL"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={fetchArticleMutation.isPending}
          >
            {fetchArticleMutation.isPending ? '分析中...' : '分析文章'}
          </button>
        </div>
      </form>
      
      {/* 加载状态 */}
      {fetchArticleMutation.isPending && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">正在获取并分析文章，请稍候...</p>
        </div>
      )}
      
      {/* 错误信息 */}
      {fetchArticleMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 max-w-3xl mx-auto">
          <p className="font-medium">处理失败</p>
          <p className="text-sm">{(fetchArticleMutation.error as any)?.message || '获取文章时发生错误'}</p>
        </div>
      )}
      
      {/* 文章内容 */}
      {article && (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          {/* 文章标题和来源 */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
            {article.source && (
              <p className="text-gray-500 text-sm">
                来源: {article.source} | 
                {article.publishDate && ` 发布时间: ${new Date(article.publishDate).toLocaleString()}`}
              </p>
            )}
          </div>
          
          {/* 标签页导航 */}
          <div className="border-b">
            <nav className="flex">
              <button
                className={`px-4 py-3 font-medium ${activeTab === 'content' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('content')}
              >
                原文内容
              </button>
              <button
                className={`px-4 py-3 font-medium ${activeTab === 'analysis' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('analysis')}
                disabled={!article.analysis}
              >
                AI分析
              </button>
            </nav>
          </div>
          
          {/* 内容区域 */}
          <div className="p-6">
            {activeTab === 'content' ? (
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              </div>
            ) : article.analysis ? (
              <div className="space-y-6">
                {/* 摘要 */}
                <section>
                  <h3 className="text-xl font-semibold mb-2">内容摘要</h3>
                  <p className="text-gray-700">{article.analysis.summary}</p>
                </section>
                
                {/* 关键词 */}
                {article.analysis.keywords && article.analysis.keywords.length > 0 && (
                  <section>
                    <h3 className="text-xl font-semibold mb-2">关键词</h3>
                    <div className="flex flex-wrap gap-2">
                      {article.analysis.keywords.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* 背景分析 */}
                <section>
                  <h3 className="text-xl font-semibold mb-2">背景分析</h3>
                  <p className="text-gray-700">{article.analysis.background}</p>
                </section>
                
                {/* 影响分析 */}
                <section>
                  <h3 className="text-xl font-semibold mb-2">潜在影响</h3>
                  <p className="text-gray-700">{article.analysis.impact}</p>
                </section>
                
                {/* 专业观点 */}
                <section>
                  <h3 className="text-xl font-semibold mb-2">专业观点</h3>
                  <p className="text-gray-700">{article.analysis.opinion}</p>
                </section>
                
                {/* 建议与展望 */}
                <section>
                  <h3 className="text-xl font-semibold mb-2">建议与展望</h3>
                  <p className="text-gray-700">{article.analysis.suggestions}</p>
                </section>
                
                {/* 情感倾向 */}
                {article.analysis.sentiment && (
                  <section>
                    <h3 className="text-xl font-semibold mb-2">情感倾向</h3>
                    <p className="text-gray-700">{article.analysis.sentiment}</p>
                  </section>
                )}
                
                {/* 生成时间 */}
                <div className="text-right text-gray-500 text-sm mt-4">
                  分析生成于: {new Date(article.analysis.generatedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                未找到分析结果
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

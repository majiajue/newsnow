/**
 * 财联社新闻详情组件
 */
import React from 'react';
import { CLSNewsItem } from '~/hooks/useClsNews';

interface ClsNewsDetailProps {
  article: CLSNewsItem | null;
  loading: boolean;
  error: string | null;
}

export function ClsNewsDetail({ article, loading, error }: ClsNewsDetailProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>加载失败: {error}</p>
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          重试
        </button>
      </div>
    );
  }

  if (!article) {
    return <div className="text-gray-500 p-4 text-center">暂无数据</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{article.title}</h1>
      
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <span>{article.source}</span>
        {article.author && (
          <>
            <span className="mx-2">•</span>
            <span>{article.author}</span>
          </>
        )}
        <span className="mx-2">•</span>
        <span>{new Date(article.pubDate).toLocaleString('zh-CN')}</span>
      </div>
      
      {article.imageUrl && (
        <div className="mb-6">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}
      
      {article.content ? (
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      ) : (
        <p className="text-lg">{article.summary}</p>
      )}
      
      {article.tags && article.tags.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

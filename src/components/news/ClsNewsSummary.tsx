/**
 * 财联社文章摘要和评论组件
 */
import { useState } from 'react';
import { useClsSummary, CLSArticleWithSummary } from '~/hooks/useClsSummary';

interface ClsNewsSummaryProps {
  initialIdOrUrl?: string;
}

export function ClsNewsSummary({ initialIdOrUrl }: ClsNewsSummaryProps) {
  const [idOrUrl, setIdOrUrl] = useState(initialIdOrUrl || '');
  const { article, loading, error, generateSummary } = useClsSummary();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idOrUrl.trim()) {
      generateSummary(idOrUrl.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">财联社文章摘要生成器</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={idOrUrl}
            onChange={(e) => setIdOrUrl(e.target.value)}
            placeholder="输入文章ID或URL"
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading || !idOrUrl.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : '生成摘要和评论'}
          </button>
        </div>
      </form>
      
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
          <p className="font-medium">错误</p>
          <p>{error}</p>
        </div>
      )}
      
      {article && !loading && !error && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold">{article.title}</h3>
            <div className="text-sm text-gray-500 mt-1">
              <span>{article.source}</span>
              {article.author && <span> · {article.author}</span>}
              <span> · {new Date(article.pubDate).toLocaleString('zh-CN')}</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">摘要</h4>
            <div className="bg-gray-50 p-4 rounded text-gray-800">
              {article.summary}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">评论</h4>
            <div className="bg-gray-50 p-4 rounded text-gray-800">
              {article.comment}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline"
            >
              阅读原文
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

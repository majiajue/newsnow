import { useState, useEffect } from 'react';
import { useClsJinjiaSummary } from '../../hooks/useClsJinjiaSummary';

interface ClsJinjiaNewsSummaryProps {
  initialUrl?: string;
}

export function ClsJinjiaNewsSummary({ initialUrl = '' }: ClsJinjiaNewsSummaryProps) {
  const [idOrUrl, setIdOrUrl] = useState(initialUrl);
  const { summary, loading, error, fetchSummary } = useClsJinjiaSummary();

  useEffect(() => {
    if (initialUrl) {
      setIdOrUrl(initialUrl);
      // 如果有初始URL，自动获取摘要
      fetchSummary({ url: initialUrl });
    }
  }, [initialUrl, fetchSummary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idOrUrl.trim()) return;

    // 判断输入是 ID 还是 URL
    const isUrl = idOrUrl.startsWith('http');
    const payload = isUrl ? { url: idOrUrl } : { id: idOrUrl };
    
    fetchSummary(payload);
  };

  return (
    <div className="cls-news-summary">
      <h2>财联社文章摘要（金佳API）</h2>
      <p className="text-sm text-gray-500 mb-4">输入财联社文章ID或完整URL，获取AI生成的摘要和评论</p>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={idOrUrl} 
            onChange={(e) => setIdOrUrl(e.target.value)} 
            placeholder="输入文章ID或URL" 
            className="flex-1 p-2 border rounded"
            required 
          />
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? '生成中...' : '获取摘要'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {summary && (
        <div className="bg-white shadow-md rounded p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-2">{summary.article.title}</h3>
            <div className="text-sm text-gray-500 mb-4">
              {summary.article.author && <span>作者: {summary.article.author} | </span>}
              {summary.article.pubDate && <span>发布时间: {new Date(summary.article.pubDate).toLocaleString()} | </span>}
              <a href={summary.article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                查看原文
              </a>
            </div>
            {summary.article.imageUrl && (
              <img 
                src={summary.article.imageUrl} 
                alt={summary.article.title} 
                className="max-w-full h-auto mb-4 rounded"
              />
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-lg mb-2">AI 摘要</h4>
            <div className="bg-gray-50 p-4 rounded">
              {summary.ai.summary}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-lg mb-2">AI 评论</h4>
            <div className="bg-gray-50 p-4 rounded">
              {summary.ai.comment}
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-500">查看原始内容</summary>
            <div className="mt-2 p-4 bg-gray-50 rounded text-sm max-h-96 overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: summary.article.content }} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

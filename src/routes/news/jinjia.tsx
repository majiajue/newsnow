/**
 * 金佳 API 方法获取财联社新闻
 */
import { useState, useEffect } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ClsJinjiaNewsSummary } from '../../components/news/ClsJinjiaNewsSummary';

export const Route = createFileRoute('/news/jinjia')({
  component: JinjiaNewsPage,
});

interface NewsItem {
  id: string;
  title: string;
  url: string;
}

function JinjiaNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'summary'>('list');
  const [selectedArticle, setSelectedArticle] = useState<string>('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        // 直接使用金佳 API 获取财联社快讯
        const response = await fetch('https://www.cls.cn/nodeapi/updateTelegraphList', {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.cls.cn/telegraph',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Origin': 'https://www.cls.cn'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP 错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 尝试不同的数据格式
        let newsItems = [];
        
        if (data.code === 0 && data.data?.roll_data?.list) {
          // 标准格式
          newsItems = data.data.roll_data.list
            .filter((item: any) => !item.is_ad)
            .map((item: any) => ({
              id: item.id,
              title: item.title || item.brief,
              url: item.shareurl || `https://www.cls.cn/detail/${item.id}`
            }));
        } else if (data.error === 0 && Array.isArray(data.data?.roll_data)) {
          // 新格式
          newsItems = data.data.roll_data
            .filter((item: any) => !item.is_ad)
            .map((item: any) => ({
              id: item.id,
              title: item.title || item.brief,
              url: item.shareurl || `https://www.cls.cn/detail/${item.id}`
            }));
        } else {
          throw new Error('获取财联社快讯失败：未知的数据格式');
        }
          
        setNews(newsItems);
      } catch (err: any) {
        console.error('获取财联社快讯出错:', err);
        setError(err.message || '获取财联社快讯出错');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'list') {
      fetchNews();
    }
  }, [activeTab]);

  const handleGenerateSummary = (item: NewsItem) => {
    setSelectedArticle(item.url);
    setActiveTab('summary');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">财联社新闻 (金佳 API)</h1>
      
      <div className="flex border-b mb-6">
        <button 
          className={`px-4 py-2 ${activeTab === 'list' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('list')}
        >
          快讯列表
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('summary')}
        >
          文章摘要生成
        </button>
      </div>
      
      {activeTab === 'list' && (
        <>
          {loading && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 p-4 text-center">
              <p>加载失败: {error}</p>
              <button 
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                重试
              </button>
            </div>
          )}
          
          {!loading && !error && news.length === 0 && (
            <div className="text-gray-500 p-4 text-center">暂无数据</div>
          )}
          
          {news.length > 0 && (
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="border-b pb-4">
                  <div className="flex justify-between items-center">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    </a>
                    <button
                      onClick={() => handleGenerateSummary(item)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      生成摘要
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'summary' && (
        <ClsJinjiaNewsSummary initialUrl={selectedArticle} />
      )}
      
      <div className="mt-8 text-center">
        <Link
          to="/news"
          className="text-blue-500 hover:text-blue-700"
        >
          返回新闻首页
        </Link>
      </div>
    </div>
  );
}

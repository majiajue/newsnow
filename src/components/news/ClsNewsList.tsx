/**
 * 财联社新闻列表组件
 */
import { Link } from '@tanstack/react-router';
import { CLSNewsItem } from '~/hooks/useClsNews';

interface ClsNewsListProps {
  news: CLSNewsItem[];
  loading: boolean;
  error: string | null;
  type?: 'flash' | 'article';
}

export function ClsNewsList({ news, loading, error, type = 'flash' }: ClsNewsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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

  if (!news || news.length === 0) {
    return <div className="text-gray-500 p-4 text-center">暂无数据</div>;
  }

  return (
    <div className="space-y-4">
      {news.map((item) => (
        <div key={item.id} className="border-b pb-4">
          <Link
            to={type === 'flash' ? '/news/flash/$id' : '/news/article/$id'}
            params={{ id: item.id }}
            className="block hover:bg-gray-50 p-2 rounded transition-colors"
          >
            <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
            {item.summary && (
              <p className="mt-1 text-gray-600 text-sm line-clamp-2">{item.summary}</p>
            )}
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <span>{item.source}</span>
              <span className="mx-2">•</span>
              <span>{new Date(item.pubDate).toLocaleString('zh-CN')}</span>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

/**
 * 新闻模块布局
 */
import { Outlet, Link, useMatches } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/news/_layout')({
  component: NewsLayout,
});

function NewsLayout() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || '';

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center py-4 overflow-x-auto">
            <Link
              to="/news"
              className={`mr-6 py-2 whitespace-nowrap ${isActive('/news') ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              首页
            </Link>
            <Link
              to="/news/flash"
              className={`mr-6 py-2 whitespace-nowrap ${isActive('/news/flash') ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              财联社快讯
            </Link>
            <Link
              to="/news/articles"
              className={`mr-6 py-2 whitespace-nowrap ${isActive('/news/articles') ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              财联社文章
            </Link>
            <Link
              to="/news/jinjia"
              className={`mr-6 py-2 whitespace-nowrap ${isActive('/news/jinjia') ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              金佳API方式
            </Link>
            <Link
              to="/news/summary"
              className={`mr-6 py-2 whitespace-nowrap ${isActive('/news/summary') ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              文章摘要
            </Link>
          </div>
        </div>
      </div>
      
      <Outlet />
    </div>
  );
}

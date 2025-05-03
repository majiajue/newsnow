/**
 * 财联社文章摘要页面
 */
import { createFileRoute, Link } from '@tanstack/react-router';
import { ClsNewsSummary } from '~/components/news/ClsNewsSummary';

export const Route = createFileRoute('/news/summary')({
  component: NewsSummaryPage,
});

function NewsSummaryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">财联社文章摘要</h1>
      
      <div className="mb-4">
        <Link 
          to="/news"
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回新闻首页
        </Link>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <ClsNewsSummary />
      </div>
    </div>
  );
}

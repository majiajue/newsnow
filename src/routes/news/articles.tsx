/**
 * 财联社文章列表页面
 */
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useClsArticles } from '~/hooks/useClsNews';

export const Route = createFileRoute('/news/articles')({
  component: ArticlesPage,
});

function ArticlesPage() {
  const [page, setPage] = useState(1);
  const { articles, loading, error, pagination, fetchArticles } = useClsArticles(page, 20);
  const [activeCategory, setActiveCategory] = useState('全部');

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchArticles(newPage, pagination.pageSize);
  };

  const handleCategoryFilter = (category: string) => {
    setActiveCategory(category);
    // 这里可以添加实际的过滤逻辑
    console.log('过滤分类:', category);
  };

  return (
    <div className="container my-4">
      {/* 焦点新闻 */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="section-heading">今日焦点</h2>
        </div>
        <div className="col-md-8">
          <div className="card news-card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="card-tag tech">科技</span>
                  <span className="card-tag business">商业</span>
                </div>
                <span className="news-date">{new Date().toLocaleDateString()}</span>
              </div>
              <h5 className="card-title">人工智能技术革新：大模型如何改变我们的工作方式</h5>
              <p className="news-source">来源：财联社</p>
              <p className="card-text">随着ChatGPT、Claude和Gemini等大型语言模型的出现，人工智能正在以前所未有的方式改变我们的工作方式。这些模型不仅能够理解和生成人类语言，还能执行各种复杂任务...</p>
              <a href={`/news/article/featured-1`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card news-card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="card-tag business">商业</span>
                </div>
                <span className="news-date">{new Date().toLocaleDateString()}</span>
              </div>
              <h5 className="card-title">全球市场波动：投资者如何应对不确定性</h5>
              <p className="news-source">来源：财联社</p>
              <p className="card-text">全球经济面临多重挑战，从地缘政治紧张到通胀压力，投资者需要制定明智的策略来应对市场波动...</p>
              <a href={`/news/article/featured-2`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
          <div className="card news-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="card-tag health">健康</span>
                </div>
                <span className="news-date">{new Date().toLocaleDateString()}</span>
              </div>
              <h5 className="card-title">医疗科技突破：新一代健康监测设备问世</h5>
              <p className="news-source">来源：财联社</p>
              <p className="card-text">随着可穿戴技术的进步，新一代健康监测设备正在改变人们管理健康的方式...</p>
              <a href={`/news/article/featured-3`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
        </div>
      </div>
      
      {/* 分类过滤器 */}
      <div className="category-filter">
        {['全部', '科技', '商业', '政治', '健康', '教育', '环境', '娱乐'].map(category => (
          <button 
            key={category}
            className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* 新闻列表 */}
      <div className="row">
        <div className="col-12">
          <h2 className="section-heading">最新资讯</h2>
        </div>
        
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">加载中...</span>
            </div>
          </div>
        ) : error ? (
          <div className="col-12 text-center py-5">
            <div className="alert alert-danger">
              加载失败: {error}
              <button className="btn btn-outline-danger ms-3" onClick={() => fetchArticles(page, pagination.pageSize)}>
                重试
              </button>
            </div>
          </div>
        ) : (
          <>
            {articles.map((article) => (
              <div key={article.id} className="col-md-4 mb-4">
                <div className="card news-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="card-tag tech">财经</span>
                      </div>
                      <span className="news-date">{new Date(article.pubDate || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <h5 className="card-title">{article.title}</h5>
                    <p className="news-source">来源：{article.source || '财联社'}</p>
                    <p className="card-text">{article.summary || article.content?.substring(0, 100) + '...'}</p>
                    <a 
                      href={`/news/article/${article.id}?title=${encodeURIComponent(article.title)}`}
                      className="view-detail-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/news/article/${article.id}?title=${encodeURIComponent(article.title)}`;
                      }}
                    >
                      阅读全文 <i className="bi bi-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* 分页 */}
      {!loading && !error && articles.length > 0 && (
        <nav aria-label="Page navigation" className="my-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
              <a 
                className="page-link" 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) handlePageChange(page - 1);
                }}
                tabIndex={page <= 1 ? -1 : undefined}
                aria-disabled={page <= 1 ? 'true' : undefined}
              >
                上一页
              </a>
            </li>
            {[...Array(3)].map((_, i) => (
              <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                <a 
                  className="page-link" 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(i + 1);
                  }}
                >
                  {i + 1}
                </a>
              </li>
            ))}
            <li className="page-item">
              <a 
                className="page-link" 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(page + 1);
                }}
              >
                下一页
              </a>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

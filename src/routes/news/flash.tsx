/**
 * 财联社快讯页面
 */
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useClsFlashNews } from '~/hooks/useClsNews';

export const Route = createFileRoute('/news/flash')({
  component: FlashNewsPage,
});

function FlashNewsPage() {
  const [page, setPage] = useState(1);
  const { news, loading, error, pagination, fetchNews } = useClsFlashNews(page, 20);
  const [activeCategory, setActiveCategory] = useState('全部');

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchNews(newPage, pagination.pageSize);
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
          <h2 className="section-heading">今日快讯焦点</h2>
        </div>
        <div className="col-md-8">
          <div className="card news-card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="card-tag tech">财经</span>
                  <span className="card-tag business">快讯</span>
                </div>
                <span className="news-date">{new Date().toLocaleDateString()}</span>
              </div>
              <h5 className="card-title">央行发布最新货币政策报告，强调稳健基调</h5>
              <p className="news-source">来源：财联社</p>
              <p className="card-text">央行今日发布第一季度货币政策执行报告，强调将继续实施稳健的货币政策，灵活适度，保持流动性合理充裕，引导金融机构加大对实体经济的支持力度...</p>
              <a href={`/news/article/flash-1`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card news-card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="card-tag business">市场</span>
                </div>
                <span className="news-date">{new Date().toLocaleDateString()}</span>
              </div>
              <h5 className="card-title">沪指收盘上涨0.8%，科技板块领涨</h5>
              <p className="news-source">来源：财联社</p>
              <p className="card-text">今日A股市场震荡上行，沪指收涨0.8%，创业板指涨1.2%，科技、新能源等板块表现活跃，北向资金净流入超20亿元...</p>
              <a href={`/news/article/flash-2`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
          <div className="card news-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="card-tag health">国际</span>
                </div>
                <span className="news-date">{new Date().toLocaleDateString()}</span>
              </div>
              <h5 className="card-title">美联储维持利率不变，暗示年内可能降息</h5>
              <p className="news-source">来源：财联社</p>
              <p className="card-text">美联储宣布维持联邦基金利率目标区间不变，但表示随着通胀压力缓解，今年晚些时候可能开始降息...</p>
              <a href={`/news/article/flash-3`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
            </div>
          </div>
        </div>
      </div>
      
      {/* 分类过滤器 */}
      <div className="category-filter">
        {['全部', '财经', '股市', '债市', '汇市', '商品', '公司', '国际'].map(category => (
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
          <h2 className="section-heading">最新快讯</h2>
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
              <button className="btn btn-outline-danger ms-3" onClick={() => fetchNews(page, pagination.pageSize)}>
                重试
              </button>
            </div>
          </div>
        ) : (
          <>
            {news.map((item, index) => (
              <div key={item.id || index} className="col-md-4 mb-4">
                <div className="card news-card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="card-tag tech">快讯</span>
                      </div>
                      <span className="news-date">{new Date(item.pubDate || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <h5 className="card-title">{item.title}</h5>
                    <p className="news-source">来源：{item.source || '财联社'}</p>
                    <p className="card-text">{item.summary || item.content?.substring(0, 100) + '...'}</p>
                    <a href={`/news/article/${item.id}`} className="view-detail-btn">阅读全文与AI分析 <i className="bi bi-arrow-right"></i></a>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* 分页 */}
      {!loading && !error && news.length > 0 && (
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

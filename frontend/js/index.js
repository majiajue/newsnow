/**
 * NewNow财经 首页脚本
 * 负责文章列表加载和展示功能
 */

// 当前页码
let currentPage = 1;
// 当前文章来源筛选
let currentSource = null;
// 是否全部加载完毕
let allLoaded = false;
// 是否正在加载
let isLoading = false;

// DOM元素
const articlesContainer = document.getElementById('articles-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const articlesLoading = document.getElementById('articles-loading');
const flashNewsContainer = document.getElementById('flash-news-container');
const statsContainer = document.getElementById('stats-container');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 初始化页面
  initPage();
  
  // 添加事件监听器
  setupEventListeners();
  
  // 检查API健康状态
  checkApiStatus();
});

// 初始化页面
function initPage() {
  // 加载文章列表
  loadArticles();
  
  // 加载侧边栏快讯
  loadFlashNews();
  
  // 加载统计信息
  loadStats();
}

// 设置事件监听器
function setupEventListeners() {
  // 加载更多按钮点击事件
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      if (!isLoading && !allLoaded) {
        currentPage++;
        loadArticles(currentPage);
      }
    });
  }
  
  // 搜索表单提交事件
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
      }
    });
  }
}

// 检查API健康状态
function checkApiStatus() {
  checkApiHealth()
    .then(response => {
      if (response.error) {
        showApiError();
      }
    })
    .catch(() => {
      showApiError();
    });
}

// 显示API错误
function showApiError() {
  // 创建错误提示
  const errorAlert = document.createElement('div');
  errorAlert.className = 'alert alert-danger text-center';
  errorAlert.role = 'alert';
  errorAlert.innerHTML = `
    <i class="bi bi-exclamation-triangle me-2"></i>
    <strong>API连接错误</strong>：无法连接到后端服务器，请检查API配置或稍后重试。
  `;
  
  // 添加到页面顶部
  const container = document.querySelector('.container');
  if (container) {
    container.insertBefore(errorAlert, container.firstChild);
  }
}

// 加载文章列表
function loadArticles(page = 1) {
  // 防止重复加载
  if (isLoading) return;
  
  isLoading = true;
  
  // 更新加载更多按钮状态
  updateLoadMoreButton(true);
  
  // 如果是第一页，显示加载状态
  if (page === 1 && articlesLoading) {
    articlesLoading.style.display = 'block';
    if (articlesContainer) {
      articlesContainer.innerHTML = '';
    }
  }
  
  // 调用API获取文章列表
  getArticles(page, DEFAULT_CONFIG.articlesPerPage, currentSource)
    .then(response => {
      // 隐藏加载状态
      if (articlesLoading) {
        articlesLoading.style.display = 'none';
      }
      
      // 处理API响应
      if (response.error) {
        showErrorMessage(response.error);
        isLoading = false;
        updateLoadMoreButton(false);
        return;
      }
      
      // 获取文章列表
      const articles = response.articles || [];
      
      // 检查是否全部加载完毕
      if (articles.length < DEFAULT_CONFIG.articlesPerPage) {
        allLoaded = true;
      }
      
      // 渲染文章列表
      renderArticles(articles, page > 1);
      
      // 更新状态
      isLoading = false;
      updateLoadMoreButton(false);
    })
    .catch(error => {
      console.error('加载文章列表失败:', error);
      
      // 隐藏加载状态
      if (articlesLoading) {
        articlesLoading.style.display = 'none';
      }
      
      // 显示错误消息
      showErrorMessage('加载文章列表失败，请稍后重试');
      
      // 更新状态
      isLoading = false;
      updateLoadMoreButton(false);
    });
}

// 更新加载更多按钮状态
function updateLoadMoreButton(loading) {
  if (!loadMoreBtn) return;
  
  const loadMoreText = document.getElementById('load-more-text');
  const loadMoreSpinner = document.getElementById('load-more-spinner');
  
  if (loading) {
    // 加载中状态
    loadMoreBtn.disabled = true;
    if (loadMoreText) loadMoreText.textContent = '加载中...';
    if (loadMoreSpinner) loadMoreSpinner.classList.remove('d-none');
  } else {
    // 加载完成状态
    loadMoreBtn.disabled = false;
    
    if (allLoaded) {
      loadMoreBtn.disabled = true;
      if (loadMoreText) loadMoreText.textContent = '已加载全部';
    } else {
      if (loadMoreText) loadMoreText.textContent = '加载更多';
    }
    
    if (loadMoreSpinner) loadMoreSpinner.classList.add('d-none');
  }
}

// 渲染文章列表
function renderArticles(articles, append = false) {
  if (!articlesContainer) return;
  
  // 如果没有文章
  if (articles.length === 0 && !append) {
    articlesContainer.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        暂无文章，请稍后再试
      </div>
    `;
    return;
  }
  
  // 创建文章HTML
  let articlesHtml = '';
  
  articles.forEach(article => {
    articlesHtml += generateArticleCard(article);
  });
  
  // 添加到容器
  if (append) {
    articlesContainer.innerHTML += articlesHtml;
  } else {
    articlesContainer.innerHTML = articlesHtml;
  }
}

// 加载快讯
function loadFlashNews() {
  if (!flashNewsContainer) return;
  
  // 调用API获取快讯
  getFlashNews(DEFAULT_CONFIG.flashNewsCount)
    .then(response => {
      // 处理API响应
      if (response.error) {
        flashNewsContainer.innerHTML = `
          <div class="alert alert-warning small">
            <i class="bi bi-exclamation-circle me-2"></i>
            加载快讯失败：${response.error}
          </div>
        `;
        return;
      }
      
      // 获取快讯列表
      const flashItems = response.flashes || [];
      
      // 渲染快讯
      renderFlashNews(flashItems);
    })
    .catch(error => {
      console.error('加载快讯失败:', error);
      
      // 显示错误消息
      flashNewsContainer.innerHTML = `
        <div class="alert alert-warning small">
          <i class="bi bi-exclamation-circle me-2"></i>
          加载快讯失败，请稍后重试
        </div>
      `;
    });
}

// 渲染快讯
function renderFlashNews(flashItems) {
  if (!flashNewsContainer) return;
  
  // 如果没有快讯
  if (flashItems.length === 0) {
    flashNewsContainer.innerHTML = `
      <div class="text-center text-muted py-3">
        暂无快讯
      </div>
    `;
    return;
  }
  
  // 创建快讯HTML
  let flashHtml = '';
  
  flashItems.forEach(flash => {
    flashHtml += generateFlashItem(flash);
  });
  
  // 添加到容器
  flashNewsContainer.innerHTML = flashHtml;
}

// 加载统计信息
function loadStats() {
  if (!statsContainer) return;
  
  // 调用API获取统计信息
  getStats()
    .then(response => {
      // 处理API响应
      if (response.error) {
        statsContainer.innerHTML = `
          <div class="alert alert-warning small">
            <i class="bi bi-exclamation-circle me-2"></i>
            加载统计信息失败：${response.error}
          </div>
        `;
        return;
      }
      
      // 渲染统计信息
      renderStats(response);
    })
    .catch(error => {
      console.error('加载统计信息失败:', error);
      
      // 显示错误消息
      statsContainer.innerHTML = `
        <div class="alert alert-warning small">
          <i class="bi bi-exclamation-circle me-2"></i>
          加载统计信息失败，请稍后重试
        </div>
      `;
    });
}

// 渲染统计信息
function renderStats(stats) {
  if (!statsContainer) return;
  
  // 创建统计信息HTML
  let statsHtml = '';
  
  // 添加文章数量
  if (stats.article_count !== undefined) {
    statsHtml += `
      <div class="stats-item">
        <span class="stats-label">收录文章</span>
        <span class="stats-value">${stats.article_count.toLocaleString()}</span>
      </div>
    `;
  }
  
  // 添加来源数量
  if (stats.source_count !== undefined) {
    statsHtml += `
      <div class="stats-item">
        <span class="stats-label">数据来源</span>
        <span class="stats-value">${stats.source_count}</span>
      </div>
    `;
  }
  
  // 添加今日更新数量
  if (stats.today_count !== undefined) {
    statsHtml += `
      <div class="stats-item">
        <span class="stats-label">今日更新</span>
        <span class="stats-value">${stats.today_count.toLocaleString()}</span>
      </div>
    `;
  }
  
  // 添加分析文章数量
  if (stats.analyzed_count !== undefined) {
    statsHtml += `
      <div class="stats-item">
        <span class="stats-label">AI分析文章</span>
        <span class="stats-value">${stats.analyzed_count.toLocaleString()}</span>
      </div>
    `;
  }
  
  // 如果没有统计信息
  if (!statsHtml) {
    statsHtml = `
      <div class="text-center text-muted py-3">
        暂无统计信息
      </div>
    `;
  }
  
  // 添加到容器
  statsContainer.innerHTML = statsHtml;
}

// 按来源筛选文章
window.filterBySource = function(source) {
  // 重置状态
  currentPage = 1;
  allLoaded = false;
  isLoading = false;
  
  // 更新当前来源
  currentSource = source;
  
  // 重新加载文章列表
  loadArticles();
  
  // 更新标题
  const contentTitle = document.querySelector('.content-title');
  if (contentTitle) {
    if (source) {
      contentTitle.textContent = `${getSourceName(source)}最新资讯`;
    } else {
      contentTitle.textContent = '最新财经资讯';
    }
  }
};

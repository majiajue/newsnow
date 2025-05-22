/**
 * NewNow财经 文章详情页脚本
 * 负责文章内容和分析结果的加载与展示
 */

// 当前文章ID
let articleId = null;
// 当前文章来源
let articleSource = null;
// 是否正在加载分析
let isAnalysisLoading = false;

// DOM元素
const articleContainer = document.getElementById('article-container');
const articleLoading = document.getElementById('article-loading');
const articleNotFound = document.getElementById('article-not-found');
const articleTitle = document.getElementById('article-title');
const articleSource = document.getElementById('article-source');
const articleDate = document.getElementById('article-date');
const articleContent = document.getElementById('article-content');
const relatedArticlesContainer = document.getElementById('related-articles-container');
const relatedLoading = document.getElementById('related-loading');
const analysisContent = document.getElementById('analysis-content');
const analysisLoading = document.getElementById('analysis-loading');
const analysisError = document.getElementById('analysis-error');
const flashNewsContainer = document.getElementById('flash-news-container');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 获取URL参数中的文章ID
  articleId = getUrlParameter('id');
  articleSource = getUrlParameter('source');
  
  // 如果没有文章ID，显示错误
  if (!articleId) {
    showArticleNotFound();
    return;
  }
  
  // 初始化页面
  initPage();
  
  // 添加事件监听器
  setupEventListeners();
});

// 初始化页面
function initPage() {
  // 加载文章内容
  loadArticle();
  
  // 加载侧边栏快讯
  loadFlashNews();
}

// 设置事件监听器
function setupEventListeners() {
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

// 显示文章不存在错误
function showArticleNotFound() {
  if (articleLoading) {
    articleLoading.style.display = 'none';
  }
  
  if (articleNotFound) {
    articleNotFound.style.display = 'block';
  }
}

// 加载文章内容
function loadArticle() {
  // 调用API获取文章内容
  getArticle(articleId, articleSource)
    .then(response => {
      // 隐藏加载状态
      if (articleLoading) {
        articleLoading.style.display = 'none';
      }
      
      // 处理API响应
      if (response.error) {
        showArticleNotFound();
        return;
      }
      
      // 获取文章信息
      const article = response;
      
      // 显示文章容器
      if (articleContainer) {
        articleContainer.style.display = 'flex';
      }
      
      // 渲染文章内容
      renderArticle(article);
      
      // 加载相关文章
      loadRelatedArticles();
      
      // 加载分析结果
      loadAnalysis();
    })
    .catch(error => {
      console.error('加载文章失败:', error);
      
      // 显示文章不存在错误
      showArticleNotFound();
    });
}

// 渲染文章内容
function renderArticle(article) {
  // 设置页面标题
  document.title = `${article.title || '文章详情'} - NewNow财经`;
  
  // 渲染标题
  if (articleTitle) {
    articleTitle.textContent = article.title || '无标题';
  }
  
  // 渲染来源
  if (articleSource) {
    const sourceName = getSourceName(article.source);
    const sourceColor = getSourceColor(article.source);
    
    articleSource.textContent = sourceName;
    articleSource.style.backgroundColor = `${sourceColor}20`;
    articleSource.style.color = sourceColor;
  }
  
  // 渲染日期
  if (articleDate) {
    articleDate.textContent = article.pubDate ? formatDate(article.pubDate) : '未知时间';
  }
  
  // 渲染内容
  if (articleContent) {
    if (article.content) {
      // 替换换行符为<p>标签
      const formattedContent = article.content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      articleContent.innerHTML = `<p>${formattedContent}</p>`;
    } else {
      articleContent.innerHTML = '<p class="text-muted">无正文内容</p>';
    }
  }
}

// 加载相关文章
function loadRelatedArticles() {
  if (!relatedArticlesContainer) return;
  
  // 调用API获取相关文章
  getRelatedArticles(articleId)
    .then(response => {
      // 隐藏加载状态
      if (relatedLoading) {
        relatedLoading.style.display = 'none';
      }
      
      // 处理API响应
      if (response.error) {
        relatedArticlesContainer.innerHTML = `
          <div class="alert alert-warning small">
            <i class="bi bi-exclamation-circle me-2"></i>
            加载相关文章失败：${response.error}
          </div>
        `;
        return;
      }
      
      // 获取相关文章列表
      const relatedArticles = response.articles || [];
      
      // 渲染相关文章
      renderRelatedArticles(relatedArticles);
    })
    .catch(error => {
      console.error('加载相关文章失败:', error);
      
      // 隐藏加载状态
      if (relatedLoading) {
        relatedLoading.style.display = 'none';
      }
      
      // 显示错误消息
      relatedArticlesContainer.innerHTML = `
        <div class="alert alert-warning small">
          <i class="bi bi-exclamation-circle me-2"></i>
          加载相关文章失败，请稍后重试
        </div>
      `;
    });
}

// 渲染相关文章
function renderRelatedArticles(articles) {
  if (!relatedArticlesContainer) return;
  
  // 如果没有相关文章
  if (articles.length === 0) {
    relatedArticlesContainer.innerHTML = `
      <div class="text-center text-muted py-3">
        暂无相关文章
      </div>
    `;
    return;
  }
  
  // 创建相关文章HTML
  let html = '';
  
  articles.forEach(article => {
    const title = article.title || '无标题';
    const pubDate = article.pubDate ? getRelativeTime(article.pubDate) : '未知时间';
    const url = `article.html?id=${article.id}${article.source ? `&source=${article.source}` : ''}`;
    
    html += `
      <div class="related-article-item">
        <a href="${url}" class="related-article-title">${title}</a>
        <div class="related-article-meta">
          <span>${getSourceName(article.source)}</span>
          <span class="text-muted ms-2">${pubDate}</span>
        </div>
      </div>
    `;
  });
  
  // 添加到容器
  relatedArticlesContainer.innerHTML = html;
}

// 加载分析结果
function loadAnalysis() {
  // 防止重复加载
  if (isAnalysisLoading) return;
  
  isAnalysisLoading = true;
  
  // 显示加载状态
  if (analysisLoading) {
    analysisLoading.style.display = 'block';
  }
  
  // 隐藏错误和内容
  if (analysisError) {
    analysisError.style.display = 'none';
  }
  
  if (analysisContent) {
    analysisContent.style.display = 'none';
  }
  
  // 调用API获取分析结果
  analyzeArticle(articleId, articleSource)
    .then(response => {
      // 隐藏加载状态
      if (analysisLoading) {
        analysisLoading.style.display = 'none';
      }
      
      // 处理API响应
      if (response.error) {
        if (analysisError) {
          analysisError.style.display = 'block';
          analysisError.querySelector('span').textContent = response.error;
        }
        isAnalysisLoading = false;
        return;
      }
      
      // 获取分析结果
      const analysis = response;
      
      // 渲染分析结果
      renderAnalysis(analysis);
      
      // 更新状态
      isAnalysisLoading = false;
    })
    .catch(error => {
      console.error('加载分析结果失败:', error);
      
      // 隐藏加载状态
      if (analysisLoading) {
        analysisLoading.style.display = 'none';
      }
      
      // 显示错误消息
      if (analysisError) {
        analysisError.style.display = 'block';
        analysisError.querySelector('span').textContent = '生成分析时出错，请稍后重试';
      }
      
      // 更新状态
      isAnalysisLoading = false;
    });
}

// 渲染分析结果
function renderAnalysis(analysis) {
  if (!analysisContent) return;
  
  // 使用工具函数生成分析HTML
  const analysisHtml = generateAnalysisHtml(analysis);
  
  // 添加到容器
  analysisContent.innerHTML = analysisHtml;
  analysisContent.style.display = 'block';
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

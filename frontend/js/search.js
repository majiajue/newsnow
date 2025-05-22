/**
 * NewNow财经 搜索结果页脚本
 * 负责搜索功能和结果展示
 */

// 当前搜索关键词
let searchQuery = '';
// 当前分类
let searchCategory = 'finance';
// 是否正在搜索
let isSearching = false;

// DOM元素
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchSummary = document.getElementById('search-summary');
const searchLoading = document.getElementById('search-loading');
const searchResults = document.getElementById('search-results');
const noResults = document.getElementById('no-results');
const flashNewsContainer = document.getElementById('flash-news-container');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 获取URL参数
  searchQuery = getUrlParameter('q') || '';
  searchCategory = getUrlParameter('category') || 'finance';
  
  // 如果没有搜索关键词，跳转回首页
  if (!searchQuery) {
    window.location.href = 'index.html';
    return;
  }
  
  // 更新页面标题
  document.title = `"${searchQuery}" 的搜索结果 - NewNow财经`;
  
  // 初始化页面
  initPage();
  
  // 添加事件监听器
  setupEventListeners();
});

// 初始化页面
function initPage() {
  // 设置搜索输入框的值
  if (searchInput) {
    searchInput.value = searchQuery;
  }
  
  // 更新搜索信息
  if (searchSummary) {
    searchSummary.innerHTML = `正在搜索 "<span class="search-query">${searchQuery}</span>" 的相关结果...`;
  }
  
  // 执行搜索
  performSearch();
  
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

// 执行搜索
function performSearch() {
  // 防止重复搜索
  if (isSearching) return;
  
  isSearching = true;
  
  // 显示加载状态
  if (searchLoading) {
    searchLoading.style.display = 'block';
  }
  
  // 隐藏结果和无结果提示
  if (searchResults) {
    searchResults.style.display = 'none';
  }
  
  if (noResults) {
    noResults.style.display = 'none';
  }
  
  // 调用API执行搜索
  searchContent(searchQuery, searchCategory, DEFAULT_CONFIG.searchResultsCount)
    .then(response => {
      // 隐藏加载状态
      if (searchLoading) {
        searchLoading.style.display = 'none';
      }
      
      // 处理API响应
      if (response.error) {
        showErrorMessage(response.error);
        isSearching = false;
        return;
      }
      
      // 获取搜索结果
      const results = response.results || [];
      
      // 更新搜索信息
      if (searchSummary) {
        searchSummary.innerHTML = `找到 <span class="search-count">${results.length}</span> 条关于 "<span class="search-query">${searchQuery}</span>" 的搜索结果`;
      }
      
      // 渲染搜索结果
      renderSearchResults(results);
      
      // 更新状态
      isSearching = false;
    })
    .catch(error => {
      console.error('搜索失败:', error);
      
      // 隐藏加载状态
      if (searchLoading) {
        searchLoading.style.display = 'none';
      }
      
      // 显示错误消息
      showErrorMessage('搜索失败，请稍后重试');
      
      // 更新状态
      isSearching = false;
    });
}

// 渲染搜索结果
function renderSearchResults(results) {
  if (!searchResults) return;
  
  // 如果没有结果
  if (results.length === 0) {
    if (noResults) {
      noResults.style.display = 'block';
    }
    return;
  }
  
  // 创建结果HTML
  let html = '';
  
  results.forEach(result => {
    html += generateSearchResultItem(result);
  });
  
  // 添加到容器并显示
  searchResults.innerHTML = html;
  searchResults.style.display = 'block';
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

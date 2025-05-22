/**
 * NewNow财经 快讯页脚本
 * 负责快讯列表加载和展示功能
 */

// 当前页码
let currentPage = 1;
// 当前快讯来源筛选
let currentSource = null;
// 是否全部加载完毕
let allLoaded = false;
// 是否正在加载
let isLoading = false;
// 快讯限制数量（每页加载数量）
const FLASH_LIMIT = 20;

// DOM元素
const flashContainer = document.getElementById('flash-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const flashLoading = document.getElementById('flash-loading');
const flashTitle = document.getElementById('flash-title');
const flashDateNav = document.getElementById('flash-date-nav');
const refreshBtn = document.getElementById('refresh-btn');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const marketOverview = document.getElementById('market-overview');
const statsContainer = document.getElementById('stats-container');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  // 获取URL参数
  const urlSource = getUrlParameter('source');
  if (urlSource) {
    currentSource = urlSource;
  }
  
  // 初始化页面
  initPage();
  
  // 添加事件监听器
  setupEventListeners();
  
  // 检查API健康状态
  checkApiStatus();
});

// 初始化页面
function initPage() {
  // 更新标题
  updateTitle();
  
  // 加载快讯列表
  loadFlashes();
  
  // 加载市场概况
  loadMarketOverview();
  
  // 加载统计信息
  loadStats();
  
  // 生成日期导航
  generateDateNav();
}

// 设置事件监听器
function setupEventListeners() {
  // 加载更多按钮点击事件
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      if (!isLoading && !allLoaded) {
        currentPage++;
        loadFlashes(currentPage);
      }
    });
  }
  
  // 刷新按钮点击事件
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      if (!isLoading) {
        // 清除缓存
        cacheManager.clear(`${CACHE_KEYS.FLASH}${currentSource || 'all'}_${FLASH_LIMIT}`);
        
        // 重置状态
        currentPage = 1;
        allLoaded = false;
        
        // 重新加载
        loadFlashes();
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

// 更新标题
function updateTitle() {
  if (!flashTitle) return;
  
  if (currentSource) {
    flashTitle.textContent = `${getSourceName(currentSource)}快讯`;
  } else {
    flashTitle.textContent = '财经快讯';
  }
}

// 加载快讯列表
function loadFlashes(page = 1) {
  // 防止重复加载
  if (isLoading) return;
  
  isLoading = true;
  
  // 更新加载更多按钮状态
  updateLoadMoreButton(true);
  
  // 如果是第一页，显示加载状态
  if (page === 1 && flashLoading) {
    flashLoading.style.display = 'block';
    if (flashContainer) {
      flashContainer.innerHTML = '';
    }
  }
  
  // 构建API请求参数
  let endpoint = `${API_ENDPOINTS.FLASH}?limit=${FLASH_LIMIT}`;
  
  // 添加分页参数
  if (page > 1) {
    const offset = (page - 1) * FLASH_LIMIT;
    endpoint += `&offset=${offset}`;
  }
  
  // 添加来源过滤
  if (currentSource) {
    endpoint += `&source=${currentSource}`;
  }
  
  // 发起请求
  apiRequest(endpoint)
    .then(response => {
      // 隐藏加载状态
      if (flashLoading) {
        flashLoading.style.display = 'none';
      }
      
      // 处理API响应
      if (response.error) {
        showErrorMessage(response.error);
        isLoading = false;
        updateLoadMoreButton(false);
        return;
      }
      
      // 获取快讯列表
      const flashes = response.flashes || [];
      
      // 检查是否全部加载完毕
      if (flashes.length < FLASH_LIMIT) {
        allLoaded = true;
      }
      
      // 渲染快讯列表
      renderFlashes(flashes, page > 1);
      
      // 更新状态
      isLoading = false;
      updateLoadMoreButton(false);
    })
    .catch(error => {
      console.error('加载快讯列表失败:', error);
      
      // 隐藏加载状态
      if (flashLoading) {
        flashLoading.style.display = 'none';
      }
      
      // 显示错误消息
      showErrorMessage('加载快讯列表失败，请稍后重试');
      
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

// 渲染快讯列表
function renderFlashes(flashes, append = false) {
  if (!flashContainer) return;
  
  // 如果没有快讯
  if (flashes.length === 0 && !append) {
    flashContainer.innerHTML = `
      <div class="alert alert-info">
        <i class="bi bi-info-circle me-2"></i>
        暂无快讯，请稍后再试
      </div>
    `;
    return;
  }
  
  // 按日期分组快讯
  const groupedFlashes = groupFlashesByDate(flashes);
  
  // 创建快讯HTML
  let flashesHtml = '';
  
  // 遍历分组
  for (const dateGroup in groupedFlashes) {
    // 添加日期标题
    flashesHtml += `
      <div class="flash-date-group mb-4">
        <h5 class="flash-date-title" id="date-${dateGroup.replace(/[^\w]/g, '-')}">
          ${formatDateHeading(dateGroup)}
        </h5>
        <div class="flash-items">
    `;
    
    // 添加该日期下的所有快讯
    groupedFlashes[dateGroup].forEach(flash => {
      flashesHtml += generateFullFlashItem(flash);
    });
    
    // 结束日期分组
    flashesHtml += `
        </div>
      </div>
    `;
  }
  
  // 添加到容器
  if (append) {
    flashContainer.innerHTML += flashesHtml;
  } else {
    flashContainer.innerHTML = flashesHtml;
  }
}

// 按日期分组快讯
function groupFlashesByDate(flashes) {
  const groups = {};
  
  flashes.forEach(flash => {
    if (!flash.pubDate) return;
    
    // 提取日期部分（不包含时间）
    const date = new Date(flash.pubDate);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // 如果该日期组不存在，创建一个数组
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    
    // 添加到组中
    groups[dateStr].push(flash);
  });
  
  return groups;
}

// 格式化日期标题
function formatDateHeading(dateStr) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  if (dateStr === todayStr) {
    return '今天';
  } else if (dateStr === yesterdayStr) {
    return '昨天';
  } else {
    // 将 YYYY-MM-DD 转换为 YYYY年MM月DD日
    const parts = dateStr.split('-');
    return `${parts[0]}年${parts[1]}月${parts[2]}日`;
  }
}

// 生成完整快讯项HTML
function generateFullFlashItem(flash) {
  if (!flash) return '';
  
  // 提取信息
  const title = flash.title || flash.content || '无内容';
  const content = flash.content || '';
  const pubDate = flash.pubDate ? formatTime(flash.pubDate) : '未知时间';
  const source = getSourceName(flash.source);
  const sourceColor = getSourceColor(flash.source);
  const importance = flash.importance || 'normal';
  
  // 重要性样式
  let importanceClass = '';
  if (importance === 'high') {
    importanceClass = 'flash-important';
  }
  
  // 生成HTML
  return `
    <div class="flash-full-item ${importanceClass}">
      <div class="flash-time">${pubDate}</div>
      <div class="flash-content-wrapper">
        <div class="flash-source" style="color: ${sourceColor};">${source}</div>
        <div class="flash-title">${title}</div>
        <div class="flash-content">${content}</div>
      </div>
    </div>
  `;
}

// 格式化时间（仅显示时间部分）
function formatTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString; // 如果无效，返回原始字符串
  }
  
  // 格式化为 HH:MM
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

// 生成日期导航
function generateDateNav() {
  if (!flashDateNav) return;
  
  // 获取当前日期
  const today = new Date();
  
  // 生成最近7天的日期
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // 创建日期导航HTML
  let dateNavHtml = '<div class="flash-dates">';
  
  dates.forEach((date, index) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const displayDate = index === 0 ? '今天' : index === 1 ? '昨天' : `${date.getMonth() + 1}月${date.getDate()}日`;
    
    dateNavHtml += `
      <a href="#date-${dateStr}" class="date-nav-item ${index === 0 ? 'active' : ''}">
        ${displayDate}
      </a>
    `;
  });
  
  dateNavHtml += '</div>';
  
  // 添加到容器
  flashDateNav.innerHTML = dateNavHtml;
}

// 加载市场概况
function loadMarketOverview() {
  if (!marketOverview) return;
  
  // 由于我们的API可能没有这个端点，这里模拟一些市场数据
  // 在实际应用中，你应该调用一个真实的API来获取实时市场数据
  setTimeout(() => {
    const overviewHtml = `
      <div class="market-data">
        <div class="market-index-row">
          <div class="market-index">
            <div class="index-name">上证指数</div>
            <div class="index-value">3,245.32</div>
            <div class="index-change positive">+0.68%</div>
          </div>
          <div class="market-index">
            <div class="index-name">深证成指</div>
            <div class="index-value">10,587.63</div>
            <div class="index-change positive">+1.25%</div>
          </div>
        </div>
        <div class="market-index-row">
          <div class="market-index">
            <div class="index-name">恒生指数</div>
            <div class="index-value">19,435.67</div>
            <div class="index-change negative">-0.43%</div>
          </div>
          <div class="market-index">
            <div class="index-name">纳斯达克</div>
            <div class="index-value">13,765.78</div>
            <div class="index-change positive">+0.92%</div>
          </div>
        </div>
        <div class="market-commodities mt-3">
          <div class="commodity-row">
            <div class="commodity">
              <span class="commodity-name">黄金</span>
              <span class="commodity-value">1,978.50</span>
              <span class="commodity-change positive">+0.35%</span>
            </div>
            <div class="commodity">
              <span class="commodity-name">原油 (WTI)</span>
              <span class="commodity-value">76.32</span>
              <span class="commodity-change negative">-1.20%</span>
            </div>
          </div>
        </div>
      </div>
      <div class="update-time text-end text-muted mt-2">
        <small>更新于: ${formatDate(new Date())}</small>
      </div>
    `;
    
    marketOverview.innerHTML = overviewHtml;
  }, 1000);
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
  
  // 添加快讯数量
  if (stats.flash_count !== undefined) {
    statsHtml += `
      <div class="stats-item">
        <span class="stats-label">快讯总数</span>
        <span class="stats-value">${stats.flash_count.toLocaleString()}</span>
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

// 按来源筛选快讯
window.filterBySource = function(source) {
  // 重置状态
  currentPage = 1;
  allLoaded = false;
  isLoading = false;
  
  // 更新当前来源
  currentSource = source;
  
  // 重新加载快讯列表
  loadFlashes();
  
  // 更新标题
  updateTitle();
  
  // 更新活动按钮状态
  updateSourceButtons(source);
}

// 更新来源按钮状态
function updateSourceButtons(source) {
  // 获取所有来源按钮
  const sourceButtons = document.querySelectorAll('.source-filter .btn');
  
  // 重置所有按钮状态
  sourceButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 根据当前来源设置活动按钮
  if (source === null) {
    // 全部按钮
    sourceButtons[0].classList.add('active');
  } else {
    // 查找匹配的来源按钮
    for (let i = 1; i < sourceButtons.length; i++) {
      const btn = sourceButtons[i];
      const btnSource = btn.getAttribute('onclick').match(/filterBySource\('(.+?)'\)/)[1];
      if (btnSource === source) {
        btn.classList.add('active');
        break;
      }
    }
  }
}

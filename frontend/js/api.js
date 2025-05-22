/**
 * NewNow财经 API交互模块
 * 负责所有与后端API的通信
 */

// 缓存管理
const cacheManager = {
  // 保存数据到缓存
  set: function(key, data) {
    const cacheItem = {
      data: data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  },
  
  // 从缓存获取数据
  get: function(key) {
    const cacheItemJson = localStorage.getItem(key);
    if (!cacheItemJson) return null;
    
    try {
      const cacheItem = JSON.parse(cacheItemJson);
      const now = Date.now();
      // 检查缓存是否过期
      if (now - cacheItem.timestamp > DEFAULT_CONFIG.cacheTimeout) {
        localStorage.removeItem(key);
        return null;
      }
      return cacheItem.data;
    } catch (e) {
      localStorage.removeItem(key);
      return null;
    }
  },
  
  // 清除特定缓存
  clear: function(key) {
    localStorage.removeItem(key);
  },
  
  // 清除所有缓存
  clearAll: function() {
    for (const key in CACHE_KEYS) {
      const keyPrefix = CACHE_KEYS[key];
      // 获取所有以该前缀开头的缓存
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(keyPrefix)) {
          localStorage.removeItem(k);
        }
      });
    }
  }
};

// 错误处理函数
function handleApiError(error, defaultMessage = "请求失败，请稍后重试") {
  console.error("API错误:", error);
  
  // 错误消息
  let errorMessage = defaultMessage;
  
  // 如果是Response对象，尝试解析JSON响应
  if (error.json && typeof error.json === 'function') {
    return error.json()
      .then(data => {
        if (data && data.error) {
          errorMessage = data.error;
        }
        showErrorMessage(errorMessage);
        return { error: errorMessage };
      })
      .catch(() => {
        showErrorMessage(errorMessage);
        return { error: errorMessage };
      });
  }
  
  // 显示错误消息
  showErrorMessage(errorMessage);
  return Promise.resolve({ error: errorMessage });
}

// 显示错误消息（可以根据UI框架调整）
function showErrorMessage(message) {
  // 检查是否已有错误提示
  if (document.getElementById('error-toast')) {
    document.getElementById('error-toast').remove();
  }
  
  // 创建错误提示
  const errorToast = document.createElement('div');
  errorToast.id = 'error-toast';
  errorToast.className = 'toast show position-fixed bottom-0 end-0 m-3';
  errorToast.setAttribute('role', 'alert');
  errorToast.setAttribute('aria-live', 'assertive');
  errorToast.setAttribute('aria-atomic', 'true');
  
  errorToast.innerHTML = `
    <div class="toast-header bg-danger text-white">
      <strong class="me-auto">错误</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  document.body.appendChild(errorToast);
  
  // 自动关闭
  setTimeout(() => {
    errorToast.remove();
  }, 5000);
}

// API请求包装函数
function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 默认请求选项 - 增强跨域支持
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    mode: 'cors', // 启用跨域请求
    credentials: 'same-origin' // 对于非SSO认证系统的标准设置
  };
  
  // 合并选项
  const requestOptions = { ...defaultOptions, ...options };
  
  // 显示加载中状态
  const showLoading = options.showLoading !== false;
  if (showLoading) {
    showLoadingIndicator();
  }
  
  // 添加调试日志
  console.log(`发起API请求: ${url}`, requestOptions);
  
  return fetch(url, requestOptions)
    .then(response => {
      // 隐藏加载中状态
      if (showLoading) {
        hideLoadingIndicator();
      }
      
      console.log(`API响应状态: ${response.status} ${response.statusText}`);
      
      // 检查响应状态
      if (!response.ok) {
        console.error(`API响应错误: ${response.status} ${response.statusText}`);
        return handleApiError(response);
      }
      
      // 解析JSON响应
      return response.json().then(data => {
        console.log(`API响应数据:`, data);
        return data;
      });
    })
    .catch(error => {
      // 隐藏加载中状态
      if (showLoading) {
        hideLoadingIndicator();
      }
      
      console.error(`API请求异常:`, error);
      return handleApiError(error);
    });
}

// 加载指示器
function showLoadingIndicator() {
  // 如果页面上已经有加载指示器，不再创建
  if (document.querySelector('.loading-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="spinner-border text-primary loading-spinner" role="status">
      <span class="visually-hidden">加载中...</span>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

function hideLoadingIndicator() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    // 使用淡出效果
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    
    // 完全移除元素
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }
}

/**
 * API功能函数
 */

// 健康检查
function checkApiHealth(){
  // 使用最简单的方式直接请求，避免触发预检请求
  const url = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`;
  
  // 简化请求，不设置复杂头部
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        return handleApiError(response);
      }
      return response.json();
    })
    .catch(error => {
      return handleApiError(error);
    });
}

// 获取文章列表
function getArticles(page = 1, limit = DEFAULT_CONFIG.articlesPerPage, source = DEFAULT_CONFIG.defaultSource) {
  // 构建缓存键
  const cacheKey = `${CACHE_KEYS.ARTICLES}${source || 'all'}_${page}_${limit}`;
  
  // 检查缓存
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  // 构建API请求参数
  let endpoint = `${API_ENDPOINTS.ARTICLES}?limit=${limit}`;
  
  // 添加分页参数（这里假设API支持page参数，实际实现可能需要调整）
  if (page > 1) {
    const offset = (page - 1) * limit;
    endpoint += `&offset=${offset}`;
  }
  
  // 添加来源过滤
  if (source) {
    endpoint += `&source=${source}`;
  }
  
  // 发起请求
  return apiRequest(endpoint)
    .then(data => {
      // 缓存结果
      if (!data.error) {
        cacheManager.set(cacheKey, data);
      }
      return data;
    });
}

// 获取单篇文章
function getArticle(articleId, source) {
  // 构建缓存键
  const cacheKey = `${CACHE_KEYS.ARTICLE}${articleId}`;
  
  // 检查缓存
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  // 构建API请求参数
  let endpoint = `${API_ENDPOINTS.ARTICLE}${articleId}`;
  
  // 添加来源参数（如果有）
  if (source) {
    endpoint += `?source=${source}`;
  }
  
  // 发起请求
  return apiRequest(endpoint)
    .then(data => {
      // 缓存结果
      if (!data.error) {
        cacheManager.set(cacheKey, data);
      }
      return data;
    });
}

// 获取相关文章
function getRelatedArticles(articleId, limit = DEFAULT_CONFIG.relatedArticlesCount) {
  // 构建API请求参数
  let endpoint = API_ENDPOINTS.RELATED.replace('{id}', articleId);
  endpoint += `?limit=${limit}`;
  
  // 发起请求（相关文章不缓存，因为它们可能根据其他文章变化）
  return apiRequest(endpoint);
}

// 分析文章
function analyzeArticle(articleId, source) {
  // 构建缓存键
  const cacheKey = `${CACHE_KEYS.ANALYSIS}${articleId}`;
  
  // 检查缓存
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  // 构建API请求参数
  let endpoint = API_ENDPOINTS.ANALYZE.replace('{id}', articleId);
  
  // 添加来源参数（如果有）
  if (source) {
    endpoint += `?source=${source}`;
  }
  
  // 发起请求（这里是POST请求）
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({}) // 可以根据需要添加请求体参数
  }).then(data => {
    // 缓存结果
    if (!data.error) {
      cacheManager.set(cacheKey, data);
    }
    return data;
  });
}

// 获取快讯
function getFlashNews(limit = DEFAULT_CONFIG.flashNewsCount, source = DEFAULT_CONFIG.defaultSource) {
  // 构建缓存键
  const cacheKey = `${CACHE_KEYS.FLASH}${source || 'all'}_${limit}`;
  
  // 检查缓存
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  // 构建API请求参数
  let endpoint = `${API_ENDPOINTS.FLASH}?limit=${limit}`;
  
  // 添加来源过滤
  if (source) {
    endpoint += `&source=${source}`;
  }
  
  // 发起请求
  return apiRequest(endpoint, { showLoading: false })
    .then(data => {
      // 缓存结果
      if (!data.error) {
        cacheManager.set(cacheKey, data);
      }
      return data;
    });
}

// 搜索
function searchContent(query, category = 'finance', limit = DEFAULT_CONFIG.searchResultsCount) {
  // 构建缓存键
  const cacheKey = `${CACHE_KEYS.SEARCH}${query}_${category}_${limit}`;
  
  // 检查缓存
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  // 构建API请求参数
  let endpoint = `${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}&category=${category}&max_results=${limit}`;
  
  // 发起请求
  return apiRequest(endpoint)
    .then(data => {
      // 缓存结果
      if (!data.error) {
        cacheManager.set(cacheKey, data);
      }
      return data;
    });
}

// 获取统计信息
function getStats() {
  // 构建缓存键
  const cacheKey = CACHE_KEYS.STATS;
  
  // 检查缓存
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    return Promise.resolve(cachedData);
  }
  
  // 发起请求
  return apiRequest(API_ENDPOINTS.STATS, { showLoading: false })
    .then(data => {
      // 缓存结果
      if (!data.error) {
        cacheManager.set(cacheKey, data);
      }
      return data;
    });
}

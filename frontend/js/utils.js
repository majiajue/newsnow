/**
 * NewNow财经 工具函数模块
 * 提供日期格式化、文本处理等通用功能
 */

// 日期格式化
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString; // 如果无效，返回原始字符串
  }
  
  // 格式化为 YYYY-MM-DD HH:MM
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 相对时间（如：5分钟前，1小时前）
function getRelativeTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString; // 如果无效，返回原始字符串
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return `${diffSec}秒前`;
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 30) {
    return `${diffDay}天前`;
  } else {
    return formatDate(dateString).split(' ')[0]; // 只返回日期部分
  }
}

// 截取摘要文本
function truncateText(text, maxLength = 100) {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

// 生成可读的来源名称
function getSourceName(sourceCode) {
  if (!sourceCode) return '未知来源';
  
  // 使用配置中的来源信息
  if (NEWS_SOURCES[sourceCode]) {
    return NEWS_SOURCES[sourceCode].name;
  }
  
  // 来源代码到名称的映射
  const sourceMap = {
    jin10: '金十财经',
    wallstreet: '华尔街见闻',
    gelonghui: '格隆汇',
    fastbull: 'FastBull',
    cls: '财联社',
    // 可以添加更多来源
  };
  
  return sourceMap[sourceCode] || sourceCode;
}

// 获取来源颜色
function getSourceColor(sourceCode) {
  if (!sourceCode) return '#999';
  
  // 使用配置中的来源信息
  if (NEWS_SOURCES[sourceCode] && NEWS_SOURCES[sourceCode].color) {
    return NEWS_SOURCES[sourceCode].color;
  }
  
  // 来源代码到颜色的映射
  const colorMap = {
    jin10: '#f39c12',
    wallstreet: '#3498db',
    gelonghui: '#27ae60',
    fastbull: '#e74c3c',
    cls: '#9b59b6',
    // 可以添加更多来源
  };
  
  return colorMap[sourceCode] || '#999';
}

// 生成文章卡片HTML
function generateArticleCard(article) {
  if (!article) return '';
  
  // 提取信息
  const title = article.title || '无标题';
  const pubDate = article.pubDate ? getRelativeTime(article.pubDate) : '未知时间';
  const source = getSourceName(article.source);
  const sourceColor = getSourceColor(article.source);
  const summary = article.summary || article.content || '';
  const truncatedSummary = truncateText(summary, 150);
  const url = `article.html?id=${article.id}${article.source ? `&source=${article.source}` : ''}`;
  
  // 生成HTML
  return `
    <div class="article-card">
      <div class="article-content">
        <h3 class="article-title">
          <a href="${url}">${title}</a>
        </h3>
        <div class="article-meta">
          <span class="article-source" style="background-color: ${sourceColor}20; color: ${sourceColor};">${source}</span>
          <span class="article-date">${pubDate}</span>
        </div>
        <div class="article-summary">${truncatedSummary}</div>
      </div>
    </div>
  `;
}

// 生成快讯项HTML
function generateFlashItem(flash) {
  if (!flash) return '';
  
  // 提取信息
  const title = flash.title || flash.content || '无内容';
  const pubDate = flash.pubDate ? getRelativeTime(flash.pubDate) : '未知时间';
  const source = getSourceName(flash.source);
  
  // 生成HTML
  return `
    <div class="flash-item">
      <div class="flash-title">${title}</div>
      <div class="flash-meta">
        <span class="flash-source">${source}</span>
        <span class="flash-date">${pubDate}</span>
      </div>
    </div>
  `;
}

// 生成搜索结果项HTML
function generateSearchResultItem(result) {
  if (!result) return '';
  
  // 提取信息
  const title = result.title || '无标题';
  const content = result.content || result.snippet || '';
  const truncatedContent = truncateText(content, 200);
  const url = result.url || '#';
  const source = result.source_name || getSourceName(result.source) || '未知来源';
  
  // 判断是否为内部文章链接
  let itemHtml = '';
  if (url.includes('/api/articles/') || result.id) {
    // 内部文章，生成到文章详情页的链接
    const articleId = result.id || url.split('/').pop();
    const articleUrl = `article.html?id=${articleId}${result.source ? `&source=${result.source}` : ''}`;
    
    itemHtml = `
      <div class="article-card search-result-item">
        <div class="article-content">
          <h3 class="article-title">
            <a href="${articleUrl}">${title}</a>
          </h3>
          <div class="article-meta">
            <span class="article-source">${source}</span>
          </div>
          <div class="article-summary">${truncatedContent}</div>
        </div>
      </div>
    `;
  } else {
    // 外部链接
    itemHtml = `
      <div class="article-card search-result-item">
        <div class="article-content">
          <h3 class="article-title">
            <a href="${url}" target="_blank">${title} <i class="bi bi-box-arrow-up-right"></i></a>
          </h3>
          <div class="article-meta">
            <span class="article-source">${source}</span>
          </div>
          <div class="article-summary">${truncatedContent}</div>
        </div>
      </div>
    `;
  }
  
  return itemHtml;
}

// 获取URL参数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 情感指示器颜色
function getSentimentClass(sentiment) {
  if (!sentiment) return 'sentiment-neutral';
  
  const sentimentMap = {
    '积极': 'sentiment-positive',
    '中性': 'sentiment-neutral',
    '消极': 'sentiment-negative',
    '正面': 'sentiment-positive',
    '负面': 'sentiment-negative',
    '看多': 'sentiment-positive',
    '看空': 'sentiment-negative'
  };
  
  return sentimentMap[sentiment] || 'sentiment-neutral';
}

// 影响级别颜色
function getImpactLevelClass(level) {
  if (!level) return 'impact-medium';
  
  const levelMap = {
    '高': 'impact-high',
    '中': 'impact-medium',
    '低': 'impact-low'
  };
  
  return levelMap[level] || 'impact-medium';
}

// 生成分析结果HTML
function generateAnalysisHtml(analysis) {
  if (!analysis) return '<div class="alert alert-info">暂无分析结果</div>';
  
  // 处理原始文本分析（旧格式）
  if (typeof analysis === 'string') {
    return `<div class="analysis-text">${analysis}</div>`;
  }
  
  // 以下是JSON格式的新分析结果处理
  let html = '';
  
  // 市场摘要
  if (analysis.market_summary) {
    html += `
      <div class="analysis-summary">
        <h4 class="summary-title">市场摘要</h4>
        <p>${analysis.market_summary}</p>
      </div>
    `;
  }
  
  // 关键影响分析
  if (analysis.impact_analysis) {
    html += `
      <div class="impact-analysis">
        <h4>关键影响分析</h4>
        <p>${analysis.impact_analysis}</p>
      </div>
    `;
  }
  
  // 受影响行业
  if (analysis.affected_industries && analysis.affected_industries.length > 0) {
    html += '<div class="affected-industries"><h4>行业影响</h4>';
    
    analysis.affected_industries.forEach(industry => {
      const impactClass = getImpactLevelClass(industry.impact_level);
      
      html += `
        <div class="industry-card">
          <div class="industry-header">
            <h5 class="industry-name">${industry.industry}</h5>
            <span class="impact-badge ${impactClass}">影响：${industry.impact_level}</span>
          </div>
          <div class="industry-body">
      `;
      
      // 添加公司标签
      if (industry.companies && industry.companies.length > 0) {
        html += '<div class="industry-companies">';
        industry.companies.forEach(company => {
          html += `<span class="company-tag">${company}</span>`;
        });
        html += '</div>';
      }
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  // 投资建议
  if (analysis.investment_advice) {
    html += `
      <div class="investment-advice">
        <h4>投资建议</h4>
        <p>${analysis.investment_advice}</p>
    `;
    
    // 添加情感指示器
    if (analysis.sentiment) {
      const sentimentClass = getSentimentClass(analysis.sentiment);
      html += `
        <div class="sentiment-indicator">
          <span class="sentiment-label">市场情绪：</span>
          <span class="sentiment-value ${sentimentClass}">${analysis.sentiment}</span>
        </div>
      `;
    }
    
    html += '</div>';
  }
  
  return html;
}

// 生成经济指标HTML
function generateEconomicIndicatorHtml(indicator) {
  if (!indicator) return '';
  
  // 确定变化方向和样式
  let changeClass = 'neutral-change';
  if (indicator.change && indicator.change.startsWith('+')) {
    changeClass = 'positive-change';
  } else if (indicator.change && indicator.change.startsWith('-')) {
    changeClass = 'negative-change';
  }
  
  // 确定重要性样式
  let significanceClass = 'medium-significance';
  if (indicator.significance === '高') {
    significanceClass = 'high-significance';
  } else if (indicator.significance === '低') {
    significanceClass = 'low-significance';
  }
  
  // 生成指标卡片HTML
  return `
    <div class="col-md-6 col-lg-3 mb-3">
      <div class="indicator-card">
        <div class="indicator-header">
          <h5 class="indicator-name">${indicator.indicator_name}</h5>
          <span class="significance-badge ${significanceClass}">重要性: ${indicator.significance}</span>
        </div>
        <div class="indicator-values">
          <div>
            <div class="indicator-value">${indicator.current_value}</div>
            <div class="indicator-prev">前值: ${indicator.previous_value}</div>
          </div>
          <div class="ms-auto">
            <span class="indicator-change ${changeClass}">${indicator.change}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

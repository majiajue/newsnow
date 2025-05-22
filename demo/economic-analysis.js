/**
 * 宏观经济数据分析页面 JavaScript 功能
 * 用于处理和展示 JSON 格式的经济数据分析结果
 */

// 模拟经济数据分析结果（在实际环境中将通过 API 获取）
const mockEconomicData = {
  "data_summary": "中国4月CPI同比小幅上涨0.3%，PPI同比降幅略有收窄但仍处于负区间。社会融资规模增量同比减少，M2增速放缓，显示内需仍偏弱。",
  "trend_analysis": "CPI连续三个月回升但仍低于长期均值，PPI已连续19个月负增长但降幅趋缓。社会融资规模增量同比收缩明显，M2增速为2022年以来最低水平。预计CPI将维持温和回升，PPI可能在二季度末转正。",
  "economic_impact": "低通胀环境持续制约企业盈利空间，信贷收缩可能影响投资复苏。M2增速放缓反映货币政策传导效率有待提升。",
  "policy_implications": "央行可能维持宽松货币政策，包括降准或定向降息。财政政策或加大基建投资力度以对冲社融收缩。PPI持续负增长可能促使工业补贴政策出台。",
  "key_indicators": [
    {
      "indicator_name": "CPI同比",
      "current_value": "0.3%",
      "previous_value": "0.1%",
      "change": "+0.2ppt",
      "significance": "中"
    },
    {
      "indicator_name": "PPI同比",
      "current_value": "-2.5%",
      "previous_value": "-2.6%",
      "change": "+0.1ppt",
      "significance": "高"
    },
    {
      "indicator_name": "社会融资规模增量",
      "current_value": "1.9万亿元",
      "previous_value": "2.68万亿元(同比)",
      "change": "-29.2%",
      "significance": "高"
    },
    {
      "indicator_name": "M2同比",
      "current_value": "8.3%",
      "previous_value": "8.9%",
      "change": "-0.6ppt",
      "significance": "中"
    },
    {
      "indicator_name": "工业增加值同比",
      "current_value": "5.6%",
      "previous_value": "4.5%",
      "change": "+1.1ppt",
      "significance": "高"
    },
    {
      "indicator_name": "固定资产投资累计同比",
      "current_value": "4.2%",
      "previous_value": "4.5%",
      "change": "-0.3ppt",
      "significance": "中"
    },
    {
      "indicator_name": "社会消费品零售总额同比",
      "current_value": "2.8%",
      "previous_value": "3.1%",
      "change": "-0.3ppt",
      "significance": "高"
    },
    {
      "indicator_name": "城镇调查失业率",
      "current_value": "5.0%",
      "previous_value": "5.2%",
      "change": "-0.2ppt",
      "significance": "中"
    }
  ],
  "overall_sentiment": "中性"
};

// 历史数据（用于图表展示）
const historicalData = {
  "months": ["11月", "12月", "1月", "2月", "3月", "4月"],
  "cpi": [-0.5, -0.3, 0.0, 0.1, 0.1, 0.3],
  "ppi": [-3.0, -2.9, -2.8, -2.7, -2.6, -2.5],
  "m2": [9.5, 9.3, 9.0, 8.7, 8.9, 8.3]
};

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', function() {
  loadEconomicData();
});

/**
 * 加载经济数据（在实际项目中应该是API调用）
 */
function loadEconomicData() {
  // 模拟API调用延迟
  setTimeout(() => {
    renderEconomicData(mockEconomicData);
    createEconomicChart(historicalData);
  }, 1000);
}

/**
 * 渲染经济数据到页面
 * @param {Object} data - 经济数据分析结果
 */
function renderEconomicData(data) {
  // 渲染数据摘要
  renderDataSummary(data.data_summary);
  
  // 渲染关键指标
  renderKeyIndicators(data.key_indicators);
  
  // 渲染趋势分析
  renderTrendAnalysis(data.trend_analysis);
  
  // 渲染经济影响
  renderEconomicImpact(data.economic_impact);
  
  // 渲染政策预期
  renderPolicyImplications(data.policy_implications);
  
  // 设置整体情绪
  setOverallSentiment(data.overall_sentiment);
}

/**
 * 渲染数据摘要
 * @param {string} summary - 数据摘要文本
 */
function renderDataSummary(summary) {
  const container = document.getElementById('data-summary-container');
  container.innerHTML = `
    <div class="data-summary">
      <h4 class="summary-title">数据摘要</h4>
      <p>${summary}</p>
    </div>
  `;
}

/**
 * 渲染关键指标
 * @param {Array} indicators - 关键指标数组
 */
function renderKeyIndicators(indicators) {
  const container = document.getElementById('indicators-container');
  container.innerHTML = ''; // 清空容器
  
  indicators.forEach(indicator => {
    // 确定变化方向和样式
    let changeClass = 'neutral-change';
    if (indicator.change.startsWith('+')) {
      changeClass = 'positive-change';
    } else if (indicator.change.startsWith('-')) {
      changeClass = 'negative-change';
    }
    
    // 确定重要性样式
    let significanceClass = 'medium-significance';
    if (indicator.significance === '高') {
      significanceClass = 'high-significance';
    } else if (indicator.significance === '低') {
      significanceClass = 'low-significance';
    }
    
    // 创建指标卡片
    const indicatorCol = document.createElement('div');
    indicatorCol.className = 'col-md-6 col-lg-3 mb-3';
    indicatorCol.innerHTML = `
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
    `;
    
    container.appendChild(indicatorCol);
  });
}

/**
 * 渲染趋势分析
 * @param {string} analysis - 趋势分析文本
 */
function renderTrendAnalysis(analysis) {
  const container = document.getElementById('trend-analysis-container');
  container.innerHTML = `<p>${analysis}</p>`;
}

/**
 * 渲染经济影响
 * @param {string} impact - 经济影响文本
 */
function renderEconomicImpact(impact) {
  const container = document.getElementById('economic-impact-container');
  container.innerHTML = `<p>${impact}</p>`;
}

/**
 * 渲染政策预期
 * @param {string} implications - 政策预期文本
 */
function renderPolicyImplications(implications) {
  const container = document.getElementById('policy-implications-container');
  container.innerHTML = `<p>${implications}</p>`;
}

/**
 * 设置整体情绪指示器
 * @param {string} sentiment - 情绪值（积极/中性/消极）
 */
function setOverallSentiment(sentiment) {
  const element = document.getElementById('overall-sentiment');
  
  // 移除所有情绪类
  element.classList.remove('sentiment-positive', 'sentiment-neutral', 'sentiment-negative');
  
  // 根据情绪值设置对应类和文本
  switch (sentiment) {
    case '积极':
      element.classList.add('sentiment-positive');
      break;
    case '消极':
      element.classList.add('sentiment-negative');
      break;
    default:
      element.classList.add('sentiment-neutral');
      break;
  }
  
  element.textContent = sentiment;
}

/**
 * 创建经济指标图表
 * @param {Object} data - 历史数据对象
 */
function createEconomicChart(data) {
  const ctx = document.getElementById('economic-indicators-chart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'CPI同比',
          data: data.cpi,
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'PPI同比',
          data: data.ppi,
          borderColor: 'rgba(231, 76, 60, 1)',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'M2增速',
          data: data.m2,
          borderColor: 'rgba(39, 174, 96, 1)',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          borderWidth: 2,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '主要经济指标趋势（单位：%）',
          font: {
            size: 16
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 */
function handleError(error) {
  console.error('数据加载错误:', error);
  
  // 显示错误信息
  const containers = [
    'data-summary-container',
    'indicators-container',
    'trend-analysis-container',
    'economic-impact-container',
    'policy-implications-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          数据加载失败: ${error.message}
        </div>
      `;
    }
  });
  
  // 设置整体情绪为未知
  const sentimentElement = document.getElementById('overall-sentiment');
  if (sentimentElement) {
    sentimentElement.textContent = '未知';
    sentimentElement.className = 'sentiment-value sentiment-neutral';
  }
}

/**
 * 财经分析页面 JavaScript 功能
 * 用于处理和展示 JSON 格式的 AI 分析结果
 */

// 模拟 AI 分析结果数据（在实际环境中将通过 API 获取）
const mockAnalysisData = {
  "market_summary": "美联储维持利率不变，符合预期，但暗示年内可能降息，导致美股小幅上涨，国债收益率下降。",
  "impact_analysis": "美联储此次维持利率不变的决定符合市场预期，表明其对通胀仍持谨慎态度。然而，鲍威尔暗示年内可能降息，释放了鸽派信号，提振了市场情绪。短期内，股市可能受益于流动性预期改善，尤其是成长股和高估值板块。债市方面，10年期国债收益率下降反映了市场对降息的预期增强。长期来看，美联储的政策路径仍取决于通胀和经济数据的演变，投资者需密切关注后续数据发布。",
  "affected_industries": [
    {
      "industry": "科技",
      "companies": ["苹果", "微软", "英伟达"],
      "impact_level": "中"
    },
    {
      "industry": "金融",
      "companies": ["摩根大通", "高盛", "美国银行"],
      "impact_level": "低"
    },
    {
      "industry": "房地产",
      "companies": ["PulteGroup", "D.R. Horton", "Lennar"],
      "impact_level": "高"
    }
  ],
  "investment_advice": "投资者可适度增加对成长股和利率敏感型行业的配置，但需保持警惕，关注后续通胀数据和经济表现。债券投资者可考虑延长久期以捕捉潜在的降息收益。",
  "sentiment": "中性"
};

// 模拟相关新闻数据
const mockRelatedNews = [
  {
    title: "通胀数据好于预期，美股走高",
    url: "#",
    source: "财经早报",
    date: "2025-05-18"
  },
  {
    title: "鲍威尔：通胀回落路径并非一帆风顺",
    url: "#",
    source: "华尔街见闻",
    date: "2025-05-17"
  },
  {
    title: "市场押注美联储9月降息，美债收益率下滑",
    url: "#",
    source: "金十财经",
    date: "2025-05-16"
  }
];

/**
 * 加载并渲染分析数据
 * 在实际项目中，这个函数应该从API获取数据
 */
function loadAnalysisData() {
  // 在实际项目中替换为API调用
  const analysisData = mockAnalysisData;
  renderAnalysisData(analysisData);
}

/**
 * 渲染分析数据到页面
 * @param {Object} data - JSON格式的分析数据
 */
function renderAnalysisData(data) {
  const container = document.getElementById('analysis-container');
  
  // 清空加载状态
  container.innerHTML = '';
  
  // 创建市场摘要部分
  const summarySection = document.createElement('div');
  summarySection.className = 'analysis-summary';
  summarySection.innerHTML = `
    <h4 class="summary-title">市场摘要</h4>
    <p>${data.market_summary}</p>
  `;
  container.appendChild(summarySection);
  
  // 创建影响分析部分
  const impactSection = document.createElement('div');
  impactSection.className = 'impact-analysis';
  impactSection.innerHTML = `
    <h4>关键影响分析</h4>
    <p>${data.impact_analysis}</p>
  `;
  container.appendChild(impactSection);
  
  // 创建行业影响部分
  const industriesSection = document.createElement('div');
  industriesSection.className = 'affected-industries';
  industriesSection.innerHTML = '<h4>行业影响</h4>';
  
  // 添加每个受影响的行业
  data.affected_industries.forEach(industry => {
    const industryCard = document.createElement('div');
    industryCard.className = 'industry-card';
    
    // 确定影响等级样式
    let impactClass = 'impact-medium';
    if (industry.impact_level === '高') {
      impactClass = 'impact-high';
    } else if (industry.impact_level === '低') {
      impactClass = 'impact-low';
    }
    
    industryCard.innerHTML = `
      <div class="industry-header">
        <h5 class="industry-name">${industry.industry}</h5>
        <span class="impact-badge ${impactClass}">影响：${industry.impact_level}</span>
      </div>
      <div class="industry-body">
        <div class="industry-companies">
          ${industry.companies.map(company => `<span class="company-tag">${company}</span>`).join('')}
        </div>
      </div>
    `;
    
    industriesSection.appendChild(industryCard);
  });
  
  container.appendChild(industriesSection);
  
  // 创建投资建议部分
  const adviceSection = document.createElement('div');
  adviceSection.className = 'investment-advice';
  adviceSection.innerHTML = `
    <h4>投资建议</h4>
    <p>${data.investment_advice}</p>
    <div class="sentiment-indicator">
      <span class="sentiment-label">市场情绪：</span>
      <span class="sentiment-value ${getSentimentClass(data.sentiment)}">${data.sentiment}</span>
    </div>
  `;
  container.appendChild(adviceSection);
  
  // 添加图表展示（如果需要）
  if (document.getElementById('market-chart')) {
    createMarketChart();
  }
}

/**
 * 获取情绪对应的CSS类
 * @param {string} sentiment - 情绪值（积极/中性/消极）
 * @returns {string} - 对应的CSS类名
 */
function getSentimentClass(sentiment) {
  switch (sentiment) {
    case '积极':
      return 'sentiment-positive';
    case '消极':
      return 'sentiment-negative';
    case '中性':
    default:
      return 'sentiment-neutral';
  }
}

/**
 * 加载并渲染相关新闻
 */
function loadRelatedNews() {
  // 在实际项目中替换为API调用
  const relatedNews = mockRelatedNews;
  renderRelatedNews(relatedNews);
}

/**
 * 渲染相关新闻到页面
 * @param {Array} news - 相关新闻数组
 */
function renderRelatedNews(news) {
  const container = document.getElementById('related-news-container');
  
  // 清空加载状态
  container.innerHTML = '';
  
  // 添加每条相关新闻
  news.forEach(item => {
    const newsItem = document.createElement('div');
    newsItem.className = 'related-item';
    newsItem.innerHTML = `
      <h4 class="related-item-title">
        <a href="${item.url}">${item.title}</a>
      </h4>
      <div class="related-item-meta">
        <span class="source">${item.source}</span> · <span class="date">${item.date}</span>
      </div>
    `;
    
    container.appendChild(newsItem);
  });
}

/**
 * 创建市场图表（如果页面中有图表容器）
 */
function createMarketChart() {
  const ctx = document.getElementById('market-chart').getContext('2d');
  
  // 模拟图表数据
  const chartData = {
    labels: ['1月', '2月', '3月', '4月', '5月'],
    datasets: [{
      label: '美联储基准利率',
      backgroundColor: 'rgba(52, 152, 219, 0.2)',
      borderColor: 'rgba(52, 152, 219, 1)',
      borderWidth: 2,
      data: [5.50, 5.50, 5.50, 5.50, 5.50],
      pointRadius: 4,
      tension: 0.1
    }]
  };
  
  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: '美联储基准利率趋势'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 4.5,
          max: 6.0
        }
      }
    }
  });
}

/**
 * 创建动态加载财经分析数据的函数
 * @param {string} articleId - 文章ID
 */
function loadFinanceAnalysis(articleId) {
  // 在实际项目中，这里应该是API调用
  // 例如：fetch(`/api/analysis/${articleId}`)
  //      .then(response => response.json())
  //      .then(data => renderAnalysisData(data))
  //      .catch(error => showError(error));
  
  // 模拟加载延迟
  console.log(`加载文章ID: ${articleId} 的财经分析数据`);
  setTimeout(() => {
    renderAnalysisData(mockAnalysisData);
  }, 1000);
}

/**
 * 显示错误信息
 * @param {Error} error - 错误对象
 */
function showError(error) {
  const container = document.getElementById('analysis-container');
  container.innerHTML = `
    <div class="alert alert-danger" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      加载分析数据失败: ${error.message}
    </div>
  `;
}

// 初始化页面加载
document.addEventListener('DOMContentLoaded', function() {
  // 获取URL参数中的文章ID（如果有）
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id') || 'default';
  
  // 加载分析数据
  loadAnalysisData();
  // 加载相关新闻
  loadRelatedNews();
});

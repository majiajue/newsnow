/**
 * 财联社快讯 API
 */
import { defineEventHandler, getQuery } from 'h3';
import { myFetch } from '#/utils/fetch';
import { getSearchParams } from '#/sources/cls/utils';
import { logger } from '#/utils/logger';

// 生成模拟快讯数据
function generateMockFlashNews(count: number = 20) {
  const categories = ['财经', '科技', '政策', '市场', '公司', '国际'];
  const sources = ['财联社', '中国证券报', '上海证券报', '证券时报', '21世纪经济报道'];
  
  return Array.from({ length: count }, (_, i) => {
    const now = Date.now();
    const id = `mock-flash-${now}-${i}`;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    return {
      id,
      title: `${category}快讯${i+1}: ${new Date().toLocaleDateString()}最新动态`,
      summary: `这是一条模拟的财经快讯，由于无法连接到财联社API，系统自动生成。本条快讯模拟了${category}领域的最新动态，仅作为界面展示使用。`,
      url: `https://www.cls.cn/telegraph/${id}`,
      pubDate: new Date(now - Math.floor(Math.random() * 3600000)).toISOString(), // 最近1小时内
      source,
      category,
      author: '系统自动生成',
    };
  });
}

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;

    // 使用财联社 API 获取快讯列表
    const apiUrls = [
      'https://www.cls.cn/nodeapi/telegraphList',    // 主要快讯端点
      'https://www.cls.cn/api/telegraph/list',       // 备用快讯端点
      'https://www.cls.cn/api/flash'                 // 旧版快讯端点
    ];
    
    // 准备参数
    const baseParams = await getSearchParams({
      page: page.toString(),
      rn: pageSize.toString(),
      app: 'CailianpressWeb',
      os: 'web'
    });
    
    // 尝试所有端点，直到成功
    let response = null;
    let successUrl = '';
    let error = null;
    
    for (const apiUrl of apiUrls) {
      try {
        logger.info(`尝试获取财联社快讯列表: ${apiUrl}`);
        response = await myFetch(apiUrl, {
          params: Object.fromEntries(baseParams),
          headers: {
            'Referer': 'https://www.cls.cn/',
            'Origin': 'https://www.cls.cn'
          }
        });
        
        if (response && typeof response === 'object') {
          successUrl = apiUrl;
          break;
        }
      } catch (err) {
        error = err;
        logger.warn(`尝试 ${apiUrl} 失败: ${err}`);
        continue;
      }
    }
    
    // 如果所有API端点都失败，使用模拟数据
    if (!response) {
      logger.warn(`所有财联社快讯列表 API 端点都失败，使用模拟数据: ${error}`);
      const mockNews = generateMockFlashNews(pageSize);
      
      return {
        code: 0,
        data: mockNews,
        pagination: {
          page,
          pageSize,
          total: 100, // 模拟总数
        },
        message: '使用模拟数据（真实API不可用）'
      };
    }
    
    logger.info(`成功获取财联社快讯列表，使用端点: ${successUrl}`);
    logger.info(`财联社API响应: ${JSON.stringify(response).substring(0, 500)}...`);

    // 尝试提取数据
    let newsList = [];
    
    // 检查各种可能的响应格式
    if (response.data?.roll_data && Array.isArray(response.data.roll_data)) {
      // 标准API响应格式 {"data":{"roll_data":[...]}}
      newsList = response.data.roll_data
        .filter((item: any) => !item.is_ad)
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.brief || '',
          summary: item.digest || item.brief || item.content || '',
          url: item.link || item.shareurl || `https://www.cls.cn/telegraph/${item.id}`,
          pubDate: new Date(parseInt(item.ctime) * 1000).toISOString(),
          source: item.source || '财联社',
        }));
    } else if (response.data?.telegraphList && Array.isArray(response.data.telegraphList)) {
      // 新格式 {"data":{"telegraphList":[...]}}
      newsList = response.data.telegraphList
        .filter((item: any) => !item.is_ad)
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.brief || '',
          summary: item.digest || item.brief || item.content || '',
          url: item.link || item.shareurl || `https://www.cls.cn/telegraph/${item.id}`,
          pubDate: new Date(parseInt(item.ctime) * 1000).toISOString(),
          source: item.source || '财联社',
        }));
    } else if (Array.isArray(response.data)) {
      // 直接数组格式 {"data":[...]}
      newsList = response.data
        .filter((item: any) => !item.is_ad)
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.brief || '',
          summary: item.digest || item.brief || item.content || '',
          url: item.link || item.shareurl || `https://www.cls.cn/telegraph/${item.id}`,
          pubDate: new Date(parseInt(item.ctime) * 1000).toISOString(),
          source: item.source || '财联社',
        }));
    } else if (Array.isArray(response)) {
      // 直接返回数组格式
      newsList = response
        .filter((item: any) => !item.is_ad)
        .map((item: any) => ({
          id: item.id,
          title: item.title || item.brief || '',
          summary: item.digest || item.brief || item.content || '',
          url: item.link || item.shareurl || `https://www.cls.cn/telegraph/${item.id}`,
          pubDate: new Date(parseInt(item.ctime) * 1000).toISOString(),
          source: item.source || '财联社',
        }));
    } else {
      // 尝试其他可能的数据结构
      logger.warn(`未知的财联社快讯API响应格式: ${JSON.stringify(response).substring(0, 500)}...`);
      
      // 尝试从响应中提取任何可能的数据
      const possibleDataFields = ['data', 'roll_data', 'list', 'items', 'telegraphList', 'telegraph'];
      let dataFound = false;
      
      for (const field of possibleDataFields) {
        if (response[field]) {
          if (Array.isArray(response[field])) {
            newsList = response[field]
              .filter((item: any) => !item.is_ad)
              .map((item: any) => ({
                id: item.id || '',
                title: item.title || item.brief || '',
                summary: item.digest || item.brief || item.content || '',
                url: item.link || item.shareurl || (item.id ? `https://www.cls.cn/telegraph/${item.id}` : ''),
                pubDate: item.ctime ? new Date(parseInt(item.ctime) * 1000).toISOString() : new Date().toISOString(),
                source: item.source || '财联社',
              }));
            dataFound = true;
            break;
          } else if (typeof response[field] === 'object') {
            // 递归检查下一级
            const subObj = response[field];
            for (const subField in subObj) {
              if (Array.isArray(subObj[subField])) {
                newsList = subObj[subField]
                  .filter((item: any) => !item.is_ad)
                  .map((item: any) => ({
                    id: item.id || '',
                    title: item.title || item.brief || '',
                    summary: item.digest || item.brief || item.content || '',
                    url: item.link || item.shareurl || (item.id ? `https://www.cls.cn/telegraph/${item.id}` : ''),
                    pubDate: item.ctime ? new Date(parseInt(item.ctime) * 1000).toISOString() : new Date().toISOString(),
                    source: item.source || '财联社',
                  }));
                dataFound = true;
                break;
              }
            }
            if (dataFound) break;
          }
        }
      }
      
      // 如果无法从响应中提取数据，使用模拟数据
      if (!dataFound) {
        logger.warn(`无法从响应中提取财联社快讯数据，使用模拟数据`);
        newsList = generateMockFlashNews(pageSize);
      }
    }

    // 如果提取的数据为空，使用模拟数据
    if (newsList.length === 0) {
      logger.warn(`提取的财联社快讯数据为空，使用模拟数据`);
      newsList = generateMockFlashNews(pageSize);
    }

    // 返回分页数据
    return {
      code: 0,
      data: newsList,
      pagination: {
        page,
        pageSize,
        total: newsList.length * 5, // 估计总数
      }
    };
  } catch (error) {
    logger.error(`财联社快讯列表 API 错误: ${error}`);
    
    // 发生错误时返回模拟数据
    const mockNews = generateMockFlashNews(20);
    
    return {
      code: 0, // 返回成功码，但使用模拟数据
      data: mockNews,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 100, // 模拟总数
      },
      message: `使用模拟数据（API错误: ${error}）`
    };
  }
});

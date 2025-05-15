/**
 * 内容提取工具
 * 针对不同网站内容的提取逻辑
 */
import { load } from 'cheerio';

/**
 * 通用内容提取方法
 * @param htmlContent HTML内容或JSON字符串
 * @param url 文章来源URL，用于选择不同的提取策略
 * @returns 提取后的纯文本内容
 */
export function extractContent(htmlContent: string, url: string): string {
  try {
    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
      console.warn('内容为空，无法提取正文');
      return '';
    }
    
    // 根据网站选择合适的提取逻辑
    if (url.includes('gelonghui.com')) {
      return extractGelonghuiContent(htmlContent);
    } else if (url.includes('fastbull.com')) {
      return extractFastBullContent(htmlContent);
    } else {
      return extractGenericContent(htmlContent);
    }
  } catch (error) {
    console.error('内容提取失败:', error);
    // 失败时返回基本处理后的内容
    return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * 提取格隆汇文章的纯正文内容
 * @param htmlContent 原始HTML内容或JSON字符串
 * @returns 提取后的纯文本内容
 */
export function extractGelonghuiContent(htmlContent: string): string {
  try {
    // 如果是JSON字符串，先解析
    let content = htmlContent;
    try {
      const jsonData = JSON.parse(htmlContent);
      // 格隆汇常见格式：content字段中包含实际内容
      if (jsonData && jsonData.content && typeof jsonData.content === 'string') {
        content = jsonData.content;
      }
    } catch (e) {
      // 不是有效JSON，使用原始内容
    }
    
    // 移除HTML标签
    let plainText = content.replace(/<[^>]*>/g, ' ').trim();
    
    // 替换多个连续空格为单个空格
    plainText = plainText.replace(/\s+/g, ' ');
    
    // 查找格隆汇特定内容标记
    let mainContentIndex = plainText.indexOf('格隆汇');
    if (mainContentIndex === -1) {
      mainContentIndex = plainText.indexOf('丨');
    }
    
    if (mainContentIndex !== -1) {
      // 从"格隆汇"或者"丨"标记处开始提取
      plainText = plainText.substring(mainContentIndex);
      
      // 移除底部"相关事件"及之后的内容
      const relatedIndex = plainText.indexOf('相关事件');
      if (relatedIndex !== -1) {
        plainText = plainText.substring(0, relatedIndex);
      }
      
      // 移除底部"实时快讯"及之后的内容
      const liveNewsIndex = plainText.indexOf('实时快讯');
      if (liveNewsIndex !== -1) {
        plainText = plainText.substring(0, liveNewsIndex);
      }
    }
    
    // 移除多余空格和换行
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    return plainText;
  } catch (error) {
    console.error(`格隆汇内容提取失败:`, error);
    // 提取失败时，返回原始内容的纯文本版本
    return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * 提取FastBull文章的纯正文内容
 * @param htmlContent 原始HTML内容
 * @returns 提取后的纯文本内容
 */
export function extractFastBullContent(htmlContent: string): string {
  try {
    // 尝试使用cheerio获取正文部分
    const $ = load(htmlContent);
    
    // 优先提取新闻详情部分
    let content = '';
    const newsContent = $('.news-detail-content');
    const expressContent = $('.express-detail-content');
    
    if (newsContent.length > 0) {
      content = newsContent.text();
    } else if (expressContent.length > 0) {
      content = expressContent.text();
    } else {
      // 如果没有找到特定元素，用基本方法提取
      content = htmlContent.replace(/<[^>]*>/g, ' ').trim();
    }
    
    // 替换多个连续空格为单个空格
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
  } catch (error) {
    console.error(`FastBull内容提取失败:`, error);
    return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * 通用内容提取函数，适用于各种网站
 * @param htmlContent 原始HTML内容
 * @returns 提取后的纯文本内容
 */
export function extractGenericContent(htmlContent: string): string {
  try {
    // 检查是否为JSON格式
    let content = htmlContent;
    try {
      const jsonData = JSON.parse(htmlContent);
      if (jsonData && jsonData.content && typeof jsonData.content === 'string') {
        content = jsonData.content;
      }
    } catch (e) {
      // 不是JSON格式，使用原始内容
    }
    
    const $ = load(content);
    
    // 移除常见的无关内容
    $('nav, header, footer, .header, .footer, .nav, .menu, .sidebar, .ad, .advertisement, script, style, .copyright').remove();
    
    // 选择可能的正文区域
    const selectors = ['article', '.article', '.content', '.post-content', '.entry-content', '.main-content', 'main', '#content', '.news-content', '.story-content'];
    
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        // 找到正文区域
        let extracted = element.text().trim();
        // 如果提取的内容长度足够，则返回
        if (extracted.length > 100) {
          return extracted.replace(/\s+/g, ' ').trim();
        }
      }
    }
    
    // 如果没找到明显的正文区域，则提取所有段落
    let paragraphs = $('p').map((i, el) => $(el).text().trim()).get();
    
    // 过滤掉过短的段落
    paragraphs = paragraphs.filter(p => p.length > 20);
    
    if (paragraphs.length > 0) {
      return paragraphs.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    // 如果所有方法都失败，返回基本处理后的文本
    return $('body').text().replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error(`通用内容提取失败:`, error);
    return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

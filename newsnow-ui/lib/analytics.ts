// Google Analytics 事件跟踪工具

// Google Analytics测量ID
export const GA_MEASUREMENT_ID = 'G-EL9HHYE5LC';

// 页面浏览事件
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// 自定义事件跟踪
export const event = ({ action, category, label, value }: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// 常用事件类型
export const ANALYTICS_EVENTS = {
  // 文章相关事件
  ARTICLE: {
    VIEW: 'article_view',         // 查看文章
    SHARE: 'article_share',       // 分享文章
    LIKE: 'article_like',         // 点赞文章
    COMMENT: 'article_comment',   // 评论文章
    RELATED: 'related_article_click', // 点击相关文章
  },
  
  // 搜索相关事件
  SEARCH: {
    QUERY: 'search_query',        // 搜索查询
    RESULT_CLICK: 'search_result_click', // 点击搜索结果
    FILTER: 'search_filter',      // 使用搜索过滤器
  },
  
  // 导航相关事件
  NAVIGATION: {
    MENU: 'menu_click',           // 点击菜单
    CATEGORY: 'category_click',   // 点击分类
    TAB: 'tab_click',             // 点击标签页
  },
  
  // 用户行为事件
  USER: {
    LOGIN: 'user_login',          // 用户登录
    SIGNUP: 'user_signup',        // 用户注册
    PROFILE: 'profile_view',      // 查看个人资料
    SETTINGS: 'settings_change',  // 修改设置
  },
  
  // 广告相关事件
  AD: {
    VIEW: 'ad_view',              // 查看广告
    CLICK: 'ad_click',            // 点击广告
    IMPRESSION: 'ad_impression',  // 广告展示
  }
};

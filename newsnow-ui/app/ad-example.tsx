'use client';

import AdUnit from '@/components/ad-unit';
import { event, ANALYTICS_EVENTS } from '@/lib/analytics';

export default function AdExample() {
  // 示例：记录页面访问事件
  const handleReadMore = () => {
    event({
      action: ANALYTICS_EVENTS.ARTICLE.VIEW,
      category: '文章',
      label: '示例文章'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">广告展示示例</h1>
      
      {/* 顶部横幅广告 */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2">顶部横幅广告</p>
        <AdUnit 
          slot="1234567890" 
          format="horizontal"
          className="bg-gray-100 rounded-lg"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <article className="prose lg:prose-xl">
            <h2>文章内容示例</h2>
            <p>
              这是一个示例文章，展示如何在实际内容中集成广告。广告可以放置在文章的开头、中间或结尾，
              也可以放置在侧边栏中。合理的广告布局可以提高点击率，同时不影响用户体验。
            </p>
            
            {/* 文章内嵌广告 */}
            <div className="my-6">
              <AdUnit 
                slot="2345678901" 
                format="rectangle"
                className="bg-gray-100 rounded-lg"
              />
            </div>
            
            <p>
              在放置广告时，需要注意以下几点：
            </p>
            <ul>
              <li>不要放置过多广告，避免影响用户体验</li>
              <li>广告内容应该与网站主题相关</li>
              <li>避免广告内容与实际内容混淆</li>
              <li>移动设备上的广告应该响应式调整大小</li>
            </ul>
            
            <button 
              onClick={handleReadMore}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              阅读更多
            </button>
          </article>
          
          {/* 文章底部广告 */}
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-2">文章底部广告</p>
            <AdUnit 
              slot="3456789012" 
              format="horizontal"
              className="bg-gray-100 rounded-lg"
            />
          </div>
        </div>
        
        <div>
          {/* 侧边栏广告 */}
          <div className="sticky top-4">
            <p className="text-sm text-gray-500 mb-2">侧边栏广告</p>
            <AdUnit 
              slot="4567890123" 
              format="vertical"
              className="bg-gray-100 rounded-lg"
              style={{ minHeight: '600px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

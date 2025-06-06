// 为Google Analytics全局gtag函数定义类型
interface Window {
  gtag: (
    command: 'config' | 'event' | 'set',
    targetId: string,
    config?: {
      [key: string]: any;
    }
  ) => void;
  dataLayer: any[];
  
  // Google AdSense类型
  adsbygoogle: any[];
}

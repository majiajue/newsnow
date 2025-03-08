import { useTranslation } from "./TranslationProvider"

export function Footer() {
  const { translate } = useTranslation()

  const sources = [
    {
      category: translate("科技资讯"),
      links: [
        { name: translate("Hacker News"), url: "https://news.ycombinator.com" },
        { name: translate("Product Hunt"), url: "https://www.producthunt.com" },
        { name: translate("GitHub"), url: "https://github.com/trending" },
        { name: translate("IT之家"), url: "https://www.ithome.com" },
        { name: translate("V2EX"), url: "https://v2ex.com" },
        { name: translate("Linux中国"), url: "https://linux.cn" },
        { name: translate("Solidot"), url: "https://www.solidot.org" },
      ],
    },
    {
      category: translate("社交媒体"),
      links: [
        { name: translate("微博"), url: "https://weibo.com" },
        { name: translate("知乎"), url: "https://zhihu.com" },
        { name: translate("哔哩哔哩"), url: "https://bilibili.com" },
        { name: translate("抖音"), url: "https://douyin.com" },
        { name: translate("快手"), url: "https://kuaishou.com" },
        { name: translate("贴吧"), url: "https://tieba.baidu.com" },
        { name: translate("酷安"), url: "https://coolapk.com" },
      ],
    },
    {
      category: translate("新闻资讯"),
      links: [
        { name: translate("36氪"), url: "https://36kr.com" },
        { name: translate("澎湃新闻"), url: "https://thepaper.cn" },
        { name: translate("今日头条"), url: "https://toutiao.com" },
        { name: translate("参考消息"), url: "http://www.cankaoxiaoxi.com" },
        { name: translate("联合早报"), url: "https://www.zaobao.com" },
        { name: translate("卫星通讯社"), url: "http://sputniknews.cn" },
      ],
    },
    {
      category: translate("财经资讯"),
      links: [
        { name: translate("华尔街见闻"), url: "https://wallstreetcn.com" },
        { name: translate("雪球"), url: "https://xueqiu.com" },
        { name: translate("格隆汇"), url: "https://gelonghui.com" },
        { name: translate("金十数据"), url: "https://jin10.com" },
        { name: translate("FastBull"), url: "https://fastbull.cn" },
      ],
    },
  ]

  return (
    <footer className="mt-8 pb-4 text-sm text-neutral-400">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {sources.map(category => (
            <div key={category.category}>
              <h3 className="font-medium mb-4 text-neutral-500">{category.category}</h3>
              <ul className="space-y-2">
                {category.links.map(link => (
                  <li key={link.name}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-neutral-600 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <span>
            {translate("NewsNow  2025 By")}
            {" "}
          </span>
          <a
            href="https://github.com/majiajue/newsnow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 transition-colors"
          >
            {translate("majiajue")}
          </a>
        </div>
      </div>
    </footer>
  )
}

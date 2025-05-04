import { useTranslation } from "./TranslationProvider"

export function Footer() {
  const { t } = useTranslation()

  // 资讯分类菜单暂时不需要
  /*
  const sources = [
    {
      category: t("科技资讯"),
      links: [
        { name: t("Hacker News"), url: "https://news.ycombinator.com" },
        { name: t("Product Hunt"), url: "https://www.producthunt.com" },
        { name: t("GitHub"), url: "https://github.com/trending" },
        { name: t("IT之家"), url: "https://www.ithome.com" },
        { name: t("V2EX"), url: "https://v2ex.com" },
        { name: t("Linux中国"), url: "https://linux.cn" },
        { name: t("Solidot"), url: "https://www.solidot.org" },
      ],
    },
    {
      category: t("社交媒体"),
      links: [
        { name: t("微博"), url: "https://weibo.com" },
        { name: t("知乎"), url: "https://zhihu.com" },
        { name: t("哔哩哔哩"), url: "https://bilibili.com" },
        { name: t("抖音"), url: "https://douyin.com" },
        { name: t("快手"), url: "https://kuaishou.com" },
        { name: t("贴吧"), url: "https://tieba.baidu.com" },
        { name: t("酷安"), url: "https://coolapk.com" },
      ],
    },
    {
      category: t("新闻资讯"),
      links: [
        { name: t("36氪"), url: "https://36kr.com" },
        { name: t("澎湃新闻"), url: "https://thepaper.cn" },
        { name: t("今日头条"), url: "https://toutiao.com" },
        { name: t("参考消息"), url: "http://www.cankaoxiaoxi.com" },
        { name: t("联合早报"), url: "https://www.zaobao.com" },
        { name: t("卫星通讯社"), url: "http://sputniknews.cn" },
      ],
    },
    {
      category: t("财经资讯"),
      links: [
        { name: t("华尔街见闻"), url: "https://wallstreetcn.com" },
        { name: t("雪球"), url: "https://xueqiu.com" },
        { name: t("格隆汇"), url: "https://gelonghui.com" },
        { name: t("金十数据"), url: "https://jin10.com" },
        { name: t("FastBull"), url: "https://fastbull.cn" },
      ],
    },
  ]
  */

  return (
    <footer className="mt-8 pb-4 text-sm text-neutral-400">
      <div className="max-w-7xl mx-auto px-4">
        {/* 资讯分类菜单暂时不需要 */}
        {/*
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
        */}
        <div className="text-center pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <span>
            {t("NewsNow  2025 By")}
            {" "}
          </span>
          <a
            href="https://github.com/majiajue/newsnow"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 transition-colors"
          >
            {t("majiajue")}
          </a>
        </div>
      </div>
    </footer>
  )
}

import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const baseURL = "https://news.ycombinator.com"

  // 添加重试逻辑
  const maxRetries = 3
  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      const html: any = await myFetch(baseURL, {
        timeout: 100000, // 10秒超时
        retry: 3, // 允许一次重试
      })

      const $ = cheerio.load(html)
      const $main = $(".athing")
      const news: NewsItem[] = []
      $main.each((_, el) => {
        const a = $(el).find(".titleline a").first()
        // const url = a.attr("href")
        const title = a.text()
        const id = $(el).attr("id")
        const score = $(`#score_${id}`).text()
        const url = `${baseURL}/item?id=${id}`
        if (url && id && title) {
          news.push({
            url,
            title,
            id,
            extra: {
              info: score,
            },
          })
        }
      })
      return news
    } catch (error) {
      lastError = error
      if (i === maxRetries - 1) {
        throw new Error(`Failed to fetch Hacker News after ${maxRetries} attempts: ${error.message}`)
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }

  throw lastError
})

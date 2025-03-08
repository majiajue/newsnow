import { defineSource } from "#/utils/source"
import { myFetch } from "#/utils/fetch"
import { logger } from "#/utils/logger"

interface Res {
  data: {
    bang_topic: {
      topic_list: {
        topic_id: string
        topic_name: string
        create_time: number
        topic_url: string
      }[]
    }
  }
}

export default defineSource(async () => {
  try {
    const url = "https://tieba.baidu.com/hottopic/browse/topicList"
    logger.info(`Fetching tieba data from ${url}`)

    const res: Res = await myFetch(url)

    if (!res?.data?.bang_topic?.topic_list) {
      logger.error(`Invalid tieba response: ${JSON.stringify(res)}`)
      return []
    }

    const result = res.data.bang_topic.topic_list
      .map((k) => {
        return {
          id: k.topic_id,
          title: k.topic_name,
          url: k.topic_url,
        }
      })

    logger.success(`Fetched ${result.length} tieba items`)
    return result
  } catch (error) {
    logger.error(`Error fetching tieba data: ${error}`)
    return [] // 返回空数组而不是抛出错误
  }
})

import process from "node:process"
import type { NewsItem } from "@shared/types"
import type { Database } from "db0"
import type { CacheInfo, CacheRow } from "../types"

export class Cache {
  private db
  constructor(db: Database) {
    this.db = db
  }

  async init() {
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS cache (
        id TEXT PRIMARY KEY,
        updated INTEGER,
        data TEXT
      );
    `).run()
    logger.success(`init cache table`)
  }

  async set(key: string, value: NewsItem[]) {
    const now = Date.now()
    await this.db.prepare(
      `INSERT OR REPLACE INTO cache (id, data, updated) VALUES (?, ?, ?)`,
    ).run(key, JSON.stringify(value), now)
    logger.success(`set ${key} cache`)
  }

  async delete(key: string) {
    await this.db.prepare(`DELETE FROM cache WHERE id = ?`).run(key)
    logger.success(`删除缓存 ${key} 成功`)
  }

  async deleteAll() {
    await this.db.prepare(`DELETE FROM cache`).run()
    logger.success(`清空所有缓存成功`)
  }

  async get(key: string): Promise<CacheInfo | undefined > {
    try {
      console.log(`尝试获取缓存: ${key}`)
      const row = (await this.db.prepare(`SELECT id, data, updated FROM cache WHERE id = ?`).get(key)) as CacheRow | undefined

      if (row) {
        console.log(`找到缓存: ${key}, 更新时间: ${new Date(row.updated).toISOString()}`)
        try {
          const parsedData = JSON.parse(row.data)

          // 检查解析后的数据是否为数组
          if (Array.isArray(parsedData)) {
            logger.success(`获取缓存 ${key} 成功，数据是数组，长度: ${parsedData.length}`)
            return {
              id: row.id,
              updated: row.updated,
              items: parsedData,
            }
          } else if (parsedData && typeof parsedData === "object" && "items" in parsedData) {
            // 如果数据是旧格式的 CacheInfo 对象
            logger.success(`获取缓存 ${key} 成功，数据是对象，包含items`)
            return parsedData as CacheInfo
          } else {
            console.error(`缓存数据格式错误: ${key}`, typeof parsedData)
            return undefined
          }
        } catch (error) {
          console.error(`解析缓存数据失败: ${key}`, error)
          return undefined
        }
      } else {
        console.log(`未找到缓存: ${key}`)
        return undefined
      }
    } catch (error) {
      console.error(`获取缓存出错: ${key}`, error)
      return undefined
    }
  }

  async getEntire(keys: string[]): Promise<CacheInfo[]> {
    const keysStr = keys.map(k => `id = '${k}'`).join(" or ")
    const res = await this.db.prepare(`SELECT id, data, updated FROM cache WHERE ${keysStr}`).all() as any
    const rows = (res.results ?? res) as CacheRow[]

    /**
     * https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/#return-object
     * cloudflare d1 .all() will return
     * {
     *   success: boolean
     *   meta:
     *   results:
     * }
     */
    if (rows?.length) {
      logger.success(`get entire (...) cache`)
      return rows.map(row => ({
        id: row.id,
        updated: row.updated,
        items: JSON.parse(row.data) as NewsItem[],
      }))
    } else {
      return []
    }
  }

  async keys(): Promise<string[]> {
    try {
      const res = await this.db.prepare(`SELECT id FROM cache`).all() as any
      const rows = (res.results ?? res) as { id: string }[]

      if (rows?.length) {
        return rows.map(row => row.id)
      } else {
        return []
      }
    } catch (error) {
      console.error("获取所有缓存键出错:", error)
      return []
    }
  }
}

export async function getCacheTable() {
  try {
    // 如果没有数据库，这里不会报错，只会在第一次访问的时候报错
    const db = useDatabase()
    if (process.env.ENABLE_CACHE === "false") return
    const cacheTable = new Cache(db)
    if (process.env.INIT_TABLE !== "false") await cacheTable.init()
    return cacheTable
  } catch {
    // logger.error("failed to init database ", e)
  }
}

import process from "node:process"
import { UserTable } from "#/database/user"

export default defineEventHandler(async (event) => {
  try {
    const { id } = event.context.user
    if (!id) {
      throw createError({
        statusCode: 401,
        message: "未授权，请先登录",
      })
    }

    const db = useDatabase()
    if (!db) {
      console.error("[Sync API] 数据库连接失败")
      throw createError({
        statusCode: 500,
        message: "数据库连接失败",
      })
    }

    const userTable = new UserTable(db)
    if (process.env.INIT_TABLE !== "false") {
      try {
        await userTable.init()
      } catch (err) {
        console.error("[Sync API] 初始化用户表失败:", err)
        throw createError({
          statusCode: 500,
          message: "初始化用户表失败",
        })
      }
    }

    if (event.method === "GET") {
      try {
        const { data, updated } = await userTable.getData(id)
        console.log(`[Sync API] 成功获取用户 ${id} 的数据`)
        return {
          data: data ? JSON.parse(data) : undefined,
          updatedTime: updated,
        }
      } catch (err) {
        console.error(`[Sync API] 获取用户 ${id} 的数据失败:`, err)
        throw createError({
          statusCode: 500,
          message: "获取数据失败",
        })
      }
    } else if (event.method === "POST") {
      try {
        const body = await readBody(event)
        verifyPrimitiveMetadata(body)
        const { updatedTime, data } = body
        await userTable.setData(id, JSON.stringify(data), updatedTime)
        console.log(`[Sync API] 成功更新用户 ${id} 的数据`)
        return {
          success: true,
          updatedTime,
        }
      } catch (err) {
        if (err.name === "ZodError") {
          console.error(`[Sync API] 用户 ${id} 提交的数据格式无效:`, err)
          throw createError({
            statusCode: 400,
            message: "提交的数据格式无效",
          })
        }
        console.error(`[Sync API] 更新用户 ${id} 的数据失败:`, err)
        throw createError({
          statusCode: 500,
          message: "更新数据失败",
        })
      }
    } else {
      throw createError({
        statusCode: 405,
        message: "方法不允许",
      })
    }
  } catch (e) {
    logger.error(`[Sync API] 错误:`, e)
    if (e.statusCode) {
      throw e
    }
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "内部服务器错误",
    })
  }
})

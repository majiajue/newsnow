import process from "node:process"
import { jwtVerify } from "jose"
import { logger } from '~/utils/logger';

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith("/api")) return
  
  // 检查是否为开发环境
  const isDev = process.env.NODE_ENV === 'development'
  
  if (["JWT_SECRET", "G_CLIENT_ID", "G_CLIENT_SECRET"].find(k => !process.env[k])) {
    event.context.disabledLogin = true
    
    // 在开发环境中，不抛出错误，允许 API 请求通过
    if (!isDev && ["/api/s", "/api/proxy", "/api/latest"].every(p => !url.pathname.startsWith(p))) {
      throw createError({ statusCode: 506, message: "Server not configured, disable login" })
    }
  } else {
    if (["/api/s", "/api/me"].find(p => url.pathname.startsWith(p))) {
      const token = getHeader(event, "Authorization")?.replace(/Bearer\s*/, "")?.trim()
      if (token) {
        try {
          const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET)) as { payload?: { id: string, type: string } }
          if (payload?.id) {
            event.context.user = {
              id: payload.id,
              type: payload.type,
            }
          }
        } catch {
          if (url.pathname.startsWith("/api/me"))
            throw createError({ statusCode: 401, message: "JWT verification failed" })
          else logger.warn("JWT verification failed")
        }
      } else if (url.pathname.startsWith("/api/me")) {
        throw createError({ statusCode: 401, message: "JWT verification failed" })
      }
    }
  }
})

import type { FetchContext, FetchOptions } from "ofetch"
import { $fetch } from "ofetch"

// 创建一个包装函数，确保 URL 正确传递
export async function myFetch(url: string, options?: FetchOptions) {
  // 确保 URL 是字符串类型
  if (typeof url !== "string") {
    throw new TypeError(`URL 必须是字符串，收到的是: ${typeof url}`)
  }

  console.log(`发起请求: ${options?.method || "GET"} ${url}`)

  try {
    const response = await $fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        ...(options?.headers || {}),
      },
      timeout: options?.timeout || 60000, // 增加到60秒超时
      retry: 5, // 增加重试次数
      retryDelay: (_context: FetchContext) => {
        // 使用固定的指数退避策略
        // 第1次重试等待2秒，第2次4秒，第3次8秒，第4次10秒，第5次10秒
        return 2000 // 简化实现，使用固定延迟
      },
      ...options,
      onRequest({ options }) {
        // 请求开始时的处理
        console.log(`[Server] Request: ${options.method || "GET"} ${url}`)
      },
      onRequestError({ error }) {
        // 请求错误时的处理
        console.error(`[Server] Request Error for ${url}:`, error)
      },
      onResponse({ response }) {
        // 响应成功时的处理
        console.log(`[Server] Response: ${response.status} ${response._data ? `${JSON.stringify(response._data).substring(0, 100)}...` : ""}`)
      },
      onResponseError({ response, error }) {
        // 响应错误时的处理
        console.error(`[Server] Response Error for ${url}: ${response?.status || "Unknown"}`, error)
      },
    })

    return response
  } catch (error: any) {
    console.error(`请求失败 (${url}):`, error)

    // 提供更详细的错误信息
    if (error.name === "FetchError" && error.message && error.message.includes("timeout")) {
      throw new Error(`获取数据超时: ${url}，请稍后重试`)
    }

    throw error
  }
}

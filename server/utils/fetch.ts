import { $fetch } from "ofetch"

export const myFetch = $fetch.create({
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
  timeout: 30000, // 增加超时时间到30秒
  retry: 3,
  retryDelay: 500, // 添加重试延迟
  onRequest({ options }) {
    // 请求开始时的处理
    console.log(`[Server] Request: ${options.method} ${options.baseURL || ""}${options.url}`)
  },
  onRequestError({ error }) {
    // 请求错误时的处理
    console.error(`[Server] Request Error:`, error)
  },
  onResponse({ response }) {
    // 响应成功时的处理
    console.log(`[Server] Response: ${response.status} ${response._data ? `${JSON.stringify(response._data).substring(0, 100)}...` : ""}`)
  },
  onResponseError({ response, error }) {
    // 响应错误时的处理
    console.error(`[Server] Response Error: ${response?.status || "Unknown"}`, error)
  },
})

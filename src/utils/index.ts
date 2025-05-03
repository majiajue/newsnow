import type { MaybePromise } from "@shared/type.util"
import { $fetch } from "ofetch"

export function safeParseString(str: any) {
  try {
    return JSON.parse(str)
  } catch {
    return ""
  }
}

export class Timer {
  private timerId?: any
  private start!: number
  private remaining: number
  private callback: () => MaybePromise<void>

  constructor(callback: () => MaybePromise<void>, delay: number) {
    this.callback = callback
    this.remaining = delay
    this.resume()
  }

  pause() {
    clearTimeout(this.timerId)
    this.remaining -= Date.now() - this.start
  }

  resume() {
    this.start = Date.now()
    clearTimeout(this.timerId)
    this.timerId = setTimeout(this.callback, this.remaining)
  }

  clear() {
    clearTimeout(this.timerId)
  }
}

// 自定义 API 请求函数
export const myFetch = $fetch.create({
  baseURL: '/api',
  retry: 0,
  onRequest({ options }) {
    // 请求开始时的处理
    console.log(`开始请求: ${options.method || "GET"} ${options.baseURL}/${options.url || ''}`)
  },
  onRequestError({ error }) {
    // 请求错误时的处理
    console.error("请求错误:", error)
  },
  onResponse({ response }) {
    // 响应成功时的处理
    console.log(`请求成功: ${response.status}`)
  },
  onResponseError({ response, error }) {
    // 响应错误时的处理
    console.error(`响应错误: ${response?.status || "未知"}, ${error}`)
  }
})

export function isiOS() {
  return [
    "iPad Simulator",
    "iPhone Simulator",
    "iPod Simulator",
    "iPad",
    "iPhone",
    "iPod",
  ].includes(navigator.platform)
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

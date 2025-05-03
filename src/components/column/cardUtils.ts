import type { SourceID, SourceResponse } from "@shared/types"
import { useState } from "react"

// 简单的延迟函数
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 缓存和刷新源
export const cacheSources = new Map<string, SourceResponse>()
export const refetchSources = new Set<SourceID>()

// $ 函数用于合并类名
export const $ = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ")

// 简单的刷新函数
export function useRefetch() {
  return {
    refresh: (id: SourceID) => {
      refetchSources.add(id)
    },
  }
}

// 简单的聚焦函数
export function useFocusWith(_id: SourceID) {
  const [isFocused, setIsFocused] = useState(false)
  return {
    isFocused,
    toggleFocus: () => setIsFocused(!isFocused),
  }
}

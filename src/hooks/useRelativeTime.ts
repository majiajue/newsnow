import { useMount } from "react-use"
import { useState, useEffect } from "react"
import { atom, useAtomValue } from "jotai"
import { relativeTime } from "../../shared/utils"

/**
 * changed every minute
 */
const timerAtom = atom(0)

timerAtom.onMount = (set) => {
  const timer = setInterval(() => {
    set(Date.now())
  }, 60 * 1000)
  return () => clearInterval(timer)
}

function useVisibility() {
  const [visible, setVisible] = useState(true)
  useMount(() => {
    const handleVisibilityChange = () => {
      setVisible(document.visibilityState === "visible")
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  })
  return visible
}

export interface RelativeTimeResult {
  /**
   * 当前时间与传入时间的相对时间描述
   */
  value: string | undefined;
  
  /**
   * 格式化日期为相对时间的方法
   * @param date 要格式化的日期
   * @returns 相对时间描述
   */
  formatRelativeTime: (date: Date | string | number) => string;
}

export function useRelativeTime(timestamp?: string | number): RelativeTimeResult {
  const [time, setTime] = useState<string | undefined>(undefined)
  const timer = useAtomValue(timerAtom)
  const visible = useVisibility()

  useEffect(() => {
    if (visible && timestamp) {
      const t = relativeTime(timestamp)
      if (t) {
        setTime(t)
      }
    }
  }, [timestamp, timer, visible])

  // 提供一个格式化方法，可以直接格式化任意日期
  const formatRelativeTime = (date: Date | string | number): string => {
    // 如果是 Date 对象，转换为时间戳
    const timestampValue = date instanceof Date ? date.getTime() : date;
    return relativeTime(timestampValue) || "未知时间";
  }

  return {
    value: time,
    formatRelativeTime
  }
}

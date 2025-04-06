import React from "react"
import { useLoadingStatus } from "~/hooks/query"

interface LoadingIndicatorProps {
  sourceId: string
  showText?: boolean
  size?: "small" | "medium" | "large"
  variant?: "circular" | "linear"
}

// 状态文本映射
const statusTextMap: Record<string, string> = {
  idle: "等待加载",
  loading: "正在加载",
  success: "加载完成",
  error: "加载失败",
  cancelled: "已取消",
}

// 单个源的加载指示器
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  sourceId,
  showText = true,
  size = "medium",
  variant = "circular",
}) => {
  const status = useLoadingStatus(sourceId) as { status: string, progress: number }

  // 如果状态为空闲或成功，不显示指示器
  if (status.status === "idle" || status.status === "success") {
    return null
  }

  // 根据大小设置尺寸
  const getSize = () => {
    switch (size) {
      case "small":
        return "w-5 h-5"
      case "large":
        return "w-10 h-10"
      case "medium":
      default:
        return "w-7 h-7"
    }
  }

  // 获取状态文本
  const getStatusText = () => {
    const text = statusTextMap[status.status] || "正在加载"
    return status.progress > 0 ? `${text} (${Math.round(status.progress)}%)` : text
  }

  return (
    <div className="flex flex-col items-center p-2 bg-white/80 rounded shadow-sm">
      {variant === "circular"
        ? (
            <div className={`${getSize()} rounded-full border-2 border-t-transparent border-blue-500 animate-spin`}></div>
          )
        : (
            <div className="w-full max-w-[200px]">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full"
                  style={{ width: `${status.progress}%` }}
                >
                </div>
              </div>
            </div>
          )}

      {showText && (
        <div className="mt-1 text-xs text-gray-500">{getStatusText()}</div>
      )}
    </div>
  )
}

// 全局加载指示器，显示所有源的加载状态
export const GlobalLoadingIndicator: React.FC = () => {
  const { allSources } = useLoadingStatus() as { allSources: Record<string, { status: string, progress: number }> }

  // 计算加载中的源数量
  const loadingSources = Object.entries(allSources).filter(
    ([_, status]) => status.status === "loading",
  )

  // 如果没有正在加载的源，不显示指示器
  if (loadingSources.length === 0) {
    return null
  }

  // 计算总体进度
  const totalProgress = loadingSources.reduce(
    (sum, [_, status]) => sum + status.progress,
    0,
  ) / loadingSources.length

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center p-2 bg-white/90 rounded shadow-md">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
      <div className="ml-2 text-xs">
        正在加载
        {" "}
        {loadingSources.length}
        {" "}
        个数据源 (
        {Math.round(totalProgress)}
        %)
      </div>
    </div>
  )
}

// 特定数据源的加载指示器组件
export const SourceLoadingIndicator: React.FC<{ sourceId: string }> = ({ sourceId }) => {
  const status = useLoadingStatus(sourceId) as { status: string, progress: number }

  // 如果状态为空闲或成功，不显示指示器
  if (status.status === "idle" || status.status === "success") {
    return null
  }

  return (
    <div className="flex items-center mt-1">
      <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
      <div className="ml-1 text-xs text-gray-500">
        {statusTextMap[status.status] || "正在加载"}
        {status.progress > 0 ? ` (${Math.round(status.progress)}%)` : ""}
      </div>
    </div>
  )
}

export default LoadingIndicator

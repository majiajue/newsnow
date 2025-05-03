import type { PrimitiveMetadata } from "@shared/types"
import { useDebounce, useMount } from "react-use"
import { useAtom } from "jotai"
import { useLogin } from "./useLogin"
import { useToast } from "./useToast"
import { myFetch, safeParseString } from "~/utils"
import { preprocessMetadata, primitiveMetadataAtom } from "~/atoms/primitiveMetadataAtom"

async function uploadMetadata(metadata: PrimitiveMetadata) {
  const jwt = safeParseString(localStorage.getItem("jwt"))
  if (!jwt) return

  try {
    // 创建一个超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("同步请求超时")), 30000)
    })

    // 创建实际的请求Promise
    const fetchPromise = myFetch("me/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: {
        data: metadata.data,
        updatedTime: metadata.updatedTime,
      },
    })

    // 使用Promise.race来处理可能的超时
    await Promise.race([fetchPromise, timeoutPromise])
    console.log("[Sync] 数据上传成功")
  } catch (error) {
    console.error("[Sync] 上传数据时出错:", error)
    throw error // 重新抛出错误以便上层处理
  }
}

async function downloadMetadata(): Promise<PrimitiveMetadata | undefined> {
  const jwt = safeParseString(localStorage.getItem("jwt"))
  if (!jwt) return

  try {
    // 创建一个超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("同步请求超时")), 30000)
    })

    // 创建实际的请求Promise
    const fetchPromise = myFetch("me/sync", {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    })

    // 使用Promise.race来处理可能的超时
    const response = await Promise.race([fetchPromise, timeoutPromise]) as PrimitiveMetadata
    const { data, updatedTime } = response

    // 不用同步 action 字段
    if (data) {
      console.log("[Sync] 数据下载成功")
      return {
        action: "sync",
        data,
        updatedTime,
      }
    }
  } catch (error) {
    console.error("[Sync] 下载数据时出错:", error)
    throw error // 重新抛出错误以便上层处理
  }
}

export function useSync() {
  const [primitiveMetadata, setPrimitiveMetadata] = useAtom(primitiveMetadataAtom)
  const { logout, login } = useLogin()
  const toaster = useToast()

  useDebounce(async () => {
    const fn = async () => {
      try {
        await uploadMetadata(primitiveMetadata)
      } catch (e: any) {
        console.error("[Sync] 同步失败:", e)
        if (e.statusCode === 401 || e.statusCode === 403) {
          toaster("身份校验失败，无法同步，请重新登录", {
            type: "error",
            action: {
              label: "登录",
              onClick: login,
            },
          })
          logout()
        } else if (e.statusCode !== 506) {
          toaster("同步失败，请稍后重试", {
            type: "error",
          })
        }
      }
    }

    if (primitiveMetadata.action === "manual") {
      console.log("[Sync] 开始手动同步")
      fn()
    }
  }, 10000, [primitiveMetadata])

  useMount(() => {
    const fn = async () => {
      try {
        console.log("[Sync] 尝试下载数据")
        const metadata = await downloadMetadata()
        if (metadata) {
          console.log("[Sync] 处理下载的数据")
          setPrimitiveMetadata(preprocessMetadata(metadata))
        }
      } catch (e: any) {
        console.error("[Sync] 下载数据失败:", e)
        if (e.statusCode === 401 || e.statusCode === 403) {
          toaster("身份校验失败，无法同步，请重新登录", {
            type: "error",
            action: {
              label: "登录",
              onClick: login,
            },
          })
          logout()
        } else if (e.statusCode !== 506) {
          toaster("同步失败，请稍后重试", {
            type: "error",
          })
        }
      }
    }
    fn()
  })
}

const userAtom = atomWithStorage<{
  name?: string
  avatar?: string
}>("user", {})

const jwtAtom = atomWithStorage("jwt", "")

const enableLoginAtom = atomWithStorage<{
  enable: boolean
  url?: string
}>("login", {
  enable: true,
})

enableLoginAtom.onMount = (set) => {
  // 添加超时处理
  const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error("请求超时")), 10000)
  })

  // 实际请求
  const fetchPromise = myFetch("/enable-login")
    .then((r) => {
      set(r)
    })
    .catch((e) => {
      console.error("登录检查失败:", e)
      if (e.statusCode === 506) {
        set({ enable: false })
        localStorage.removeItem("jwt")
      } else {
        // 对于其他错误，默认启用登录
        set({ enable: true })
      }
    })

  // 使用 Promise.race 处理超时
  Promise.race([fetchPromise, timeoutPromise])
    .catch((e) => {
      console.error("登录检查出错或超时:", e)
      // 超时默认启用登录
      set({ enable: true })
    })
}

export function useLogin() {
  const userInfo = useAtomValue(userAtom)
  const jwt = useAtomValue(jwtAtom)
  const enableLogin = useAtomValue(enableLoginAtom)

  const login = useCallback(() => {
    window.location.href = enableLogin.url || "/api/login"
  }, [enableLogin])

  const logout = useCallback(() => {
    window.localStorage.clear()
    window.location.reload()
  }, [])

  return {
    loggedIn: !!jwt,
    userInfo,
    enableLogin: !!enableLogin.enable,
    logout,
    login,
  }
}

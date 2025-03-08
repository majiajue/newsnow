/**
 * 翻译配置
 */

// 是否使用 Cloudflare 翻译 API
// 启用Cloudflare翻译API

// 导入 process 模块
import * as process from "node:process"

export const USE_CLOUDFLARE_TRANSLATE = true

// Cloudflare API 配置
export const CLOUDFLARE_API = {
  // Cloudflare 账户 ID - 从环境变量中读取
  ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
  // Cloudflare API 密钥 - 从环境变量中读取
  API_KEY: process.env.CLOUDFLARE_API_KEY ?? "",
  // Cloudflare 翻译模型
  MODEL: process.env.CLOUDFLARE_MODEL ?? "@cf/meta/m2m100-1.2b",
}

// 备用翻译服务配置
export const BACKUP_TRANSLATE = {
  // 是否使用模拟翻译作为备用
  USE_MOCK: true,
}

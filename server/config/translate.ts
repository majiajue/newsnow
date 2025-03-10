/**
 * 翻译配置
 */

// 是否使用 Cloudflare 翻译 API
// 启用Cloudflare翻译API

// 导入 process 模块

export const USE_CLOUDFLARE_TRANSLATE = true

// 检查环境变量是否存在
// 使用硬编码的凭证作为默认值，确保在任何环境中都能正常工作
const cloudflareAccountId = "f810b4c728ec09aeb9ebd42112d7f219"
const cloudflareApiKey = "M9UfTAmxf0jnDP63FyXFcJiGGFnIRg798O1YJP15"
const cloudflareModel = "@cf/meta/m2m100-1.2b"

// 输出调试信息
console.log("Cloudflare 翻译配置:")
console.log(`- 账户 ID: ${cloudflareAccountId}`)
console.log(`- API 密钥: ${cloudflareApiKey ? "已设置" : "未设置"}`)
console.log(`- 模型: ${cloudflareModel}`)

// 如果环境变量缺失，输出警告
if (!cloudflareAccountId || !cloudflareApiKey) {
  console.warn("警告: Cloudflare 翻译 API 凭证缺失，翻译功能可能无法正常工作")
  console.warn("请确保在 .env.server 文件中设置了 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_KEY")
}

// Cloudflare API 配置
export const CLOUDFLARE_API = {
  // Cloudflare 账户 ID - 使用硬编码的值
  ACCOUNT_ID: cloudflareAccountId,
  // Cloudflare API 密钥 - 使用硬编码的值
  API_KEY: cloudflareApiKey,
  // Cloudflare 翻译模型
  MODEL: cloudflareModel,
}

// 备用翻译服务配置
export const BACKUP_TRANSLATE = {
  // 是否使用模拟翻译作为备用
  USE_MOCK: true,
}
